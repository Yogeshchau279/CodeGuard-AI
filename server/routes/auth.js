const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");

const router = express.Router();

function tokenFor(user) {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const { name: rawName, email: rawEmail, password } = req.body || {};
    const name = typeof rawName === "string" ? rawName.trim().slice(0, 80) : "";
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!name || !email || !password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ success: false, message: "Name, valid email and password (6+ chars) are required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database is not connected. Start MongoDB and try again." });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "replace_with_a_long_random_secret") {
      return res.status(503).json({ success: false, message: "Authentication is not configured. Set JWT_SECRET in server/.env." });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: "Email already registered." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    res.status(201).json({
      success: true,
      token: tokenFor(user),
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: "Email already registered." });
    console.error("Registration failed:", e.message);
    res.status(500).json({ success: false, message: "Registration failed. Check your database connection and try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body || {};
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database is not connected. Start MongoDB and try again." });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "replace_with_a_long_random_secret") {
      return res.status(503).json({ success: false, message: "Authentication is not configured. Set JWT_SECRET in server/.env." });
    }
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    res.json({
      success: true,
      token: tokenFor(user),
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("Login failed:", error.message);
    res.status(500).json({ success: false, message: "Login failed. Check your database connection and try again." });
  }
});

module.exports = router;