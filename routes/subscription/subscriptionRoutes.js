const express = require("express")
const router = express.Router()
const { protect } = require("../user/authentication/Authentication")
const subscriptionController = require("../../controller/subscriptionController")
router.post('/upgrade', protect, subscriptionController.upgrade);
router.post('/initialize-upgrade', protect, subscriptionController.initializeUpgrade);
router.post('/verify-upgrade', protect, subscriptionController.verifyUpgrade);
router.get('/status', protect, subscriptionController.getStatus);
router.post('/cancel', protect, subscriptionController.cancelSubscription);
router.post('/update-payment-method', protect, subscriptionController.updatePaymentMethod);
router.get('/payment-methods', protect, subscriptionController.getPaymentMethods);


module.exports = router;