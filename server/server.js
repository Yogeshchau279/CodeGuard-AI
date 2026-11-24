require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const authRoutes = require("./routes/auth");
const reviewRoutes = require("./routes/reviews");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  }
}));
// Source code is limited to 5 MB in the review route. The larger JSON limit
// leaves room for JSON escaping overhead when code is sent by the browser.
app.use(express.json({ limit: "8mb" }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CodeGuard-AI API is running",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
    geminiModel: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    databaseConnected: mongoose.connection.readyState === 1
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);

app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request is too large. Keep source files at or below 5 MB." });
  }
  if (err.message === "Origin is not allowed by CORS.") {
    return res.status(403).json({ success: false, message: "This origin is not allowed to access the API." });
  }
  console.error("Unhandled API error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "replace_with_a_long_random_secret") {
    console.warn("WARNING: Set a unique JWT_SECRET in server/.env before using authentication.");
  }
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      console.log("MongoDB connected");
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);
      console.log("Server will stay online, but database features need MongoDB.");
    }
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();