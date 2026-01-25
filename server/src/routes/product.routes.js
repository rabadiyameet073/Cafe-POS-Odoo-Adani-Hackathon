const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleCheckMiddleware');
const { validate, validateUUIDParam } = require('../middleware/validationMiddleware');
const {
    createProductValidation,
    updateProductValidation,
    createVariantValidation,
    updateVariantValidation
} = require('../validators/productValidator');


router.get('/', verifyToken, productController.getAllProducts);

router.get('/category/:categoryId', verifyToken, validateUUIDParam('categoryId'), productController.getProductsByCategory);

router.get('/:id', verifyToken, validateUUIDParam('id'), productController.getProductById);

router.post('/', verifyToken, requireRoles('admin'), createProductValidation, validate, productController.createProduct);

router.put('/:id', verifyToken, validateUUIDParam('id'), requireRoles('admin'), updateProductValidation, validate, productController.updateProduct);

router.patch('/:id/availability', verifyToken, validateUUIDParam('id'), requireRoles('admin'), productController.toggleAvailability);


router.delete('/:id', verifyToken, validateUUIDParam('id'), requireRoles('admin'), productController.deleteProduct);

router.get('/:id/variants', verifyToken, validateUUIDParam('id'), productController.getProductVariants);

router.post('/:id/variants', verifyToken, validateUUIDParam('id'), requireRoles('admin'), createVariantValidation, validate, productController.createVariant);


router.put('/:id/variants/:variantId', verifyToken, validateUUIDParam('id'), requireRoles('admin'), updateVariantValidation, validate, productController.updateVariant);

router.delete('/:id/variants/:variantId', verifyToken, validateUUIDParam('id'), requireRoles('admin'), productController.deleteVariant);

module.exports = router;
