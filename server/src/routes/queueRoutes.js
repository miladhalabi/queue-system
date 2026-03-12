const express = require('express');
const authenticateToken = require('../middleware/auth');
const {
  join,
  getStatus,
  leave,
  getActive,
  callNext,
  skip,
  getStats,
  getHistory
} = require('../controllers/queueController');

const router = express.Router();

// Public
router.post('/join', join);
router.get('/status/:id', getStatus);
router.delete('/leave/:id', leave);

// Admin Protected
router.get('/active', authenticateToken, getActive);
router.post('/call-next', authenticateToken, callNext);
router.post('/skip/:id', authenticateToken, skip);
router.get('/stats', authenticateToken, getStats);
router.get('/history', authenticateToken, getHistory);

module.exports = router;
