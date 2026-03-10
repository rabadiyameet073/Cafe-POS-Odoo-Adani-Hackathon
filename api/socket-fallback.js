/**
 * Socket.IO Fallback for Vercel
 * 
 * WARNING: Socket.IO doesn't work on Vercel serverless.
 * This provides a polling-based fallback for real-time features.
 * 
 * For production with real-time features, deploy backend separately on:
 * - Railway (recommended)
 * - Render
 * - Heroku
 * - Any platform with persistent connections
 */

module.exports = (req, res) => {
  res.status(200).json({
    success: false,
    message: 'Socket.IO is not available on Vercel serverless',
    recommendation: 'Deploy backend separately for real-time features',
    alternatives: [
      'Railway.app',
      'Render.com',
      'Heroku',
      'DigitalOcean App Platform'
    ],
    fallback: 'Use polling or deploy backend separately'
  });
};
