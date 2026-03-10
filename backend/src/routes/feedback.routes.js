
const express = require('express');
const router = express.Router();

const feedbackController = require('../controllers/feedbackController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleCheckMiddleware');
const { validateUUIDParam } = require('../middleware/validationMiddleware');

router.post('/', verifyToken, feedbackController.submitFeedback);

router.get('/order/:orderId', verifyToken, validateUUIDParam('orderId'), feedbackController.getOrderFeedback);


router.get('/', verifyToken, requireRoles('admin'), feedbackController.getAllFeedback);

router.get('/stats', verifyToken, requireRoles('admin'), feedbackController.getFeedbackStats);

module.exports = router;
