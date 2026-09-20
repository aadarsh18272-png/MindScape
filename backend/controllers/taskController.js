const Task = require("../models/task");

// Create a new task
async function createTask(req, res) {
    try {
        const {
            title, description, priority, subject, estimatedMinutes, dueDate
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task title is required"
            });
        }

        const task = await Task.create({
            user: req.user._id,
            title: title.trim(),
            description: description || "",
            priority: priority || "medium",
            subject: subject || "",
            estimatedMinutes: estimatedMinutes || 25,
            dueDate: dueDate || null
        });

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task
        });
    } catch (error) {
        console.error("Create task error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating task"
        });
    }
}

// Get all tasks for logged-in user
const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            user: req.user._id
        }).sort({
            completed: 1,
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks
        });
    } catch (error) {
        console.error("Get tasks error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while getting tasks"
        });
    }
};

// Get one task
const getTask = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        console.error("Get task error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while getting task"
        });
    }
};

// Update a task
const updateTask = async (req, res) => {
    try {
        const allowedFields = [
            "title",
            "description",
            "priority",
            "subject",
            "estimatedMinutes",
            "dueDate",
            "completed"
        ];

        const updates = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (updates.title !== undefined) {
            if (!updates.title.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Task title cannot be empty"
                });
            }

            updates.title = updates.title.trim();
        }

        if (updates.completed === true) {
            updates.completedAt = new Date();
        }

        if (updates.completed === false) {
            updates.completedAt = null;
        }

        const task = await Task.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id
            },
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task
        });
    } catch (error) {
        console.error("Update task error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating task"
        });
    }
};

// Delete a task
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });
    } catch (error) {
        console.error("Delete task error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting task"
        });
    }
};

module.exports = {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask
};