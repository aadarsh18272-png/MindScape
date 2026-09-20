const FocusSession = require("../models/FocusSession");

// Get weekly focus statistics
const getWeeklyStats = async (req, res) => {
    try {
        const now = new Date();

        // Start of the current week — Monday
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();

        const diff = day === 0 ? 6 : day - 1;

        startOfWeek.setDate(startOfWeek.getDate() - diff);
        startOfWeek.setHours(0, 0, 0, 0);

        // End of the current week — Sunday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        endOfWeek.setMilliseconds(-1);

        const sessions = await FocusSession.find({
            user: req.user._id,
            status: "completed",
            startTime: {
                $gte: startOfWeek,
                $lt: endOfWeek
            }
        });

        const days = [
            {
                day: "Monday",
                shortDay: "Mon",
                minutes: 0
            },
            {
                day: "Tuesday",
                shortDay: "Tue",
                minutes: 0
            },
            {
                day: "Wednesday",
                shortDay: "Wed",
                minutes: 0
            },
            {
                day: "Thursday",
                shortDay: "Thu",
                minutes: 0
            },
            {
                day: "Friday",
                shortDay: "Fri",
                minutes: 0
            },
            {
                day: "Saturday",
                shortDay: "Sat",
                minutes: 0
            },
            {
                day: "Sunday",
                shortDay: "Sun",
                minutes: 0
            }
        ];

        sessions.forEach((session) => {
            const sessionDate = new Date(session.startTime);

            let dayIndex = sessionDate.getDay() - 1;

            if (dayIndex === -1) {
                dayIndex = 6;
            }

            days[dayIndex].minutes += session.duration;
        });

        const totalMinutes = days.reduce(
            (total, day) => total + day.minutes,
            0
        );

        const totalSessions = sessions.length;

        res.status(200).json({
            success: true,
            weekStarting: startOfWeek,
            totalMinutes,
            totalSessions,
            days
        });
    } catch (error) {
        console.error("Get weekly stats error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while getting weekly statistics"
        });
    }
};

module.exports = {
    getWeeklyStats
};