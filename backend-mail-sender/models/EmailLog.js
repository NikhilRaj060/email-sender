const mongoose = require("mongoose");

const EmailLogSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },

    status: {
      type: String,
      enum: ["SENT", "FAILED", "COOLDOWN", "SKIPPED"],
      default: "SKIPPED",
    },

    reason: { type: String },

    lastSentAt: { type: Date },

    retryCount: { type: Number, default: 0 },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("EmailLog", EmailLogSchema);
