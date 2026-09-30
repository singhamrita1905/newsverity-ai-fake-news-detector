const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    news: {
      type: String,
      required: true,
      trim: true,
    },

    prediction: {
      type: String,
      required: true,
    },

    confidence: {
      type: String,
      required: true,
    },

    summary: {
      type: String,
      default: "",
    },

    reason: {
      type: String,
      default: "",
    },

    riskLevel: {
      type: String,
      default: "Medium",
    },

    recommendation: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("News", newsSchema);