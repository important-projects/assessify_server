const axios = require('axios');
const crypto = require("crypto")

const paystack = axios.create({
    baseURL: process.env.PAYSTACK_BASE_URL,
    headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
    }
});

module.exports = {
    // Initialize transaction
    initializeTransaction: async (email, amount, planCode, metadata = {}, options = {}) => {
        try {
            const payload = {
                email,
                amount: amount * 100,
                plan: planCode,
                metadata
            };

            // Add callback_url if provided
            if (options.callback_url) {
                payload.callback_url = options.callback_url;
            }

            const response = await paystack.post('/transaction/initialize', payload);
            console.log('Paystack Init Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Paystack initialization error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Verify transaction
    verifyTransaction: async (reference) => {
        try {
            const response = await paystack.get(`/transaction/verify/${reference}`);
            console.log('Paystack Verify Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Paystack verification error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Create subscription plan
    createPlan: async (planData) => {
        try {
            const response = await paystack.post('/plan', {
                name: planData.name,
                interval: planData.interval,
                amount: planData.amount * 100,
                description: planData.description
            });
            console.log('Paystack Plan Create Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Paystack plan creation error:', error.response?.data || error.message);
            throw error;
        }
    },
    verifyWebhookSignature: (body, signature) => {
        const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
            .update(JSON.stringify(body))
            .digest('hex');
        return hash === signature;
    }, disableSubscription: async (subscriptionId) => {
        const response = await paystack.post(`/subscription/disable`, {
            code: subscriptionId,
            token: process.env.PAYSTACK_SECRET_KEY
        });
        return response.data;
    },

    listCustomerCards: async (customerCode) => {
        const response = await paystack.get(`/customer/${customerCode}`);
        return response.data;
    }

};
