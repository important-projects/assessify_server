const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true
        },
        email: {
            type: String,
            required: true,
            match: [
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                "Please provide a valid email."
            ],
            unique: true
        },
        password: {
            type: String,
            required: true,
            unique: true,
            select: false
        },
        userNumber: {
            type: Number,
            required: true,
            unique: true
        },
        avatarUrl: {
            type: String
        },
        authProvider: {
            type: String,
            enum: ['manual', 'google'],
            default: 'manual'
        },
        registeredCourses: [
            {
                _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
                name: String,
                description: String
            }
        ],
        testSubmissions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'TestSubmission'
            }
        ], subscription: {
            type: {
                status: {
                    type: String,
                    enum: ['active', 'canceled', 'expired', 'inactive'],
                    default: 'inactive'
                },
                plan: {
                    type: String,
                    enum: ['basic', 'premium', 'enterprise'],
                    default: 'basic'
                },
                validUntil: Date,
                paymentMethod: String,
                billingCycle: {
                    type: String,
                    enum: ['monthly', 'annual']
                }
            },
            default: {}
        },
        features: {
            aiGrading: {
                type: Boolean,
                default: false
            },
            advancedAnalytics: {
                type: Boolean,
                default: false
            }
        }
    },

    { timestamps: true }
)

userSchema.methods.isPremium = function () {
    return this.subscription?.status === 'active' &&
        ['premium', 'enterprise'].includes(this.subscription?.plan);
};

userSchema.methods.hasActiveSubscription = function () {
    return this.subscription?.status === 'active' &&
        this.subscription?.validUntil > new Date();
};

module.exports = mongoose.model('User', userSchema)
