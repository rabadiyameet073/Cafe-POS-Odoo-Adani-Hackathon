const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');
const { generateToken } = require('../services/tokenService');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, ValidationError, ConflictError, AuthenticationError, NotFoundError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const signup = catchAsync(async (req, res) => {
    const { email, password, full_name, phone, role = 'customer' } = req.body;

    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (existingUser) {
        throw new ConflictError('A user with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data: newUser, error } = await supabase
        .from('users')
        .insert({
            email,
            password_hash,
            full_name,
            phone,
            role,
            is_active: true
        })
        .select('id, email, full_name, phone, role, is_active, created_at')
        .single();

    if (error) {
        logger.error('Signup database error:', error);
        throw new Error('Failed to create user account');
    }

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

    const { data: user, error } = await supabase
        .from('users')
        .select('id, email, password_hash, full_name, phone, role, is_active')
        .eq('email', email)
        .single();

    if (error || !user) {
        throw new AuthenticationError('Invalid email or password');
    }

    if (!user.is_active) {
        throw new AuthenticationError('Your account has been deactivated. Please contact support.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
        throw new AuthenticationError('Invalid email or password');
    }

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
    const { data: user, error } = await supabase
        .from('users')
        .select('id, email, full_name, phone, role, is_active, created_at, updated_at')
        .eq('id', req.user.id)
        .single();

    if (error || !user) {
        throw new NotFoundError('User');
    }

    res.status(200).json(formatResponse(true, 'User retrieved successfully', {
        user
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

module.exports = {
    signup,
    login,
    logout,
    getCurrentUser,
    refreshToken
};
