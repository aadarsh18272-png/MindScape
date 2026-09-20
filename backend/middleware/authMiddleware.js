const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        console.log("Authorization header:", authHeader ? "Received" : "Missing");

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authorization header missing"
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authorization header must use Bearer token"
            });
        }

        const token = authHeader.substring(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is empty"
            });
        }

        console.log("Token received:", "YES");

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error("JWT_SECRET is missing from .env");

            return res.status(500).json({
                success: false,
                message: "JWT secret is not configured"
            });
        }

        const decoded = jwt.verify(token, secret);

        console.log("JWT verified successfully");

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User associated with token was not found"
            });
        }

        req.user = user;

        next();

    } catch (error) {
        console.error("JWT ERROR:", error.name);
        console.error("JWT MESSAGE:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid authentication token",
            error: error.name
        });
    }
};

module.exports = protect;