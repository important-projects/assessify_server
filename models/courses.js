const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        tests: [
            {
                type: mongoose.Schema.Types.ObjectId, ref: "User"
            }
        ],
        registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    {
        timestamps: true
    }
)


module.exports = mongoose.model('Course', courseSchema)
