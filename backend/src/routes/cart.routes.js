const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

// Add item to cart
router.post('/add', verifyToken, cartController.addToCart);

// Get cart by table token
router.get('/:tableToken', verifyToken, cartController.getCart);

// Remove specific item from cart
router.delete('/:tableToken/item/:itemId', verifyToken, cartController.removeCartItem);

// Clear entire cart
router.delete('/:tableToken', verifyToken, cartController.clearCart);

module.exports = router;
