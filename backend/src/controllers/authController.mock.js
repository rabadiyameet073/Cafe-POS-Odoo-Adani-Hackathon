const bcrypt = require('bcryptjs');
const { generateToken } = require('../services/tokenService');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, ConflictError, AuthenticationError, NotFoundError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// In-memory user storage for testing (replace with database in production)
const users = new Map();

// Pre-seed demo accounts
const initializeDemoAccounts = async () => {
    const demoAccounts = [
        { email: 'cashier@demo.com', password: 'demo123', full_name: 'Demo Cashier', role: 'cashier' },
        { email: 'kitchen@demo.com', password: 'demo123', full_name: 'Demo Kitchen', role: 'kitchen' },
        { email: 'customer@demo.com', password: 'demo123', full_name: 'Demo Customer', role: 'customer' }
    ];

    for (const account of demoAccounts) {
        if (!users.has(account.email)) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(account.password, salt);
            
            users.set(account.email, {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email: account.email,
                password_hash,
                full_name: account.full_name,
                phone: null,
                role: account.role,
                is_active: true,
                created_at: new Date().toISOString()
            });
        }
    }
    logger.info('✅ Demo accounts initialized');
};

// Initialize demo accounts on module load
initializeDemoAccounts();

const signup = catchAsync(async (req, res) => {
    const { email, password, full_name, phone, role = 'customer' } = req.body;

    // Check if user already exists
    if (users.has(email)) {
        throw new ConflictError('A user with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        password_hash,
        full_name,
        phone: phone || null,
        role,
        is_active: true,
        created_at: new Date().toISOString()
    };

    users.set(email, newUser);

    // Generate token
    const token = generateToken({
        user_id: newUser.id,
        email: newUser.email,
        role: newUser.role
    });

    logger.info(`New user registered: ${email} (${role})`);

    res.status(201).json(formatResponse(true, 'Account created successfully', {
        user: {
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.full_name,
            phone: newUser.phone,
            role: newUser.role,
            is_active: newUser.is_active
        },
        token
    }));
});

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    // Get user
    const user = users.get(email);

    if (!user) {
        throw new AuthenticationError('Invalid email or password');
    }

    if (!user.is_active) {
        throw new AuthenticationError('Your account has been deactivated. Please contact support.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
        throw new AuthenticationError('Invalid email or password');
    }

    // Generate token
    const token = generateToken({
        user_id: user.id,
        email: user.email,
        role: user.role
    });

    logger.info(`User logged in: ${email} (${user.role})`);

    res.status(200).json(formatResponse(true, 'Login successful', {
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            role: user.role
        },
        token
    }));
});

const logout = catchAsync(async (req, res) => {
    logger.info(`User logged out: ${req.user.email}`);
    res.status(200).json(formatResponse(true, 'Logged out successfully'));
});

const getCurrentUser = catchAsync(async (req, res) => {
    // Find user by ID
    let foundUser = null;
    for (const user of users.values()) {
        if (user.id === req.user.id) {
            foundUser = user;
            break;
        }
    }

    if (!foundUser) {
        throw new NotFoundError('User');
    }

    res.status(200).json(formatResponse(true, 'User retrieved successfully', {
        user: {
            id: foundUser.id,
            email: foundUser.email,
            full_name: foundUser.full_name,
            phone: foundUser.phone,
            role: foundUser.role,
            is_active: foundUser.is_active,
            created_at: foundUser.created_at
        }
    }));
});

const refreshToken = catchAsync(async (req, res) => {
    const token = generateToken({
        user_id: req.user.id,
        email: req.user.email,
        role: req.user.role
    });

    res.status(200).json(formatResponse(true, 'Token refreshed successfully', {
        token
    }));
});

// Helper function to get all users (for debugging)
const getAllUsers = () => {
    return Array.from(users.values()).map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
    }));
};

module.exports = {
    signup,
    login,
    logout,
    getCurrentUser,
    refreshToken,
    getAllUsers
};
