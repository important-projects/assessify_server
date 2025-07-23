const express = require("express")
const authController = require("../controllers/auth")
const { protect } = require("../middleware/middleware")

const router = express.Router()


router.get("/verify", protect, authController.userVerification)
router.get("/google/callback", authController.OAuthCallback)
router.get("/google", authController.OAuthClient)

router.post("/register", authController.userRegistration)
router.post("/login", authController.userLogin)
router.post("/admin/register", authController.adminRegistration)
router.post("/admin/login", authController.adminLogin)
router.post("/courses/register", authController.courseRegistration)

module.exports = router