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
        // For objective questions
        if (this.questionType === 'objective') {
          // Must have at least 2 options
          if (v.length < 2) return false;

          // All options must be non-empty strings
          if (v.some(opt => typeof opt !== 'string' || opt.trim() === '')) {
            return false;
          }

          // Options should start with A., B., etc. (optional)
          const optionPrefixRegex = /^[A-Z]\.\s+/;
          if (v.some((opt, i) => {
            const expectedPrefix = String.fromCharCode(65 + i) + '. ';
            return !opt.startsWith(expectedPrefix);
          })) {
            return false;
          }

          return true;
        }
        // For theory questions, options should be empty
        return v.length === 0;
      },
      message: function (props) {
        if (this.questionType === 'objective') {
          if (props.value.length < 2) {
            return 'Objective questions must have at least 2 options';
          }
          if (props.value.some(opt => typeof opt !== 'string' || opt.trim() === '')) {
            return 'All options must be non-empty strings';
          }
          return 'Options must be properly formatted (A. Option 1, B. Option 2, etc.)';
        }
        return 'Theory questions should not have options';
      }
    }
  },
  correctAnswer: { type: String },
  keywords: {
    type: [String],
    default: []
  },
  points: {
    type: Number,
    default: function () {
      return this.questionType === 'objective' ? 1 : 5;
    }
  }
})

module.exports = mongoose.model('Question', questionSchema)
