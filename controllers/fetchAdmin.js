const Admin = require('../models/admin')

const fetchAdminController = {
    fetchAdmin: async (req, res) => {
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
    }
}

module.exports = fetchAdminController