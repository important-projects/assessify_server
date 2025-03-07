const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  category: { type: String, required: true },
  questionText: { type: String, required: true },
  questionType: { type: String, required: true },
  options: {
    type: [String],
    validate: {
      validator: function (validator) {
        return this.questionType === "objective" ? validator.length > 0 : true;
      },
      message: "Options ae required for objective questions.",
    },
  },
  correctAnswer: { type: String },
});

module.exports = mongoose.model("Question", questionSchema);
