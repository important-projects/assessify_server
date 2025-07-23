const express = require("express")
const router = express.Router()
const { protect } = require("../middleware/middleware")
const subscriptionController = require("../controllers/subscription")


router.get("/status", protect, subscriptionController.getStatus)
router.get("/payment-status", protect, subscriptionController.getPaymentMethods)

router.post("/upgrade", protect, subscriptionController.upgrade)
router.post("/initialize-upgrade", protect, subscriptionController.initializeUpgrade)
router.post("/verify-upgrade", protect, subscriptionController.verifyUpgrade)
router.post("/cancel", protect, subscriptionController.cancelSubscription)
router.post("/update-payment-method", protect, subscriptionController.updatePaymentMethod)

module.exports = router