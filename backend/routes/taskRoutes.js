const express = require("express");

const {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask
} = require("../controllers/taskController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All task routes require authentication
router.use(protect);

// Create task
router.post("/", createTask);

// Get all tasks
router.get("/", getTasks);

// Get one task
router.get("/:id", getTask);

// Update task
router.put("/:id", updateTask);

// Delete task
router.delete("/:id", deleteTask);

module.exports = router;