const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { auditAdminAction } = require('../middleware/auditMiddleware');

// Get all occupied tables with timer and order info (admin only)
router.get('/occupied-tables', verifyToken, requireAdmin, adminController.getOccupiedTables);

// Get dashboard summary statistics (admin only)
router.get('/dashboard-stats', verifyToken, requireAdmin, adminController.getDashboardStats);

// Monitor payments with filters (admin only)
router.get('/payments/monitor', verifyToken, requireAdmin, adminController.monitorPayments);

// Get audit logs (admin only)
router.get('/audit-logs', verifyToken, requireAdmin, auditAdminAction('view_audit_logs'), adminController.getAdminAuditLogs);

module.exports = router;
