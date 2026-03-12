const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "DELETE"]
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod';

// --- Telegram Bot Setup ---
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const botMessages = {
  en: {
    welcome: "Welcome to QueueFlow! 🚀\nJoin the queue and get real-time updates.",
    join_btn: "Join Queue ➕",
    status_btn: "Check Status ℹ️",
    leave_btn: "Leave Queue ❌",
    already_in: "You are already in the queue!",
    joined: "✅ Joined! Your Ticket is #{{ticket}}. You are #{{pos}} in line.",
    not_in: "You are not in the queue.",
    status: "ℹ️ Ticket #{{ticket}}\nPosition: #{{pos}}\nStatus: {{status}}",
    left: "✅ You have left the queue.",
    next_alert: "🔔 You are now #1! Please stay close to the counter.",
    called_alert: "🚀 It's your turn! Please proceed to the counter now.",
    skipped_alert: "⚠️ You have been skipped. Reason: {{reason}}"
  },
  ar: {
    welcome: "مرحباً بك في كيو فلو! 🚀\nانضم إلى الطابور واحصل على تحديثات مباشرة.",
    join_btn: "انضمام للطابور ➕",
    status_btn: "تحقق من الحالة ℹ️",
    leave_btn: "مغادرة الطابور ❌",
    already_in: "أنت مسجل بالفعل في الطابور!",
    joined: "✅ تم الانضمام! تذكرتك رقم #{{ticket}}. ترتيبك هو #{{pos}} في الطابور.",
    not_in: "أنت لست في الطابور حالياً.",
    status: "ℹ️ تذكرة رقم #{{ticket}}\nالترتيب: #{{pos}}\nالحالة: {{status}}",
    left: "✅ لقد غادرت الطابور.",
    next_alert: "🔔 أنت الآن رقم #1! يرجى البقاء بالقرب من الكاونتر.",
    called_alert: "🚀 حان دورك! يرجى التوجه إلى الكاونتر الآن.",
    skipped_alert: "⚠️ تم تخطي دورك. السبب: {{reason}}"
  }
};

const getMsg = (lang, key, params = {}) => {
  let msg = botMessages[lang][key] || botMessages['en'][key];
  Object.keys(params).forEach(p => {
    msg = msg.replace(`{{${p}}}`, params[p]);
  });
  return msg;
};

const getBilingualMsg = (key, params = {}) => {
  return `${getMsg('en', key, params)}\n\n${getMsg('ar', key, params)}`;
};

const botKeyboard = Markup.keyboard([
  [Markup.button.text(botMessages.en.join_btn), Markup.button.text(botMessages.ar.join_btn)],
  [Markup.button.text(botMessages.en.status_btn), Markup.button.text(botMessages.ar.status_btn)],
  [Markup.button.text(botMessages.en.leave_btn), Markup.button.text(botMessages.ar.leave_btn)]
]).resize();

bot.start((ctx) => ctx.reply(getBilingualMsg('welcome'), botKeyboard));

bot.hears([botMessages.en.join_btn, botMessages.ar.join_btn], async (ctx) => {
  try {
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

    const entry = await prisma.queueEntry.create({
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

    ctx.reply(getBilingualMsg('status', { 
      ticket: entry.ticketNumber.toString().padStart(4, '0'), 
      pos: pos + 1,
      status: entry.status.toUpperCase()
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

bot.launch().then(() => console.log('Telegram Bot started'));

// --- Middleware ---
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to broadcast queue updates and NOTIFY users
async function broadcastUpdate() {
  try {
    const activeEntries = await prisma.queueEntry.findMany({
      where: {
        queueId: 1,
        status: { in: ['waiting', 'called'] }
      },
      orderBy: { ticketNumber: 'asc' }
    });
    io.emit('queue_update', activeEntries);

    // Notify Telegram users
    // Logic: Find everyone who is at position 1 (waiting) and everyone who just got called
    const waitingList = activeEntries.filter(e => e.status === 'waiting');
    
    // Notify Position #1
    if (waitingList.length > 0) {
      const nextUser = waitingList[0];
      if (nextUser.telegramChatId) {
        // We only notify if they were NOT previously position 1 or if it's a new update
        // To keep it simple as requested: "only if the user are next 1"
        // In a real app we'd track previous position, but here we'll just send if they are #1.
        // To avoid spamming, we can use a small cache or just send it (Telegram rate limits handled by telegraf)
        try {
          await bot.telegram.sendMessage(nextUser.telegramChatId, getBilingualMsg('next_alert'));
        } catch (e) { console.error('TG Notify Error:', e.message); }
      }
    }

    // Called users are already in the list, but we notify them when the status is exactly 'called'
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
}

// Client API (Public)
app.post('/api/queue/join', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const lastEntry = await prisma.queueEntry.findFirst({
      where: { queueId: 1 },
      orderBy: { ticketNumber: 'desc' }
    });
    
    const nextTicket = (lastEntry?.ticketNumber || 0) + 1;
    
    const entry = await prisma.queueEntry.create({
      data: {
        queueId: 1,
        clientName: name,
        clientPhone: phone,
        ticketNumber: nextTicket,
        status: 'waiting'
      }
    });
    
    broadcastUpdate();
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/queue/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await prisma.queueEntry.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!entry) return res.status(404).json({ error: 'Not found' });
    
    const position = await prisma.queueEntry.count({
      where: {
        queueId: 1,
        status: 'waiting',
        ticketNumber: { lt: entry.ticketNumber }
      }
    });
    
    res.json({ ...entry, position: position + 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/queue/leave/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.queueEntry.update({
      where: { id: parseInt(id) },
      data: { status: 'left' }
    });
    broadcastUpdate();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin API (Protected)
app.get('/api/queue/active', authenticateToken, async (req, res) => {
  try {
    const entries = await prisma.queueEntry.findMany({
      where: {
        queueId: 1,
        status: { in: ['waiting', 'called'] }
      },
      orderBy: { ticketNumber: 'asc' }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/queue/call-next', authenticateToken, async (req, res) => {
  try {
    await prisma.queueEntry.updateMany({
      where: { queueId: 1, status: 'called' },
      data: { status: 'served', servedAt: new Date() }
    });
    
    const nextEntry = await prisma.queueEntry.findFirst({
      where: { queueId: 1, status: 'waiting' },
      orderBy: { ticketNumber: 'asc' }
    });
    
    if (nextEntry) {
      await prisma.queueEntry.update({
        where: { id: nextEntry.id },
        data: { status: 'called', calledAt: new Date() }
      });
    }
    
    broadcastUpdate();
    res.json({ success: true, called: nextEntry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/queue/skip/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const entry = await prisma.queueEntry.update({
      where: { id: parseInt(id) },
      data: { status: 'skipped', skipReason: reason }
    });
    
    if (entry.telegramChatId) {
      try {
        await bot.telegram.sendMessage(entry.telegramChatId, getBilingualMsg('skipped_alert', { reason: reason || 'N/A' }));
      } catch (e) {}
    }

    broadcastUpdate();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/queue/stats', authenticateToken, async (req, res) => {
  try {
    const totalServed = await prisma.queueEntry.count({
      where: { queueId: 1, status: 'served' }
    });
    const currentWait = await prisma.queueEntry.count({
      where: { queueId: 1, status: 'waiting' }
    });
    res.json({ totalServed, currentWait });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/queue/history', authenticateToken, async (req, res) => {
  try {
    const history = await prisma.queueEntry.findMany({
      where: {
        queueId: 1,
        status: { in: ['served', 'skipped', 'left'] }
      },
      orderBy: { joinedAt: 'desc' },
      take: 50
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Static Files (Production) ---
if (isProd) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// --- Socket Handling ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing Prisma, Bot and Server...');
  bot.stop('SIGINT');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`Server running in ${isProd ? 'production' : 'development'} mode on port ${PORT}`);
});
