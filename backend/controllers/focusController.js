const FocusSession = require("../models/FocusSession");

// Create a focus session
const createFocusSession = async (req, res) => {
    try {
        const {
            subject,
            duration,
            startTime,
            endTime,
            status
        } = req.body;

        if (!duration || duration < 1) {
            return res.status(400).json({
                success: false,
                message: "Valid focus duration is required"
            });
        }

        if (!startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: "Start time and end time are required"
            });
        }

        const session = await FocusSession.create({
            user: req.user._id,
            subject: subject || "General",
            duration,
            startTime,
            endTime,
            status: status || "completed"
        });

        res.status(201).json({
            success: true,
            message: "Focus session saved successfully",
            session
        });
    } catch (error) {
        console.error("Create focus session error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while saving focus session"
        });
    }
};

// Get all focus sessions
const getFocusSessions = async (req, res) => {
    try {
        const sessions = await FocusSession.find({
            user: req.user._id
        }).sort({
            startTime: -1
        });

        res.status(200).json({
            success: true,
            count: sessions.length,
            sessions
        });
    } catch (error) {
        console.error("Get focus sessions error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while getting focus sessions"
        });
    }
};

// Get today's focus sessions
const getTodayFocus = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const sessions = await FocusSession.find({
            user: req.user._id,
            startTime: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: "completed"
        });

        const totalMinutes = sessions.reduce(
            (total, session) => total + session.duration,
            0
        );

        res.status(200).json({
            success: true,
            totalMinutes,
            sessions
        });
    } catch (error) {
        console.error("Get today's focus error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while calculating today's focus"
        });
    }
};

// Delete a focus session
const deleteFocusSession = async (req, res) => {
    try {
        const session = await FocusSession.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Focus session not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Focus session deleted successfully"
        });
    } catch (error) {
        console.error("Delete focus session error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting focus session"
        });
    }
};

module.exports = {
    createFocusSession,
    getFocusSessions,
    getTodayFocus,
    deleteFocusSession
};