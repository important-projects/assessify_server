const jwt = require("jsonwebtoken")
require("dotenv").config()

const authMiddleware = {
    // Auth middleware
    protect: (req, res, next) => {
        const authHeader = req.header('Authorization')
        const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : req.cookies?.token

        console.log('Token found:', token ? 'Yes' : 'No');
        console.log('Auth header:', authHeader);
        console.log('Cookies:', req.cookies);


        if (!token) {
            return res.status(401).json({ success: false, message: "Access denied. No authentication token provided" })
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.user = decoded
            next()
        } catch (error) {
            console.error('JWT verification failed:', error.message);
            return res.status(403).json({
                success: false, message: "Invalid or expired token. Please login again"
            })
        }
    },
    isAdmin: async (req, res, next) => {
        try {
            console.log('Checking admin access for user ID:', req.user.id)

            if (!req.user || !req.user.id) {
                console.log('Unauthorized access attempt - No admin information found')
                return res
                    .status(401)
                    .json({ message: 'Unauthorized. Admin information is missing.' })
            }

            const admin = await Admin.findById(req.user.id)

            if (!admin) {
                console.log('Admin not found - Access forbidden')
                return res.status(403).json({ message: 'Access forbidden. Admins only.' })
            }

            console.log('Admin verified:', admin)
            next()
        } catch (error) {
            console.error('Error checking admin status:', error.message)
            return res
                .status(500)
                .json({ message: 'Error checking admin status', error: error.message })
        }
    },
}

module.exports = authMiddleware