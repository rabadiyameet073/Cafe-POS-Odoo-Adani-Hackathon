/**
 * Health Check Endpoint
 */
module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running on Vercel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
};
