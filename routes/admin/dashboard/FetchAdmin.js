const express = require('express');
const router = express.Router();
const Admin = require('../../../models/Admin');
const { isAdmin } = require('../authentication/Authentication');
const { protect } = require('../../user/authentication/Authentication');

// Route: GET /dashboard/admin/info
router.get("/:adminId", protect, isAdmin, async (req, res) => {
    try {
        const { adminId } = req.params;
        console.log("Fetched admin ID from token:", adminId);

        const user = await Admin.findById(adminId).select(
            'username email adminNumber'
        );

        if (!user) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json(user);
    } catch (error) {
        console.error("Error fetching admin data:", error);
        res.status(500).json({
            message: "Error fetching admin data",
            error: error.message,
        });
    }
});

module.exports = router;
