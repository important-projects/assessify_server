const SubscriptionService = require('../services/subscriptionService');

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
    }
};

module.exports = subscriptionController;