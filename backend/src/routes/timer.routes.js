const express = require('express');
const router = express.Router();

const timerController = require('../controllers/timerController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { auditAdminAction } = require('../middleware/auditMiddleware');

// Get all active timers (admin only)
router.get('/active', verifyToken, requireAdmin, timerController.getActiveTimers);

// Reset timer to 39 minutes (admin only)
router.post('/reset', verifyToken, requireAdmin, auditAdminAction('reset_timer'), timerController.resetTimer);

// Extend timer by specified minutes (admin only)
router.post('/extend', verifyToken, requireAdmin, auditAdminAction('extend_timer'), timerController.extendTimer);

// Stop timer and free table immediately (admin only)
router.post('/stop', verifyToken, requireAdmin, auditAdminAction('stop_timer'), timerController.stopTimer);

module.exports = router;
