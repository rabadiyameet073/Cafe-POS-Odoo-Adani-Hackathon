
const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleCheckMiddleware');


router.get('/sales', verifyToken, requireRoles('admin', 'cashier'), reportController.getSalesReport);

router.get('/products', verifyToken, requireRoles('admin'), reportController.getProductReport);

router.get('/sessions', verifyToken, requireRoles('admin', 'cashier'), reportController.getSessionReport);

router.get('/feedback', verifyToken, requireRoles('admin'), reportController.getFeedbackReport);

router.post('/export/pdf', verifyToken, requireRoles('admin'), reportController.exportPDF);

router.post('/export/excel', verifyToken, requireRoles('admin'), reportController.exportExcel);

module.exports = router;
