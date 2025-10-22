const express = require("express");
const fetchAdminController = require("../controllers/fetchAdmin");
const { protect, isAdmin } = require("../middleware/middleware");
const router = express.Router();

router.get("/:adminId", protect, isAdmin, fetchAdminController.fetchAdmin);

module.exports = router;
