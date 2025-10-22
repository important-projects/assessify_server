// controllers/webhookController.js
const SubscriptionService = require('../services/subscriptionService');

const webhookController = {
    handlePaystackWebhook: async (req, res) => {
        const signature = req.headers['x-paystack-signature'];
        const event = req.body;

        // Verify the webhook signature (important for security)
        const isValid = paystack.verifyWebhookSignature(event, signature);
        if (!isValid) {
            return res.status(401).send('Invalid signature');
        }

        try {
            await SubscriptionService.handleWebhookEvent(event);
            res.status(200).send('Webhook processed');
        } catch (error) {
            console.error('Webhook processing error:', error);
            res.status(400).send('Error processing webhook');
        }
    }
};

module.exports = webhookController;

// const SubscriptionService = require('../services/subscriptionService');
// const crypto = require('crypto');

// const webhookController = {
//     handlePaystackWebhook: async (req, res) => {
//         const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
//             .update(JSON.stringify(req.body))
//             .digest('hex');

//         if (hash !== req.headers['x-paystack-signature']) {
//             return res.status(401).send('Unauthorized');
//         }

//         const event = req.body;

//         try {
//             // Handle subscription events
//             if (event.event === 'subscription.create') {
//                 // Handle new subscription
//             } else if (event.event === 'charge.success') {
//                 // Verify and upgrade user if needed
//                 await SubscriptionService.verifyAndUpgrade(event.data.reference);
//             } else if (event.event === 'subscription.disable') {
//                 // Handle subscription cancellation
//             }

//             res.status(200).send('Webhook processed');
//         } catch (error) {
//             console.error('Webhook processing error:', error);
//             res.status(400).send('Error processing webhook');
//         }
//     }
// };

// module.exports = webhookController;