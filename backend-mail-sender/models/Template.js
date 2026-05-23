const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    content: { type: String, required: true },
    subjects: { type: [String], default: [] },
    fileName: { type: String, required: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

TemplateSchema.index({ userId: 1, name: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Template", TemplateSchema);
