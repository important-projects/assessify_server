const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['Basic', 'Premium', 'Enterprise']
    },
    description: {
        type: String,
        required: true
    },
    priceMonthly: {
        type: Number,
        required: true
    },
    priceAnnual: {
        type: Number,
        required: true
    },
    features: {
        aiGrading: Boolean,
        advancedAnalytics: Boolean,
        prioritySupport: Boolean,
        maxTests: Number
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);