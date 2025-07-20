const User = require('../models/User');
const paystack = require("../config/paystack")

const CLIENT_URL = process.env.ALLOWED_ORIGINS
class SubscriptionService {
    static async initializeUpgrade(userId, planType, billingCycle) {
        const user = await User.findById(userId);
        console.log(user)
        if (!user) throw new Error('User not found');

        // Define your plans (should match Paystack plans)
        const plans = {
            premium: {
                monthly: { code: "PLN_c6hxnxiyhx6cadv", amount: 15500.00 },
                annual: { code: "PLN_so31039pfacfnpu", amount: 50000.00 }
            },
            enterprise: {
                monthly: { code: "PLN_e4mu7vesx9x48h3", amount: 40000.00 },
                annual: { code: "PLN_1kw9bhdx6u0zg30", amount: 100000.00 }
            }
        };

        const plan = plans[planType]?.[billingCycle];
        console.log(plan)
        if (!plan) throw new Error('Invalid plan or billing cycle');

        // Initialize Paystack transaction
        const response = await paystack.initializeTransaction(
            user.email,
            plan.amount,
            plan.code,
            {
                userId,
                planType,
                billingCycle
            },
            {
                callback_url: `${CLIENT_URL}/payment-success`
            }
        );
        console.log(response)
        console.log({
            authorizationUrl: response.data.authorization_url,
            accessCode: response.data.access_code,
            reference: response.data.reference
        })
        return {
            authorizationUrl: response.data.authorization_url,
            accessCode: response.data.access_code,
            reference: response.data.reference
        };
    }

    static async verifyAndUpgrade(reference) {
        // Verify Paystack payment
        const verification = await paystack.verifyTransaction(reference);
        console.log(verification)

        if (verification.data.status !== 'success') {
            throw new Error('Payment not successful');
        }

        const { userId, planType, billingCycle } = verification.data.metadata;

        const user = await User.findById(userId);
        console.log(user)
        if (!user) throw new Error('User not found');

        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + (billingCycle === 'annual' ? 12 : 1));
        console.log(validUntil)

        // Update user subscription
        user.subscription = {
            status: 'active',
            plan: planType,
            validUntil,
            paymentMethod: 'paystack',
            billingCycle,
            lastPayment: {
                amount: verification.data.amount / 100,
                date: new Date(),
                reference
            }
        };
        console.log(user.subscription, user.features)

        // Enable features
        user.features = {
            aiGrading: true,
            advancedAnalytics: planType === 'enterprise'
        };

        await user.save();
        console.log(user)
        return user;
    }
    static async upgradeUser(userId, planData) {
        const user = await User.findById(userId);
        console.log(user)
        if (!user) throw new Error('User not found');

        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + (planData.billingCycle === 'annual' ? 12 : 1));
        console.log(validUntil)

        user.subscription = {
            status: 'active',
            plan: planData.planType,
            validUntil,
            paymentMethod: planData.paymentMethod,
            billingCycle: planData.billingCycle
        };
        console.log(user.subscription)

        // Enable features based on plan
        user.features = {
            aiGrading: ['premium', 'enterprise'].includes(planData.planType),
            advancedAnalytics: planData.planType === 'enterprise'
        };
        console.log(user.features)

        await user.save();
        console.log(user)
        return user;
    }

    static async checkStatus(userId) {
        const user = await User.findById(userId);
        console.log(user)
        if (!user) throw new Error('User not found');

        // Check for expired subscription
        if (user.subscription?.validUntil < new Date()) {
            user.subscription.status = 'expired';
            user.features.aiGrading = false;
            user.features.advancedAnalytics = false;
            await user.save();
        }
        console.log({
            status: user.subscription?.status || 'inactive',
            plan: user.subscription?.plan || 'basic',
            features: user.features
        })

        return {
            status: user.subscription?.status || 'inactive',
            plan: user.subscription?.plan || 'basic',
            features: user.features
        };
    }
}

module.exports = SubscriptionService;