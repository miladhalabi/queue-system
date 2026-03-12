const prisma = require('../config/db');
const { broadcastSettings } = require('../services/notificationService');

const getSettings = async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const config = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });
    
    const settings = await prisma.setting.findMany();
    const config = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    
    broadcastSettings(config);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getSettings, updateSetting };
