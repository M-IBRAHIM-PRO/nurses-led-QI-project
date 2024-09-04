const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        apiKey: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            default: "client",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Users", userSchema);
