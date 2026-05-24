const queueService = require("../services/queueService");
const redisService = require("../services/redisService");
const socketService = require("../services/socketService");
const { sendEmail } = require("../services/emailService");
const { getResumeForUser } = require("../services/resumeService");
const { getTransporterForUser } = require("../config/mailTransport");
const { appendToFinalReport } = require("../services/finalReportWriter");
const BulkJob = require("../models/BulkJob");
const User = require("../models/User");

const activeUserWorkers = new Set();

const startUserWorker = async (userId) => {
  if (!userId) return;
  const userIdStr = userId.toString();

  if (activeUserWorkers.has(userIdStr)) {
    return; // Worker already active and listening for this user
  }

  const connection = queueService.getConnection();
  if (!connection) {
    console.error(`❌ RabbitMQ connection not available for user worker: ${userIdStr}`);
    return;
  }

  try {
    const userChannel = await connection.createChannel();
    const queueName = `email_queue_${userIdStr}`;

    await userChannel.assertQueue(queueName, { durable: true });
    // Guarantee exactly 1 concurrent email per channel for this user
    await userChannel.prefetch(1);

    activeUserWorkers.add(userIdStr);
    console.log(`👷 Dedicated email worker started for user: ${userIdStr} on queue: ${queueName}`);

    userChannel.consume(queueName, async (msg) => {
      if (!msg) return;

      let payload;
      try {
        payload = JSON.parse(msg.content.toString());
      } catch (err) {
        console.error("❌ Failed to parse queue message:", err);
        userChannel.ack(msg);
        return;
      }

      const { jobId, data } = payload;
      const { email, subject, html, hr } = data;

      try {
        console.log(`✉️ [User:${userIdStr}] [Job:${jobId}] Processing message for ${email} (Name: ${hr?.name || "N/A"}, Company: ${hr?.company || "N/A"})`);
        // 0. Guard: skip messages for jobs that no longer exist or are already completed
        const jobCheck = await BulkJob.findById(jobId);
        if (!jobCheck || jobCheck.status === "COMPLETED") {
          console.log(`⏭️ Skipping stale/completed job message for ${email} (job: ${jobId})`);
          userChannel.ack(msg);
          return;
        }

        // 1. Tiny stagger delay to prevent SMTP burst connections
        await new Promise((resolve) => setTimeout(resolve, 10));

        // 2. Fetch user resume and pooled transporter (sequentially shared connection)
        const resume = await getResumeForUser(userIdStr);
        const { transporter, fromEmail } = await getTransporterForUser(userIdStr);

        // Fetch dynamic progress from Redis or database fallback for logging
        let sent = 0;
        let failed = 0;
        let coolDown = 0;
        let total = 100;
        try {
          const progress = await redisService.getJobProgress(jobId);
          if (progress) {
            sent = progress.sentCount;
            failed = progress.failedCount;
            coolDown = progress.coolDownCount;
            total = progress.totalCount;
          } else {
            const bulkJob = await BulkJob.findById(jobId);
            if (bulkJob) {
              sent = bulkJob.sentCount;
              failed = bulkJob.failedCount;
              coolDown = bulkJob.coolDownCount;
              total = bulkJob.totalCount;
            }
          }
        } catch (progressErr) {
          console.error("⚠️ Failed to fetch job progress for logging:", progressErr);
        }

        // 3. Send email via emailService
        const res = await sendEmail({
          transporter,
          to: email,
          fromEmail,
          subject,
          html,
          resume,
          sent,
          coolDownCount: coolDown,
          failedCount: failed,
          total,
          userId: userIdStr,
          bypassDelay: true, // skip delay inside emailService itself
        });

        const statusType = res.status; // 'SENT', 'FAILED', 'COOLDOWN'
        const reason = res.reason || null;

        // 4. Update progress state in Redis
        const updatedProgress = await redisService.updateJobProgress(jobId, statusType);

        // 5. Build result object
        const resultObj = {
          email,
          status: statusType,
          reason,
          company: hr.company,
          name: hr.name,
        };

        // 6. Persist result in BulkJob MongoDB document
        const bulkJob = await BulkJob.findById(jobId);
        if (bulkJob) {
          bulkJob.results.push(resultObj);
          if (statusType === "FAILED") {
            bulkJob.failedEmails.push({ email, reason });
          }

          if (statusType === "SENT") bulkJob.sentCount += 1;
          else if (statusType === "FAILED") bulkJob.failedCount += 1;
          else if (statusType === "COOLDOWN") bulkJob.coolDownCount += 1;

          bulkJob.pendingCount = Math.max(0, bulkJob.totalCount - (bulkJob.sentCount + bulkJob.failedCount + bulkJob.coolDownCount));
          bulkJob.percentage = updatedProgress.percentage;

          if (bulkJob.sentCount + bulkJob.failedCount + bulkJob.coolDownCount >= bulkJob.totalCount) {
            bulkJob.status = "COMPLETED";
            bulkJob.completedAt = new Date();

            try {
              const finalReportPath = appendToFinalReport(bulkJob.results, userIdStr);
              bulkJob.finalReport = finalReportPath.split("/").pop();
            } catch (reportErr) {
              console.error("❌ Failed to generate final report for job:", jobId, reportErr);
            }
          } else {
            bulkJob.status = "PROCESSING";
          }

          await bulkJob.save();

          socketService.emitProgress(jobId, {
            jobId,
            _id: jobId,
            totalCount: bulkJob.totalCount,
            sentCount: bulkJob.sentCount,
            failedCount: bulkJob.failedCount,
            coolDownCount: bulkJob.coolDownCount,
            pendingCount: bulkJob.pendingCount,
            percentage: bulkJob.percentage,
            status: bulkJob.status,
            results: bulkJob.results,
            finalReport: bulkJob.finalReport || null,
          });
        }

        userChannel.ack(msg);
      } catch (err) {
        console.error(`❌ Worker error processing email to ${email}:`, err);
        
        try {
          const updatedProgress = await redisService.updateJobProgress(jobId, "FAILED");
          const bulkJob = await BulkJob.findById(jobId);
          if (bulkJob) {
            const resultObj = {
              email,
              status: "FAILED",
              reason: err.message,
              company: hr.company,
              name: hr.name,
            };
            bulkJob.results.push(resultObj);
            bulkJob.failedEmails.push({ email, reason: err.message });
            bulkJob.failedCount += 1;
            bulkJob.pendingCount = Math.max(0, bulkJob.totalCount - (bulkJob.sentCount + bulkJob.failedCount + bulkJob.coolDownCount));
            bulkJob.percentage = updatedProgress.percentage;

            if (bulkJob.sentCount + bulkJob.failedCount + bulkJob.coolDownCount >= bulkJob.totalCount) {
              bulkJob.status = "COMPLETED";
              bulkJob.completedAt = new Date();
              try {
                const finalReportPath = appendToFinalReport(bulkJob.results, userIdStr);
                bulkJob.finalReport = finalReportPath.split("/").pop();
              } catch (reportErr) {
                console.error("❌ Failed to generate final report:", reportErr);
              }
            } else {
              bulkJob.status = "PROCESSING";
            }

            await bulkJob.save();

            socketService.emitProgress(jobId, {
              jobId,
              _id: jobId,
              totalCount: bulkJob.totalCount,
              sentCount: bulkJob.sentCount,
              failedCount: bulkJob.failedCount,
              coolDownCount: bulkJob.coolDownCount,
              pendingCount: bulkJob.pendingCount,
              percentage: bulkJob.percentage,
              status: bulkJob.status,
              results: bulkJob.results,
              finalReport: bulkJob.finalReport || null,
            });
          }
        } catch (innerErr) {
          console.error("❌ Worker failed to write failure state to db:", innerErr);
        }

        userChannel.ack(msg);
      }
    });
  } catch (err) {
    console.error(`❌ Failed to start worker for user ${userIdStr}:`, err);
  }
};

const startWorker = async () => {
  console.log("👷 emailWorker.startWorker() called: Booting user-specific dynamic workers...");
  try {
    const users = await User.find({}, "_id");
    for (const user of users) {
      await startUserWorker(user._id);
    }
  } catch (err) {
    console.error("❌ Failed to auto-start user workers on boot:", err);
  }
};

module.exports = {
  startWorker,
  startUserWorker,
};
