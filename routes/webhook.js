const express = require("express")
const webhookController = require("../controllers/webhook")
const router = express.Router()

router.post("/paystack-webhook", webhookController.handlePaystackWebhook)

module.exports = router