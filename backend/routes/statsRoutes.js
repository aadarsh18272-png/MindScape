const express = require("express");

const {
    getWeeklyStats
} = require("../controllers/statsController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All statistics routes require authentication
router.use(protect);

// Weekly focus statistics
router.get("/weekly", getWeeklyStats);

module.exports = router;