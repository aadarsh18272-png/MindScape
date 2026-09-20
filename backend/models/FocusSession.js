const mongoose = require("mongoose");

const focusSessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        subject: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "General"
        },

        duration: {
            type: Number,
            required: true,
            min: 1
        },

        startTime: {
            type: Date,
            required: true
        },

        endTime: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["completed", "interrupted"],
            default: "completed"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("FocusSession", focusSessionSchema);