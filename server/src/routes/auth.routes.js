const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { signupValidation, loginValidation } = require('../validators/authValidator');

router.post('/signup', signupValidation, validate, authController.signup);

router.post('/login', loginValidation, validate, authController.login);

router.post('/logout', verifyToken, authController.logout);

router.get('/me', verifyToken, authController.getCurrentUser);

router.post('/refresh', verifyToken, authController.refreshToken);

module.exports = router;
