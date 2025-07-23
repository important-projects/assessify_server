const mongoose = require('mongoose')

const resultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    answers: [
        {
            questionId: {
                type: mongoose.Schema.Types.ObjectId, ref: "Answer",
                required: true
            },
            answer: {
                type: String,
                required: true
            }
        }
    ],
    status: { type: String, enum: ['completed', 'pending'], default: 'completed' },
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Results', resultSchema)
