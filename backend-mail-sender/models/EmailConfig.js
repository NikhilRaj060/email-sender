const mongoose = require("mongoose");

const EmailConfigSchema = new mongoose.Schema(
  {
    smtpHost: { type: String, required: false, default: "smtp.gmail.com" },
    smtpPort: { type: Number, required: false, default: 587 },
    smtpUser: { type: String, required: true },
    smtpPass: { type: String, required: true },
    fromEmail: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailConfig", EmailConfigSchema);