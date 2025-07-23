const express = require("express")
const timeConfig = require("../controllers/time");

const router = express.Router()

router.get("/current-datetime", timeConfig)


module.exports = router