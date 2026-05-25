const nodemailer = require("nodemailer");
const EmailConfig = require("../models/EmailConfig");

// Cache containing active pooled transporters and their configuration hashes
// Key: userId string -> Value: { transporter, configHash }
const transporterCache = new Map();

exports.getTransporterForUser = async (userId) => {
  const config = await EmailConfig.findOne({ userId });

  if (!config) {
    throw new Error("Email configuration not found for user");
  }

  const userIdStr = userId.toString();
  const configHash = `${config.smtpHost}:${config.smtpPort}:${config.smtpUser}:${config.smtpPass}:${config.fromEmail}`;

  // Check if we have an active cached pooled transporter that matches current configuration
  if (transporterCache.has(userIdStr)) {
    const cached = transporterCache.get(userIdStr);
    if (cached.configHash === configHash) {
      return {
        transporter: cached.transporter,
        fromEmail: config.fromEmail,
      };
    } else {
      // Configuration updated by user - close the old pool and recreate
      console.log(`🔄 SMTP configuration changed for user ${userIdStr}. Closing and recreating transporter pool...`);
      try {
        cached.transporter.close();
      } catch (err) {
        console.error("⚠️ Failed to close old transporter:", err);
      }
      transporterCache.delete(userIdStr);
    }
  }

  // Create a new pooled transporter with maxConnections: 1.
  // This keeps exactly 1 SMTP connection open and authenticates once,
  // making sequential email sending extremely fast (under 1 second per email)
  // while preventing multiplexing issues or attachment leaks.
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    pool: true,
    maxConnections: 1,      // Sequentially reuse exactly 1 active SMTP connection
    maxMessages: Infinity,  // Keep connection alive for all messages
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  transporterCache.set(userIdStr, {
    transporter,
    configHash,
  });

  return {
    transporter,
    fromEmail: config.fromEmail,
  };
};

exports.closeAndEvictTransporter = (userId) => {
  if (!userId) return;
  const userIdStr = userId.toString();
  if (transporterCache.has(userIdStr)) {
    console.log(`🔌 [User:${userIdStr}] Evicting closed/failed SMTP transporter from pool cache...`);
    const cached = transporterCache.get(userIdStr);
    try {
      cached.transporter.close();
    } catch (_) {}
    transporterCache.delete(userIdStr);
  }
};
