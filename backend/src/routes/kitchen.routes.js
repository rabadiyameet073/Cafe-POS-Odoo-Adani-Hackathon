
const express = require('express');
const router = express.Router();

const kitchenController = require('../controllers/kitchenController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleCheckMiddleware');
const { validateUUIDParam } = require('../middleware/validationMiddleware');

router.get('/orders', verifyToken, requireRoles('kitchen', 'admin', 'cashier'), kitchenController.getKitchenOrders);

router.get('/orders/:id', verifyToken, validateUUIDParam('id'), requireRoles('kitchen', 'admin'), kitchenController.getKitchenOrderById);

router.patch('/orders/:id/stage', verifyToken, validateUUIDParam('id'), requireRoles('kitchen', 'admin'), kitchenController.updateOrderStage);

router.patch('/orders/:id/items/:itemId', verifyToken, validateUUIDParam('id'), requireRoles('kitchen', 'admin'), kitchenController.markItemPrepared);

router.delete('/orders/:id', verifyToken, validateUUIDParam('id'), requireRoles('kitchen', 'admin', 'cashier'), kitchenController.deleteKitchenOrder);

module.exports = router;
