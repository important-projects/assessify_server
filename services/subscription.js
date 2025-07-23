const User = require('../models/user');
const paystack = require("../config/paystack")

const CLIENT_URL = process.env.ALLOWED_ORIGINS;

class SubscriptionService {
    static async initializeUpgrade(userId, planType, billingCycle) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const plans = {
            premium: {
                
                monthly: { code: process.env.MONTHLY_PREMIUM, amount: 15500.00 },
                annual: { code: process.env.YEARLY_PREMIUM, amount: 50000.00 }
            },
            enterprise: {
                monthly: { code: process.env.MONTHLY_ENTERPRISE, amount: 40000.00 },
                annual: { code: process.env.YEARLY_ENTERPRISE, amount: 100000.00 }
            }
        };

        const plan = plans[planType]?.[billingCycle];
        if (!plan) throw new Error('Invalid plan or billing cycle');

        // Check if user has an existing authorization for recurring payments
        if (user.paystackAuthorizationCode) {
            // Create subscription using existing authorization
            try {
                const subscription = await paystack.createSubscription({
                    customer: user.paystackCustomerCode,
                    plan: plan.code,
                    authorization: user.paystackAuthorizationCode
                });

                return {
                    subscriptionId: subscription.data.id,
                    status: 'active',
                    message: 'Subscription created using existing payment method'
                };
            } catch (error) {
                console.error('Error creating subscription with existing auth:', error);
                // Fall through to initialize new transaction if existing auth fails
            }
        }

        // Initialize Paystack transaction with subscription parameters
        const response = await paystack.initializeTransaction(
            user.email,
            plan.amount,
            null, // amount is specified separately
            {
                userId,
                planType,
                billingCycle
            },
            {
                callback_url: `${CLIENT_URL}/payment-success`,
                plan: plan.code // This makes it a subscription transaction
            }
        );

        return {
            authorizationUrl: response.data.authorization_url,
            accessCode: response.data.access_code,
            reference: response.data.reference
        };
    }

    static async verifyAndUpgrade(reference) {
        // Verify Paystack payment
        const verification = await paystack.verifyTransaction(reference);

        if (verification.data.status !== 'success') {
            throw new Error('Payment not successful');
        }

        const { userId, planType, billingCycle } = verification.data.metadata;
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // Save authorization details for recurring payments
        const authorization = verification.data.authorization;
        if (authorization) {
            user.paystackAuthorizationCode = authorization.authorization_code;
            user.paystackCustomerCode = verification.data.customer.customer_code;
        }

        // For subscriptions, Paystack will handle the recurring payments
        // We just need to mark the user as subscribed
        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + (billingCycle === 'annual' ? 12 : 1));

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
            },
            paystackSubscriptionId: verification.data.subscription?.id || null
        };

        // Enable features
        user.features = {
            aiGrading: true,
            advancedAnalytics: planType === 'enterprise'
        };

        await user.save();
        return user;
    }

    // Add webhook handler for subscription events
    static async handleWebhookEvent(event) {
        const { event: eventType, data } = event;

        switch (eventType) {
            case 'subscription.create':
            case 'subscription.enable':
                // Handle subscription creation/enablement
                break;

            case 'subscription.disable':
                // Handle subscription disable
                break;

            case 'invoice.payment_failed':
                // Handle failed payment
                break;

            case 'invoice.payment_success':
                // Handle successful recurring payment
                const { subscription, customer } = data;
                const user = await User.findOne({ paystackCustomerCode: customer.customer_code });

                if (user) {
                    // Update last payment and extend subscription
                    user.subscription.lastPayment = {
                        amount: data.amount / 100,
                        date: new Date(data.paid_at),
                        reference: data.reference
                    };

                    // Extend subscription based on billing cycle
                    const billingCycle = user.subscription.billingCycle;
                    const extension = billingCycle === 'annual' ? 12 : 1;
                    user.subscription.validUntil.setMonth(user.subscription.validUntil.getMonth() + extension);

                    await user.save();
                }
                break;

            case 'subscription.not_renew':
                // Handle non-renewing subscription
                break;
        }
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