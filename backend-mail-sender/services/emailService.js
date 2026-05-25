const EmailLog = require("../models/EmailLog");
const dayjs = require("dayjs");
const { closeAndEvictTransporter } = require("../config/mailTransport");

exports.sendEmail = async ({
  transporter,
  to,
  fromEmail,
  subject,
  html,
  resume,
  sent,
  coolDownCount,
  failedCount,
  total,
  userId,
  bypassDelay,
}) => {
  const log = await EmailLog.findOne({ email: to , userId });

  // 🕒 Cooldown check
  if (log?.lastSentAt) {
    const diff = dayjs().diff(dayjs(log.lastSentAt), "hour");
    if (diff < 168) {
      // 7 days
      await EmailLog.updateOne(
        { email: to, userId },
        {
          status: "COOLDOWN",
          reason: "Cooldown not completed",
          userId,
        },
      );

      let sent = coolDownCount;

      logEmailEvent({
        email: to,
        status: "COOLDOWN",
        reason: "Cooldown not completed",
        sent,
        total,
        userId,
      });

      return {
        status: "COOLDOWN",
        reason: "Cooldown not completed",
      };
    }
  }

  // ❌ Resume missing
  if (!resume) {
    await EmailLog.findOneAndUpdate(
      { email: to, userId },
      {
        status: "FAILED",
        reason: "Resume file not found",
        userId,
      },
      { upsert: true },
    );

    logEmailEvent({
      email: to,
      status: "FAILED",
      reason: "Resume file not found",
      failedCount,
      total,
      userId,
    });

    return {
      status: "FAILED",
      reason: "Resume file not found",
    };
  }

  try {
    const sendPromise = transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
      attachments: [resume],
    });

    // Timeout that also kills the SMTP connection to prevent ghost sends
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        closeAndEvictTransporter(userId);
        reject(new Error("Timeout after 20 seconds"));
      }, 20000);
    });

    await Promise.race([sendPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    await EmailLog.findOneAndUpdate(
      { email: to, userId },
      {
        status: "SENT",
        reason: null,
        lastSentAt: new Date(),
        userId,
      },
      { upsert: true },
    );

    logEmailEvent({ email: to, status: "SENT", sent, total, userId });

    return { status: "SENT" };
  } catch (err) {
    console.error(`❌ [User:${userId}] [Recipient:${to}] SMTP Dispatch Failure details:`, err);
    // Evict broken transporter from active memory cache to prevent cascade failures on subsequent emails
    closeAndEvictTransporter(userId);

    await EmailLog.findOneAndUpdate(
      { email: to, userId },
      {
        status: "FAILED",
        reason: err.message,
        retryCount: (log?.retryCount || 0) + 1,
        userId,
      },
      { upsert: true },
    );
    let sent = failedCount;
    logEmailEvent({ email: to, status: "FAILED", reason: err.message, sent, total, userId });
    return {
      status: "FAILED",
      reason: err.message,
    };
  }
};

function logEmailEvent({ email, status, reason, sent, total, userId }) {
  const ts = new Date().toISOString();
  const uid = userId ? ` [user:${userId}]` : "";

  if (status === "SENT") {
    console.log(`📧 [${ts}]${uid} SENT → ${email} -> sent count ${sent} of ${total}`);
  } else if (status === "COOLDOWN") {
    console.warn(
      `⏳ [${ts}]${uid} COOLDOWN → ${email} | ${reason} -> cool down count ${sent} of ${total}`,
    );
  } else if (status === "FAILED") {
    console.error(
      `❌ [${ts}]${uid} FAILED → ${email} | ${reason} -> failed count ${sent} of ${total}`,
    );
  } else {
    console.log(`ℹ️ [${ts}]${uid} ${status} → ${email} | ${reason || ""}`);
  }
}
