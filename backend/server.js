const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load .env BEFORE loading routes
dotenv.config({ override: true });
console.log(
    "GEMINI KEY:",
    process.env.GEMINI_API_KEY ? "FOUND" : "MISSING"
);

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const focusRoutes = require("./routes/focusRoutes");
const statsRoutes = require("./routes/statsRoutes");
const aiTutorRoutes = require("./routes/aiTutorRoutes");

console.log("AI TUTOR ROUTE FILE LOADED");

// Connect MongoDB
connectDB();

const app = express();
const path = require("path");


// ==============================
// MIDDLEWARE
// ==============================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../frontend"), {
    setHeaders(res, filePath) {
        const extension = path.extname(filePath).toLowerCase();
        const contentTypes = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "text/javascript; charset=utf-8"
        };

        if (contentTypes[extension]) {
            res.setHeader("Content-Type", contentTypes[extension]);
        }
    }
}));


// ==============================
// ROUTES
// ==============================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/ai-tutor", aiTutorRoutes);

// ==============================
// BASIC ROUTES
// ==============================

app.get("/", (req, res) => {
    res.type("html");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.sendFile(
        path.join(__dirname, "../frontend/index.html")
    );
});

app.get("/api/test", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Mindscape backend is working"
    });
});

// ==============================
// 404 HANDLER
// ==============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

// ==============================
// ERROR HANDLER
// ==============================

app.use((err, req, res, next) => {
    console.error("Server error:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// ==============================
// START SERVER
// ==============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Mindscape server running on http://localhost:${PORT}`);
});
