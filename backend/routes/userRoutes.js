const express = require("express");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Protected route accessed successfully",
        user: req.user
    });
});

module.exports = router;