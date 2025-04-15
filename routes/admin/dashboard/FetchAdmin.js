const express = require('express')
const router = express.Router()
const Admin = require('../../../models/Admin')
const { isAdmin } = require("../../user/authentication/Authentication")

router.get("/:id", async (req, res) => {
    console.log("Fetched user id:", req.params.id)
    try {
        const user = await Admin.findById(req.params.id).select('username email age userNumber registeredCourses avatarUrl');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log("User found: ", user);
        res.json(user);
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({
            message: "Error fetcing user:",
            error,
        });
    }
})

module.exports = router