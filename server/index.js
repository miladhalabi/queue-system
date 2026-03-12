const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Config & Services
const prisma = require('./src/config/db');
const { setIo, broadcastUpdate } = require('./src/services/notificationService');
const { initBotHandlers } = require('./src/services/telegramHandler');
const { bot } = require('./src/config/telegram');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const queueRoutes = require('./src/routes/queueRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "DELETE"]
  }
});

const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// --- Global Setup ---
setIo(io);
initBotHandlers(broadcastUpdate);

// --- Middleware ---
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/settings', settingsRoutes);

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
