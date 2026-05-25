const mongoose = require("mongoose");

const BulkJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    totalCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    coolDownCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    percentage: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    failedEmails: [
      {
        email: { type: String },
        reason: { type: String },
      },
    ],
    results: [
      {
        email: { type: String },
        status: { type: String },
        reason: { type: String },
        company: { type: String },
        name: { type: String },
      },
    ],
    templateId: { type: String },
    templateName: { type: String },
    finalReport: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BulkJob", BulkJobSchema);
