const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles, requireSelfOrAdmin } = require('../middleware/roleCheckMiddleware');
const { validateUUIDParam } = require('../middleware/validationMiddleware');

router.get('/', verifyToken, requireRoles('admin'), userController.getAllUsers);

router.get('/:id', verifyToken, validateUUIDParam('id'), requireSelfOrAdmin('id'), userController.getUserById);

router.patch('/:id', verifyToken, validateUUIDParam('id'), requireSelfOrAdmin('id'), userController.updateUser);
router.delete('/:id', verifyToken, validateUUIDParam('id'), requireRoles('admin'), userController.deactivateUser);

module.exports = router;
