const nodemailer = require("nodemailer");
const EmailConfig = require("../models/EmailConfig");

exports.getTransporterForUser = async (userId) => {
  const config = await EmailConfig.findOne({ userId });

  if (!config) {
    throw new Error("Email configuration not found for user");
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
  });

  return {
    transporter,
    fromEmail: config.fromEmail,
  };
};
