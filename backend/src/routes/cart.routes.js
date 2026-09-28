const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Add item to cart
router.post('/add', optionalAuth, cartController.addToCart);

// Get cart by table token
router.get('/:tableToken', optionalAuth, cartController.getCart);

// Remove specific item from cart
router.delete('/:tableToken/item/:itemId', optionalAuth, cartController.removeCartItem);

// Clear entire cart
router.delete('/:tableToken', optionalAuth, cartController.clearCart);

module.exports = router;
