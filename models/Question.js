const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  course: { type: String, required: true },
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['objective', 'theory'],
    required: true
  },
  options: {
    type: [String],
    validate: {
      validator: function (v) {
        return this.questionType === 'objective' ? v.length > 0 : true
      },
      message: 'Options are required for objective questions'
    }
  },
  correctAnswer: { type: String }
})

module.exports = mongoose.model('Question', questionSchema)
