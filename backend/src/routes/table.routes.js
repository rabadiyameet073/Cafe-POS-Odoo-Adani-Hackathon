const express = require('express');
const router = express.Router();

const tableController = require('../controllers/tableController');
const { verifyToken, requireAdmin, requireCashier } = require('../middleware/authMiddleware');
const { auditAdminAction } = require('../middleware/auditMiddleware');
const { validateUUIDParam } = require('../middleware/validationMiddleware');

router.get('/', verifyToken, tableController.getAllTables);

router.get('/available', verifyToken, tableController.getAvailableTables);

router.get('/floor/:floorId', verifyToken, validateUUIDParam('floorId'), tableController.getTablesByFloor);

router.get('/:id', verifyToken, validateUUIDParam('id'), tableController.getTableById);

router.post('/', verifyToken, requireAdmin, auditAdminAction('create_table'), tableController.createTable);

router.post('/select', verifyToken, tableController.selectTable);

router.post('/release', verifyToken, requireCashier, auditAdminAction('release_table'), tableController.releaseTable);

router.put('/:id', verifyToken, validateUUIDParam('id'), requireAdmin, auditAdminAction('update_table'), tableController.updateTable);

router.patch('/:id/status', verifyToken, validateUUIDParam('id'), requireCashier, auditAdminAction('update_table_status'), tableController.updateTableStatus);

router.delete('/:id', verifyToken, validateUUIDParam('id'), requireAdmin, auditAdminAction('delete_table'), tableController.deleteTable);

module.exports = router;
