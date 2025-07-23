const express = require('express');
const router = express.Router();
const { protect ,isAdmin} = require('../middleware/middleware');

const testController = require('../controllers/test');

// Public & Protected routes
router.get('/questions/:category', protect, testController.getQuestionsByCategory);
router.post('/submit', protect, testController.submitTest);
router.get('/test/results', protect, testController.getUserTestResults);
router.get('/test/result/:id', protect, testController.getUserTestResultById);
router.get('/test/top10', protect, testController.getTop10ScoresForUser);

// Admin-only routes
router.get('/submitted', protect, isAdmin, testController.getAllSubmittedTests);
router.get('/submitted/:id', protect, isAdmin, testController.getSubmittedTestById);
router.get('/results', protect, isAdmin, testController.getAllScores);

module.exports = router;
