const axios = require('axios');

const paystack = axios.create({
    baseURL: 'https://api.paystack.co',
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
                amount: amount * 100, // Convert to kobo
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
    }
};
