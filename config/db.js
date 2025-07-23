const mongoose = require("mongoose");
const serverApp = require("../server");
require("dotenv").config();

mongoose.set("strictPopulate", false)

const PORT = process.env.PORT || 5000;

function dbConfig() {
    mongoose.connect(process.env.DB_URI, {
        serverSelectionTimeoutMS: 100000
    }).then(() => {
        console.log("MongoDB connected");

        const app = serverApp();
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        server.on('error', (error) => {
            console.error('Server error:', error);
            process.exit(1);
        });
    }).catch((error) => {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    });
}
dbConfig()