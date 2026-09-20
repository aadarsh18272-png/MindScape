const express = require("express");

const {
    createFocusSession,
    getFocusSessions,
    getTodayFocus,
    deleteFocusSession
} = require("../controllers/focusController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All focus routes require authentication
router.use(protect);

// Create a focus session
router.post("/", createFocusSession);

// Get all focus sessions
router.get("/", getFocusSessions);

// Get today's focus
router.get("/today", getTodayFocus);

// Delete a focus session
router.delete("/:id", deleteFocusSession);

module.exports = router;