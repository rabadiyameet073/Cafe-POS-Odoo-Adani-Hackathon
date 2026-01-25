const express = require('express');
const router = express.Router();

const tableController = require('../controllers/tableController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleCheckMiddleware');
const { validateUUIDParam } = require('../middleware/validationMiddleware');

router.get('/', verifyToken, tableController.getAllTables);

router.get('/available', verifyToken, tableController.getAvailableTables);

router.get('/floor/:floorId', verifyToken, validateUUIDParam('floorId'), tableController.getTablesByFloor);

router.get('/:id', verifyToken, validateUUIDParam('id'), tableController.getTableById);

router.post('/', verifyToken, requireRoles('admin'), tableController.createTable);

router.put('/:id', verifyToken, validateUUIDParam('id'), requireRoles('admin'), tableController.updateTable);

router.patch('/:id/status', verifyToken, validateUUIDParam('id'), requireRoles('admin', 'cashier'), tableController.updateTableStatus);

router.delete('/:id', verifyToken, validateUUIDParam('id'), requireRoles('admin'), tableController.deleteTable);

module.exports = router;
