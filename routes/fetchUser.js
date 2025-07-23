const express = require("express")
const { protect } = require("../middleware/middleware")
const fetchUserController = require("../controllers/fetchUser")
const router = express.Router()

router.get("/user", protect, fetchUserController.fetchUser)

module.exports = router