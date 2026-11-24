const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  score: { type: Number, required: true },
  issues: [{
    severity: String,
    title: String,
    line: Number,
    message: String
  }],
  suggestions: [String],
  source: { type: String, default: "local" }
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);