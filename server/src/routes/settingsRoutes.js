const express = require('express');
const authenticateToken = require('../middleware/auth');
const { getSettings, updateSetting } = require('../controllers/settingsController');

const router = express.Router();

router.get('/', getSettings);
router.post('/', authenticateToken, updateSetting);

module.exports = router;
