const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: String,
    mimeType: String,
    size: Number,
    // Store the actual PDF binary in MongoDB so it works in Docker/serverless
    data: { type: Buffer, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Resume", ResumeSchema);
