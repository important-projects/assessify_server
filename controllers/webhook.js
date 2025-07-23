const SubscriptionService = require("../services/subscription")

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