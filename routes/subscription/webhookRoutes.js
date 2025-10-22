const express = require("express")
const router = express.Router()

const webhookController = require("../../controller/webhookController")

router.post('/paystack-webhook', webhookController.handlePaystackWebhook);

module.exports = router