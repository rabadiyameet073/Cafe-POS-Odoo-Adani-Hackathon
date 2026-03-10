const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, NotFoundError, ConflictError, ValidationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const submitFeedback = catchAsync(async (req, res) => {
    const {
        order_id,
        overall_rating,
        food_quality_rating,
        service_rating,
        payment_experience_rating,
        payment_method_used,
        payment_seamless,
        ambience_rating,
        cleanliness_rating,
        liked_items,
        disliked_items,
        favorite_dish,
        suggestions,
        would_recommend,
        comments,
        is_anonymous = false
    } = req.body;

    if (!order_id || !overall_rating) {
        throw new ValidationError('Order ID and overall rating are required');
    }

    const order = await Order.findById(order_id);
    if (!order) {
        throw new NotFoundError('Order');
    }

    const existingFeedback = await Feedback.findByOrderId(order_id);
    if (existingFeedback) {
        throw new ConflictError('Feedback has already been submitted for this order');
    }

    const feedback = await Feedback.create({
        order_id,
        customer_id: is_anonymous ? null : req.user.id,
        overall_rating,
        food_quality_rating,
        service_rating,
        payment_experience_rating,
        payment_method_used,
        payment_seamless,
        ambience_rating,
        cleanliness_rating,
        liked_items,
        disliked_items,
        favorite_dish,
        suggestions,
        would_recommend,
        comments,
        is_anonymous
    });

    logger.info(`Feedback submitted for order ${order.order_number}`);

    res.status(201).json(formatResponse(true, 'Thank you for your feedback!', {
        feedback_id: feedback.id
    }));
});

const getOrderFeedback = catchAsync(async (req, res) => {
    const { orderId } = req.params;

    const feedback = await Feedback.findByOrderId(orderId);

    if (!feedback) {
        return res.status(200).json(formatResponse(true, 'No feedback found', {
            feedback: null
        }));
    }

    res.status(200).json(formatResponse(true, 'Feedback retrieved', {
        feedback
    }));
});

const getAllFeedback = catchAsync(async (req, res) => {
    const { limit, min_rating } = req.query;

    const filters = {};
    if (limit) filters.limit = parseInt(limit);
    if (min_rating) filters.min_rating = parseInt(min_rating);

    const feedbacks = await Feedback.findAll(filters);

    res.status(200).json(formatResponse(true, 'Feedback retrieved', {
        feedbacks,
        count: feedbacks.length
    }));
});

const getFeedbackStats = catchAsync(async (req, res) => {
    const stats = await Feedback.getStats();

    res.status(200).json(formatResponse(true, 'Feedback statistics retrieved', {
        stats
    }));
});

module.exports = {
    submitFeedback,
    getOrderFeedback,
    getAllFeedback,
    getFeedbackStats
};
