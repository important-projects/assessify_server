const mongoose = require('mongoose')

const testResultSchema = new mongoose.Schema({
    testId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    score: Number,
    status: {
        type: String,
        enum: ['passed', 'failed'],
    },
    submittedAt: {
        type: Date,
    },
})

module.exports = mongoose.model('TestResult', testResultSchema)