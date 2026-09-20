const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        title: {
            type: String,
            required: [true, "Task title is required"],
            trim: true,
            maxlength: 200
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },

        subject: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        },

        estimatedMinutes: {
            type: Number,
            min: 1,
            max: 1440,
            default: 25
        },

        dueDate: {
            type: Date,
            default: null
        },

        completed: {
            type: Boolean,
            default: false
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Task", taskSchema);