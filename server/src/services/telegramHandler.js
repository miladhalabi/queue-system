const prisma = require('../config/db');
const { bot, botMessages, getBilingualMsg } = require('../config/telegram');
const { Markup } = require('telegraf');

// Simple state management for "Join with Reason" flow
const userStates = new Map();

async function getBotKeyboard() {
  const requireReasonSetting = await prisma.setting.findUnique({ where: { key: 'requireReason' } });
  const requireReason = requireReasonSetting?.value === 'true';

  const buttons = [];
  if (!requireReason) {
    buttons.push([Markup.button.text(botMessages.en.join_btn), Markup.button.text(botMessages.ar.join_btn)]);
  }
  buttons.push([Markup.button.text(botMessages.en.join_reason_btn), Markup.button.text(botMessages.ar.join_reason_btn)]);
  buttons.push([Markup.button.text(botMessages.en.status_btn), Markup.button.text(botMessages.ar.status_btn)]);
  buttons.push([Markup.button.text(botMessages.en.leave_btn), Markup.button.text(botMessages.ar.leave_btn)]);

  return Markup.keyboard(buttons).resize();
}

const initBotHandlers = (broadcastUpdate) => {
  bot.start(async (ctx) => {
    const keyboard = await getBotKeyboard();
    ctx.reply(getBilingualMsg('welcome'), keyboard);
  });

  bot.hears([botMessages.en.join_btn, botMessages.ar.join_btn], async (ctx) => {
    try {
      const requireReasonSetting = await prisma.setting.findUnique({ where: { key: 'requireReason' } });
      if (requireReasonSetting?.value === 'true') {
        return ctx.reply(getBilingualMsg('reason_required'));
      }

      const chatId = ctx.chat.id.toString();
      const existing = await prisma.queueEntry.findFirst({
        where: { telegramChatId: chatId, status: { in: ['waiting', 'called'] } }
      });

      if (existing) return ctx.reply(getBilingualMsg('already_in'));

      const name = ctx.from.first_name || 'Telegram User';
      const lastEntry = await prisma.queueEntry.findFirst({
        where: { queueId: 1 },
        orderBy: { ticketNumber: 'desc' }
      });
      const nextTicket = (lastEntry?.ticketNumber || 0) + 1;

      await prisma.queueEntry.create({
        data: {
          queueId: 1,
          clientName: name,
          ticketNumber: nextTicket,
          status: 'waiting',
          telegramChatId: chatId
        }
      });

      const pos = await prisma.queueEntry.count({
        where: { queueId: 1, status: 'waiting', ticketNumber: { lt: nextTicket } }
      });

      ctx.reply(getBilingualMsg('joined', { ticket: nextTicket.toString().padStart(4, '0'), pos: pos + 1 }));
      broadcastUpdate();
    } catch (err) {
      console.error(err);
      ctx.reply("Error joining queue.");
    }
  });

  bot.hears([botMessages.en.join_reason_btn, botMessages.ar.join_reason_btn], async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const existing = await prisma.queueEntry.findFirst({
      where: { telegramChatId: chatId, status: { in: ['waiting', 'called'] } }
    });

    if (existing) return ctx.reply(getBilingualMsg('already_in'));

    userStates.set(chatId, { step: 'AWAITING_REASON' });
    ctx.reply(getBilingualMsg('ask_reason'));
  });

  bot.hears([botMessages.en.status_btn, botMessages.ar.status_btn], async (ctx) => {
    try {
      const chatId = ctx.chat.id.toString();
      const entry = await prisma.queueEntry.findFirst({
        where: { telegramChatId: chatId, status: { in: ['waiting', 'called'] } }
      });

      if (!entry) return ctx.reply(getBilingualMsg('not_in'));

      const pos = await prisma.queueEntry.count({
        where: { queueId: 1, status: 'waiting', ticketNumber: { lt: entry.ticketNumber } }
      });

      const reasonStr = entry.clientReason ? `\nReason: ${entry.clientReason}` : "";

      ctx.reply(getBilingualMsg('status', { 
        ticket: entry.ticketNumber.toString().padStart(4, '0'), 
        pos: pos + 1,
        status: entry.status.toUpperCase(),
        reason: reasonStr
      }));
    } catch (err) {
      console.error(err);
    }
  });

  bot.hears([botMessages.en.leave_btn, botMessages.ar.leave_btn], async (ctx) => {
    try {
      const chatId = ctx.chat.id.toString();
      const entry = await prisma.queueEntry.findFirst({
        where: { telegramChatId: chatId, status: { in: ['waiting', 'called'] } }
      });

      if (!entry) return ctx.reply(getBilingualMsg('not_in'));

      await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { status: 'left' }
      });

      ctx.reply(getBilingualMsg('left'));
      broadcastUpdate();
    } catch (err) {
      console.error(err);
    }
  });

  bot.on('text', async (ctx, next) => {
    const text = ctx.message.text;
    const chatId = ctx.chat.id.toString();
    const state = userStates.get(chatId);

    if (text.startsWith('/') || [
      botMessages.en.join_btn, botMessages.ar.join_btn,
      botMessages.en.join_reason_btn, botMessages.ar.join_reason_btn,
      botMessages.en.status_btn, botMessages.ar.status_btn,
      botMessages.en.leave_btn, botMessages.ar.leave_btn
    ].includes(text)) {
      userStates.delete(chatId);
      return next();
    }

    if (state && state.step === 'AWAITING_REASON') {
      userStates.delete(chatId);
      try {
        const name = ctx.from.first_name || 'Telegram User';
        const lastEntry = await prisma.queueEntry.findFirst({
          where: { queueId: 1 },
          orderBy: { ticketNumber: 'desc' }
        });
        const nextTicket = (lastEntry?.ticketNumber || 0) + 1;

        await prisma.queueEntry.create({
          data: {
            queueId: 1,
            clientName: name,
            ticketNumber: nextTicket,
            status: 'waiting',
            telegramChatId: chatId,
            clientReason: text
          }
        });

        const pos = await prisma.queueEntry.count({
          where: { queueId: 1, status: 'waiting', ticketNumber: { lt: nextTicket } }
        });

        ctx.reply(getBilingualMsg('joined', { ticket: nextTicket.toString().padStart(4, '0'), pos: pos + 1 }));
        broadcastUpdate();
        return;
      } catch (err) {
        console.error(err);
        return ctx.reply("Error joining queue.");
      }
    }

    try {
      const entry = await prisma.queueEntry.findFirst({
        where: { telegramChatId: chatId, status: 'waiting' },
        orderBy: { joinedAt: 'desc' }
      });

      if (entry) {
        await prisma.queueEntry.update({
          where: { id: entry.id },
          data: { clientReason: text }
        });
        ctx.reply(getBilingualMsg('reason_updated', { reason: text }));
        broadcastUpdate();
      } else {
        return next();
      }
    } catch (err) {
      console.error(err);
      return next();
    }
  });

  bot.launch().then(() => console.log('Telegram Bot started'));
};

module.exports = { initBotHandlers };
