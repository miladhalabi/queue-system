const prisma = require('../config/db');
const { broadcastUpdate, notifySkipped } = require('../services/notificationService');

// --- Public Actions ---

const join = async (req, res) => {
  try {
    const { name, phone, reason } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const requireReasonSetting = await prisma.setting.findUnique({ where: { key: 'requireReason' } });
    if (requireReasonSetting?.value === 'true' && !reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

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
        clientReason: reason,
        ticketNumber: nextTicket,
        status: 'waiting'
      }
    });
    
    broadcastUpdate();
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStatus = async (req, res) => {
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
};

const leave = async (req, res) => {
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
};

// --- Admin Actions ---

const getActive = async (req, res) => {
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
};

const callNext = async (req, res) => {
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
};

const skip = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const entry = await prisma.queueEntry.update({
      where: { id: parseInt(id) },
      data: { status: 'skipped', skipReason: reason }
    });
    
    if (entry.telegramChatId) {
      notifySkipped(entry.telegramChatId, reason);
    }

    broadcastUpdate();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStats = async (req, res) => {
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
};

const getHistory = async (req, res) => {
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
};

module.exports = {
  join,
  getStatus,
  leave,
  getActive,
  callNext,
  skip,
  getStats,
  getHistory
};
