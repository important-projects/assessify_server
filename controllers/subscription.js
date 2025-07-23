const SubscriptionService = require("../services/subscription")
const User = require("../models/user")

const subscriptionController = {
    initializeUpgrade: async (req, res) => {
        try {
            const { planType, billingCycle } = req.body;
            console.log(planType, billingCycle)

            const result = await SubscriptionService.initializeUpgrade(
                req.user.id,
                planType,
                billingCycle
            );
            console.log(result)

            console.log({
                success: true,
                authorizationUrl: result.authorizationUrl,
                accessCode: result.accessCode,
                reference: result.reference
            })
            res.status(200).json({
                success: true,
                authorizationUrl: result.authorizationUrl,
                accessCode: result.accessCode,
                reference: result.reference
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    verifyUpgrade: async (req, res) => {
        try {
            const { reference } = req.body;
            console.log(reference)

            const user = await SubscriptionService.verifyAndUpgrade(reference);
            console.log(user)
            console.log({
                success: true,
                subscription: user.subscription,
                features: user.features
            })

            res.status(200).json({
                success: true,
                subscription: user.subscription,
                features: user.features
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },
    upgrade: async (req, res) => {
        try {
            const { planType, billingCycle, paymentMethod } = req.body;

            const user = await SubscriptionService.upgradeUser(req.user.id, {
                planType,
                billingCycle,
                paymentMethod
            });
            console.log(user)

            console.log({
                success: true,
                subscription: user.subscription,
                features: user.features
            })
            res.status(200).json({
                success: true,
                subscription: user.subscription,
                features: user.features
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    getStatus: async (req, res) => {
        try {
            const status = await SubscriptionService.checkStatus(req.user.id);
            console.log(status)

            console.log({
                success: true,
                ...status
            })
            res.status(200).json({
                success: true,
                ...status
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },
    cancelSubscription: async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!user.subscription?.paystackSubscriptionId) {
                return res.status(400).json({
                    success: false,
                    message: 'No active subscription found'
                });
            }

            // Disable the subscription in Paystack
            const response = await paystack.disableSubscription(
                user.subscription.paystackSubscriptionId
            );

            // Update user's subscription status
            user.subscription.status = 'cancelled';
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Subscription cancelled successfully',
                subscription: user.subscription
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    updatePaymentMethod: async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Initialize Paystack transaction for updating card
            const response = await paystack.initializeTransaction(
                user.email,
                100, // Small amount for card verification
                null,
                {
                    userId,
                    action: 'update_payment_method'
                },
                {
                    callback_url: `${CLIENT_URL}/payment-success`
                }
            );

            res.status(200).json({
                success: true,
                authorizationUrl: response.data.authorization_url
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    getPaymentMethods: async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!user.paystackCustomerCode) {
                return res.status(200).json({
                    success: true,
                    paymentMethods: []
                });
            }

            // Fetch customer's payment methods from Paystack
            const response = await paystack.listCustomerCards(
                user.paystackCustomerCode
            );

            res.status(200).json({
                success: true,
                paymentMethods: response.data.data || []
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = subscriptionController;