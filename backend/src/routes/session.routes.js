const express = require('express');
const router = express.Router();

const sessionController = require('../controllers/sessionController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleCheckMiddleware');
const { validateUUIDParam } = require('../middleware/validationMiddleware');

router.get('/', verifyToken, requireRoles('admin', 'cashier'), sessionController.getAllSessions);


router.get('/active', verifyToken, sessionController.getActiveSession);

router.get('/:id', verifyToken, validateUUIDParam('id'), requireRoles('admin', 'cashier'), sessionController.getSessionById);

router.post('/open', verifyToken, requireRoles('admin', 'cashier'), sessionController.openSession);

router.post('/:id/close', verifyToken, validateUUIDParam('id'), requireRoles('admin', 'cashier'), sessionController.closeSession);

module.exports = router;
