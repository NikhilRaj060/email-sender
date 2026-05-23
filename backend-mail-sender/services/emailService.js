const EmailLog = require("../models/EmailLog");
const dayjs = require("dayjs");

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
}) => {
  const log = await EmailLog.findOne({ email: to , userId });

  // 🕒 Cooldown check
  if (log?.lastSentAt) {
    const diff = dayjs().diff(dayjs(log.lastSentAt), "hour");
    if (diff < 168) {
      // 7 days
      await EmailLog.updateOne(
        { email: to },
        {
          status: "COOLDOWN",
          reason: "Cooldown not completed",
          userId
        },
      );

      let sent = coolDownCount;

      logEmailEvent({
        email: to,
        status: "COOLDOWN",
        reason: "Cooldown not completed",
        sent,
        total,
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
      { email: to },
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

    await Promise.race([
      sendPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout after 20 seconds")), 20000),
      ),
    ]);

    // Add delay only after successful send attempt
    const delayMs = 2000 + Math.floor(Math.random() * 2000);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    await EmailLog.findOneAndUpdate(
      { email: to },
      {
        status: "SENT",
        reason: null,
        lastSentAt: new Date(),
        userId,
      },
      { upsert: true },
    );

    logEmailEvent({ email: to, status: "SENT", sent, total });

    return { status: "SENT" };
  } catch (err) {
    await EmailLog.findOneAndUpdate(
      { email: to },
      {
        status: "FAILED",
        reason: err.message,
        retryCount: (log?.retryCount || 0) + 1,
        userId,
      },
      { upsert: true },
    );
    let sent = failedCount;
    logEmailEvent({ email: to, status: "FAILED", reason: err.message, sent, total });
    return {
      status: "FAILED",
      reason: err.message,
    };
  }
};

function logEmailEvent({ email, status, reason, sent, total }) {
  const ts = new Date().toISOString();

  if (status === "SENT") {
    console.log(`📧 [${ts}] SENT → ${email} -> sent count ${sent} of ${total}`);
  } else if (status === "COOLDOWN") {
    console.warn(
      `⏳ [${ts}] COOLDOWN → ${email} | ${reason} -> cool down count ${sent} of ${total}`,
    );
  } else if (status === "FAILED") {
    console.error(
      `❌ [${ts}] FAILED → ${email} | ${reason} -> failed count ${sent} of ${total}`,
    );
  } else {
    console.log(`ℹ️ [${ts}] ${status} → ${email} | ${reason || ""}`);
  }
}
