const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        avatar: {
            type: String,
            default: ""
        },

        dailyGoal: {
            type: Number,
            default: 120,
            min: 15
        },

        totalFocusMinutes: {
            type: Number,
            default: 0
        },

        completedSessions: {
            type: Number,
            default: 0
        },

        currentStreak: {
            type: Number,
            default: 0
        },

        longestStreak: {
            type: Number,
            default: 0
        },

        focusScore: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);