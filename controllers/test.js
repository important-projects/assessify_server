const Question = require("../models/question");
const Test = require('../models/test');

// Get questions for a specific course
async function getQuestionsByCategory(req, res) {
    const category = req.params.category;
    console.log('Category received:', category);
    try {
        const questions = await Question.aggregate([
            { $match: { category } },
            { $sample: { size: 40 } }
        ]);
        console.log('Questions found:', questions);
        res.json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Error fetching questions', error });
    }
}

// Submit the test
async function submitTest(req, res) {
    const { category, answers } = req.body;
    const userId = req.user.id;

    try {
        const gradedAnswers = await Promise.all(
            answers.map(async function (answer) {
                const question = await Question.findById(answer.questionId);

                if (!question) {
                    throw new Error(`Question with ID ${answer.questionId} not found.`);
                }

                const isCorrect = answer.answer === question.correctAnswer;
                const score = isCorrect ? 1 : 0;

                return {
                    questionId: answer.questionId,
                    answer: answer.answer,
                    correctAnswer: question.correctAnswer,
                    category: question.category,
                    isCorrect,
                    score
                };
            })
        );

        const totalScore = gradedAnswers.reduce(function (acc, answer) {
            return acc + answer.score;
        }, 0);

        const test = new Test({
            userId,
            category,
            answers: gradedAnswers,
            totalScore
        });

        await test.save();

        res.status(201).json({
            message: 'Test submitted and graded successfully',
            totalScore,
            answers: gradedAnswers
        });
    } catch (error) {
        console.error('Error submitting test:', error);
        res.status(500).json({
            message: 'Error submitting test',
            error: error.message
        });
    }
}

// Get all submitted tests (Admin only)
async function getAllSubmittedTests(req, res) {
    try {
        const tests = await Test.find().populate('userId', 'username email');
        console.log('Retrieved tests:', tests);
        res.json(tests);
    } catch (error) {
        console.error('Error retrieving tests:', error);
        res.status(500).json({ message: 'Error retrieving tests', error: error.message });
    }
}

// Get a specific test by ID (Admin only)
async function getSubmittedTestById(req, res) {
    try {
        const test = await Test.findById(req.params.id)
            .populate('userId', 'username email')
            .populate({
                path: 'answers.questionId',
                select: 'questionText options correctAnswer'
            });

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        res.status(200).json(test);
    } catch (error) {
        console.error('Error retrieving test:', error);
        res.status(500).json({ message: 'Error retrieving test', error: error.message });
    }
}

// Get all test scores (Admin only)
async function getAllScores(req, res) {
    try {
        const tests = await Test.find({ userId: { $ne: null } }).populate('userId', 'username email');
        res.json(tests);
    } catch (error) {
        console.error('Error retrieving scores:', error);
        res.status(500).json({ message: 'Error retrieving scores', error: error.message });
    }
}

// Get all test results for the logged-in user
async function getUserTestResults(req, res) {
    try {
        const tests = await Test.find({ userId: req.user.id }).populate('userId', 'username email');
        res.json(tests);
    } catch (error) {
        console.error('Error retrieving user test results:', error);
        res.status(500).json({ message: 'Error retrieving test results', error: error.message });
    }
}

// Get detailed result of a specific test
async function getUserTestResultById(req, res) {
    try {
        const test = await Test.findById(req.params.id)
            .populate('userId', 'username email')
            .populate({
                path: 'answers.questionId',
                select: 'questionText options correctAnswer'
            });

        if (!test) {
            return res.status(404).json({ message: 'Test not found or unauthorized access.' });
        }

        res.json(test);
    } catch (error) {
        console.error('Error retrieving test details:', error);
        res.status(500).json({ message: 'Error retrieving test details', error: error.message });
    }
}

// Get top 10 scores for the logged-in user
async function getTop10ScoresForUser(req, res) {
    try {
        const topScores = await Test.find({ userId: req.user.id })
            .sort({ totalScore: -1 })
            .limit(10)
            .populate('userId', 'username email');

        res.json(topScores);
    } catch (error) {
        console.error('Error retrieving top scores:', error);
        res.status(500).json({ message: 'Error retrieving top scores', error: error.message });
    }
}

module.exports = {
    getQuestionsByCategory,
    submitTest,
    getAllSubmittedTests,
    getSubmittedTestById,
    getAllScores,
    getUserTestResults,
    getUserTestResultById,
    getTop10ScoresForUser
};
