import rateLimit from 'express-rate-limit';

 const aiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each user to 100 AI grading requests per window
    message: 'Too many AI grading requests, please try again later',
    skip: (req) => {
        // Skip rate limiting for admin users
        return req.user?.role === 'admin';
    }
});

// Then apply to your route:
router.post('/submit-test/:testId', protect, aiRateLimiter, async (req, res) => {
    // ... route code
});
module.exports = aiRateLimiter;