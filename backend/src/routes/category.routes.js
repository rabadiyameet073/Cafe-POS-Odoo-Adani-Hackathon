const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleCheckMiddleware');
const { validateUUIDParam } = require('../middleware/validationMiddleware');

router.get('/', optionalAuth, categoryController.getAllCategories);

router.get('/:id', optionalAuth, validateUUIDParam('id'), categoryController.getCategoryById);

router.post('/', verifyToken, requireRoles('admin'), categoryController.createCategory);

router.put('/:id', verifyToken, validateUUIDParam('id'), requireRoles('admin'), categoryController.updateCategory);

router.delete('/:id', verifyToken, validateUUIDParam('id'), requireRoles('admin'), categoryController.deleteCategory);

module.exports = router;
