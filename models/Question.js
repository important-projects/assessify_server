const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  category: { type: String, required: true },
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['objective', 'subjective'],
    required: true
  },
  options: {
    type: [String],
    validate: {
      validator: function (value) {
        return this.questionType === 'objective' ? value.length > 0 : true
      },
      message: 'Options are required for objective questions.'
    }
  },
  correctAnswer: { type: String },
  maxScore: {
    type: Number,
    required: function () {
      return this.questionType === 'subjective'
    }
  }
})

module.exports = mongoose.model('Question', questionSchema)
