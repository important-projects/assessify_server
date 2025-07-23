const User = require("../models/user")

const fetchUserController = {
    fetchUser: async (req, res) => {
        const userId = req.user.id;
        console.log("Decoded user id:", userId);

        try {
            const user = await User.findById(userId).select('username email age userNumber subscription registeredCourses avatarUrl');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
            console.log(user)
        } catch (error) {
            console.error("Error fetching user: ", error);
            res.status(500).json({
                message: "Error fetching user",
                error,
            });
        }
    }
}
module.exports = fetchUserController