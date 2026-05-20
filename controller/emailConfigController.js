const EmailConfigSchema = require("../models/EmailConfig");

const postEmailConfig = async (req, res) => {
  try {
    const userId = req.currentUserId;
    const existingConfig = await EmailConfigSchema.findOne({userId});
    if (existingConfig) {
      return res.json({
        message: "Email configuration already exists.",
        config: existingConfig,
        status: 200,
      });
    }
    
    const { smtpHost, smtpPort, smtpUser, smtpPass, fromEmail } = req.body;

    const newConfig = new EmailConfigSchema({
      smtpHost: smtpHost || "smtp.gmail.com",
      smtpPort: smtpPort || 587,
      smtpUser,
      smtpPass,
      fromEmail,
      userId,
    });

    await newConfig.save();
    return res.json({
      message: "Email configuration saved successfully.",
      config: newConfig,
      status: 201,
    });
  } catch (error) {
    throw new Error("Error saving email configuration: " + error.message);
  }
};

module.exports = {
  postEmailConfig,
};