const prisma = require('../config/db');
const { bot, getBilingualMsg } = require('../config/telegram');

let ioInstance = null;

const setIo = (io) => {
  ioInstance = io;
};

const broadcastUpdate = async () => {
  try {
    const activeEntries = await prisma.queueEntry.findMany({
      where: {
        queueId: 1,
        status: { in: ['waiting', 'called'] }
      },
      orderBy: { ticketNumber: 'asc' }
    });

    if (ioInstance) {
      ioInstance.emit('queue_update', activeEntries);
    }

    // Notify Telegram users
    const waitingList = activeEntries.filter(e => e.status === 'waiting');
    
    if (waitingList.length > 0) {
      const nextUser = waitingList[0];
      if (nextUser.telegramChatId) {
        try {
          await bot.telegram.sendMessage(nextUser.telegramChatId, getBilingualMsg('next_alert'));
        } catch (e) { console.error('TG Notify Error:', e.message); }
      }
    }

    const calledUsers = activeEntries.filter(e => e.status === 'called');
    for (const user of calledUsers) {
      if (user.telegramChatId) {
        try {
          await bot.telegram.sendMessage(user.telegramChatId, getBilingualMsg('called_alert'));
        } catch (e) { console.error('TG Notify Error:', e.message); }
      }
    }
  } catch (err) {
    console.error('Broadcast error:', err);
  }
};

const notifySkipped = async (telegramChatId, reason) => {
  if (!telegramChatId) return;
  try {
    await bot.telegram.sendMessage(telegramChatId, getBilingualMsg('skipped_alert', { reason: reason || 'N/A' }));
  } catch (e) {
    console.error('TG Notify Error:', e.message);
  }
};

const broadcastSettings = (settings) => {
  if (ioInstance) {
    ioInstance.emit('settings_update', settings);
  }
};

module.exports = { setIo, broadcastUpdate, notifySkipped, broadcastSettings };
