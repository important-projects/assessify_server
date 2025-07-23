const mongoose = require("mongoose")

const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    answer: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    score: { type: Number, required: true }
})

module.exports = mongoose.model("Answer", answerSchema)