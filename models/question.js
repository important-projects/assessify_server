const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    questionText: {
        type: String,
        required: true,
        minlength: [10, 'Question text must be at least 10 characters long']
    },
    questionType: {
        type: String,
        enum: ['objective', 'theory'],
        required: true
    },
    options: {
        type: [String],
        validate: {
            validator: function (v) {
                if (this.questionType === 'objective') {
                    // Must have between 2 and 6 options
                    if (v.length < 2 || v.length > 6) return false;

                    // All options must be non-empty strings (5-200 chars)
                    if (v.some(opt => typeof opt !== 'string' || opt.trim().length < 5 || opt.trim().length > 200)) {
                        return false;
                    }

                    // Validate option prefixes (A., B., etc.)
                    return v.every((opt, i) => {
                        const prefix = String.fromCharCode(65 + i) + '. ';
                        return opt.startsWith(prefix);
                    });
                }
                return v.length === 0; // Theory questions have no options
            },
            message: function (props) {
                if (this.questionType === 'objective') {
                    if (props.value.length < 2 || props.value.length > 6) {
                        return 'Objective questions must have 2-6 options';
                    }
                    return 'Options must be properly formatted (e.g., "A. Option text") and 5-200 characters long';
                }
                return 'Theory questions cannot have options';
            }
        }
    },
    correctAnswer: {
        type: String,
        validate: {
            validator: function (v) {
                if (this.questionType === 'objective') {
                    // Must be A, B, C, etc. matching one of the options
                    const validAnswers = this.options.map((_, i) =>
                        String.fromCharCode(65 + i)
                    );
                    return validAnswers.includes(v?.toUpperCase());
                }
                return true; // Theory questions can have any correctAnswer format
            },
            message: 'Correct answer must match one of the option letters (A, B, C, etc.)'
        }
    },
    keywords: {
        type: [{
            term: {
                type: String,
                required: true,
                trim: true,
                maxlength: [30, 'Keywords cannot exceed 30 characters'],
                validate: {
                    validator: function (v) {
                        return typeof v === 'string' &&
                            v.trim().length > 0 &&
                            /^[\w\s-]+$/.test(v);
                    },
                    message: 'Keyword must be a valid string without special characters'
                }
            },
            weight: {
                type: Number,
                min: 0.1,
                max: 1,
                default: 0.5
            }
        }],
        default: [],
        validate: [
            {
                validator: function (v) {
                    if (this.questionType === 'theory') {
                        return v.length > 0;
                    }
                    return true;
                },
                message: 'Theory questions should have at least one keyword for grading'
            },
            {
                validator: function (v) {
                    const terms = v.map(k => k.term.toLowerCase());
                    return new Set(terms).size === terms.length;
                },
                message: 'Duplicate keywords are not allowed'
            }
        ]
    },
    points: {
        type: Number,
        min: [1, 'Minimum points is 1'],
        max: [10, 'Maximum points is 10'],
        default: function () {
            return this.questionType === 'objective' ? 1 : 5;
        }
    },
    explanation: {
        type: String,
        maxlength: [500, 'Explanation cannot exceed 500 characters'],
        required: function () {
            return this.questionType === 'objective';
        }
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
        required: true
    },
    aiPrompt: {
        type: String,
        maxlength: [1000, 'AI prompt cannot exceed 1000 characters'],
        default: function () {
            if (this.questionType === 'theory') {
                return `Evaluate this answer based on depth of analysis, conceptual understanding, 
        and relevance to the question. Consider these key aspects: ${this.keywords.map(k => k.term).join(', ')}`;
            }
            return null;
        }
    },
    sampleAnswers: {
        type: [{
            text: String,
            score: Number,
            feedback: String
        }],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Add index for better performance on frequent queries
questionSchema.index({ course: 1, questionType: 1 });
questionSchema.index({ keywords: 'text' });

// Update timestamp on save
questionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Question', questionSchema);