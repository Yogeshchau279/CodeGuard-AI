const express = require("express");
const auth = require("../middleware/auth");
const Review = require("../models/Review");
const mongoose = require("mongoose");
const { analyzeCode, analyzeWithGemini } = require("../services/analyzer");

const router = express.Router();
const SUPPORTED_LANGUAGES = new Set([
  "JavaScript", "TypeScript", "Java", "Python", "C", "C++", "C#", "Go", "PHP", "Ruby",
  "Kotlin", "Swift", "Rust", "SQL", "HTML", "CSS", "Bash", "JSON"
]);
const MAX_CODE_BYTES = 5 * 1024 * 1024;

router.post("/", auth, async (req, res) => {
  try {
    const { language, code } = req.body || {};
    if (typeof language !== "string" || !SUPPORTED_LANGUAGES.has(language)) {
      return res.status(400).json({ success: false, message: "Choose a supported programming language." });
    }
    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ success: false, message: "Add source code before starting the review." });
    }
    if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
      return res.status(413).json({ success: false, message: "Source code exceeds the 5 MB limit." });
    }

    let result = await analyzeWithGemini(code, language);
    if (!result) result = analyzeCode(code, language);

    if (mongoose.connection.readyState === 1) {
      try {
        const review = await Review.create({
          user: req.user.id,
          language,
          code,
          score: result.score,
          issues: result.issues,
          suggestions: result.suggestions,
          source: result.source
        });
        return res.json({ success: true, saved: true, review: { ...result, id: review._id } });
      } catch (dbError) {
        console.error("Review save failed:", dbError.message);
      }
    }

    res.json({ success: true, saved: false, review: result, warning: "Review completed but could not be saved to history. Check the MongoDB connection and server logs." });
  } catch (error) {
    console.error("Review failed:", error.message);
    res.status(500).json({ success: false, message: "Review failed. Check the API logs and try again." });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Review history is unavailable because MongoDB is not connected.", reviews: [] });
    }
    const reviews = await Review.find({ user: req.user.id })
      .select("-code")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, reviews });
  } catch {
    res.status(500).json({ success: false, message: "Could not load history." });
  }
});

module.exports = router;