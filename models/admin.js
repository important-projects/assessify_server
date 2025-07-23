const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        // regex to validate email. must be in the format `example@gmail.com`
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please provide a valid email."
        ],
        unique: true
    },
    password: {
        type: String,
        required: true,
        unique: true,
        select: false // does not return the hashed password when this model is queried
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    adminNumber: {
        type: Number,
    },
});

module.exports = mongoose.model("Admin", adminSchema)