const express = require("express")
const contactMail = require("../controllers/mail")
const router = express.Router()

router.post("/contact", contactMail)

module.exports = router