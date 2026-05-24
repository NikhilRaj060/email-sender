const mongoose = require("mongoose");
const Handlebars = require("handlebars");
const { readHRExcel } = require("../services/excelReader");
const { sendEmail } = require("../services/emailService");
const BulkJob = require("../models/BulkJob");
const redisService = require("../services/redisService");
const queueService = require("../services/queueService");
const { buildEmailFromContent } = require("../services/templateEngine");
const { getResumeForUser } = require("../services/resumeService");
const { processPdfToExcel } = require("../services/extractionService");
const { appendToFinalReport } = require("../services/finalReportWriter");
const { safeDelete } = require("../utils/deleteTempXlxs");
const EmailLog = require("../models/EmailLog");
const Template = require("../models/Template");
const { getTransporterForUser } = require("../config/mailTransport");
const emailWorker = require("../workers/emailWorker");

const sendBulkEmails = async (req, res, next) => {
  const userId = req.currentUserId;
  console.log(`🚀 [User:${userId}] Initiating bulk email campaign...`);
  try {
    if (!req.file) {
      console.warn(`⚠️ [User:${userId}] Bulk email failed: PDF file missing`);
      return res.status(400).json({ message: "PDF missing" });
    }

    console.log(`📄 [User:${userId}] Received PDF of size ${(req.file.buffer.length / 1024).toFixed(1)}KB. Running extraction...`);
    // 1. Call the service to do the extraction and file creation
    const filePath = await processPdfToExcel(req.file.buffer);
    console.log(`📝 [User:${userId}] Extracted PDF data to temporary file: ${filePath}`);

    // 2. Read from the newly created XLSX
    const hrList = readHRExcel(filePath);
    console.log(`👥 [User:${userId}] Parsed contact list. Found ${hrList.length} HR contacts.`);

    if (hrList.length === 0) {
      console.warn(`⚠️ [User:${userId}] No valid HR contacts found in the parsed Excel sheet.`);
      safeDelete(filePath);
      return res.status(400).json({ message: "No valid HR contacts found in PDF" });
    }

    // Ensure the dynamic per-user sequential worker is started and listening
    console.log(`👷 [User:${userId}] Checking if user worker is active...`);
    await emailWorker.startUserWorker(userId);

    console.log(`🔎 [User:${userId}] Verifying user resume status...`);
    const resume = await getResumeForUser(userId);

    if (!resume) {
      console.error(`❌ [User:${userId}] Campaign aborted: No resume uploaded or resume missing from database.`);
      safeDelete(filePath);
      return res.status(422).json({
        message: "Please upload your resume before sending emails",
      });
    }

    const { templateId, templateName } = req.body;
    let template;

    console.log(`🗂️ [User:${userId}] Locating email template (Id: ${templateId || "none"}, Name: ${templateName || "none"})...`);
    if (templateId) {
      template = await Template.findOne({ _id: templateId, userId });
    } else if (templateName) {
      template = await Template.findOne({ name: templateName, userId });
    } else {
      template = await Template.findOne({ userId }).sort({ createdAt: 1 });
    }

    if (!template) {
      console.error(`❌ [User:${userId}] Campaign aborted: No valid email template found.`);
      safeDelete(filePath);
      return res.status(422).json({
        message: "Please upload at least one email template before sending",
      });
    }

    console.log(`✅ [User:${userId}] Using template: "${template.name}"`);

    // 3. Create persistent campaign Job record in MongoDB
    const bulkJob = new BulkJob({
      userId,
      totalCount: hrList.length,
      pendingCount: hrList.length,
      status: "PENDING",
      templateId: template._id,
      templateName: template.name,
    });
    await bulkJob.save();
    console.log(`💾 [User:${userId}] Created BulkJob in MongoDB. Job ID: ${bulkJob._id}`);

    // 4. Initialize Redis cache tracking state
    await redisService.initJobProgress(bulkJob._id.toString(), {
      totalCount: hrList.length,
      status: "PENDING",
    });
    console.log(`🔋 [User:${userId}] Initialized Redis progress tracking for Job: ${bulkJob._id}`);

    const getRandomSubject = () => {
      const subjects = Array.isArray(template.subjects)
        ? template.subjects.filter(Boolean)
        : [];
      if (subjects.length === 0) {
        return template.name || "Job Opportunity";
      }
      const randomIndex = Math.floor(Math.random() * subjects.length);
      return subjects[randomIndex];
    };

    // 5. Enqueue each contact email task on RabbitMQ queue
    console.log(`📥 [User:${userId}] Enqueuing ${hrList.length} contact emails to RabbitMQ...`);
    let enqueuedCount = 0;
    for (const hr of hrList) {
      if (!hr.email) {
        console.warn(`⏭️ [User:${userId}] Skipping HR contact (missing email):`, hr.name || "Unknown");
        continue;
      }
      const rawSubject = getRandomSubject();
      const subject = Handlebars.compile(rawSubject)(hr);
      const html = buildEmailFromContent(template.content, hr);

      await queueService.publishEmail(bulkJob._id.toString(), {
        userId,
        email: hr.email,
        subject,
        html,
        hr,
      });
      enqueuedCount++;
    }
    console.log(`📤 [User:${userId}] Successfully enqueued ${enqueuedCount} emails to queue email_queue_${userId}`);

    // 6. Mark job status as PROCESSING
    bulkJob.status = "PROCESSING";
    await bulkJob.save();
    console.log(`⚙️ [User:${userId}] BulkJob status updated to PROCESSING`);

    // 7. Safe cleanup of intermediate XLS file
    safeDelete(filePath);
    console.log(`🧹 [User:${userId}] Cleaned up temporary Excel file`);

    // 8. Return immediately with 202 Accepted response
    console.log(`🎉 [User:${userId}] Campaign successfully initiated. Returning 202 to client.`);
    return res.status(202).json({
      success: true,
      message: "Bulk email sending campaign initiated",
      jobId: bulkJob._id,
      summary: {
        total: hrList.length,
        sent: 0,
        failedCount: 0,
        coolDownCount: 0,
      },
    });
  } catch (err) {
    console.error(`❌ [User:${userId}] Error during sendBulkEmails flow:`, err);
    next(err);
  }
};

const getLatestBulkJob = async (req, res, next) => {
  try {
    const userId = req.currentUserId;
    const latestJob = await BulkJob.findOne({ userId }).sort({ createdAt: -1 });

    if (!latestJob) {
      return res.json(null);
    }

    // Fetch live progress state from Redis cache if available
    const redisProgress = await redisService.getJobProgress(latestJob._id.toString());
    if (redisProgress) {
      return res.json({
        ...latestJob.toObject(),
        sentCount: redisProgress.sentCount,
        failedCount: redisProgress.failedCount,
        coolDownCount: redisProgress.coolDownCount,
        pendingCount: redisProgress.totalCount - (redisProgress.sentCount + redisProgress.failedCount + redisProgress.coolDownCount),
        percentage: redisProgress.percentage,
        status: redisProgress.status,
      });
    }

    return res.json(latestJob);
  } catch (err) {
    next(err);
  }
};

const getBulkJobStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.currentUserId;
    const job = await BulkJob.findOne({ _id: jobId, userId });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const redisProgress = await redisService.getJobProgress(jobId);
    if (redisProgress) {
      return res.json({
        ...job.toObject(),
        sentCount: redisProgress.sentCount,
        failedCount: redisProgress.failedCount,
        coolDownCount: redisProgress.coolDownCount,
        pendingCount: redisProgress.totalCount - (redisProgress.sentCount + redisProgress.failedCount + redisProgress.coolDownCount),
        percentage: redisProgress.percentage,
        status: redisProgress.status,
      });
    }

    return res.json(job);
  } catch (err) {
    next(err);
  }
};

const retryFailedEmails = async (req, res, next) => {
  try {
    const userId = req.currentUserId;

    // Ensure the dynamic per-user sequential worker is started and listening
    await emailWorker.startUserWorker(userId);

    const latestJob = await BulkJob.findOne({ userId }).sort({ createdAt: -1 });

    if (!latestJob) {
      return res.status(404).json({
        success: false,
        message: "No sending campaign found to retry.",
      });
    }

    const failedContacts = latestJob.results.filter((r) => r.status === "FAILED");

    if (failedContacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No failed emails found in the latest campaign.",
      });
    }

    const template = await Template.findOne({ _id: latestJob.templateId, userId });
    if (!template) {
      return res.status(422).json({
        success: false,
        message: "Template used for this campaign was deleted. Cannot retry.",
      });
    }

    const getRandomSubject = () => {
      const subjects = Array.isArray(template.subjects)
        ? template.subjects.filter(Boolean)
        : [];
      if (subjects.length === 0) {
        return template.name || "Job Opportunity";
      }
      const randomIndex = Math.floor(Math.random() * subjects.length);
      return subjects[randomIndex];
    };

    // Re-enqueue each failed contact
    for (const contact of failedContacts) {
      const hr = {
        email: contact.email,
        name: contact.name,
        company: contact.company,
      };
      const rawSubject = getRandomSubject();
      const subject = Handlebars.compile(rawSubject)(hr);
      const html = buildEmailFromContent(template.content, hr);

      await queueService.publishEmail(latestJob._id.toString(), {
        userId,
        email: hr.email,
        subject,
        html,
        hr,
      });
    }

    // Reset Job status and counts
    latestJob.results = latestJob.results.filter((r) => r.status !== "FAILED");
    latestJob.failedEmails = [];
    latestJob.failedCount = Math.max(0, latestJob.failedCount - failedContacts.length);
    latestJob.pendingCount = failedContacts.length;
    latestJob.status = "PROCESSING";
    await latestJob.save();

    // Update Redis progress
    const redisClient = redisService.getClient();
    if (redisClient) {
      const key = `job:progress:${latestJob._id}`;
      await redisClient.hSet(key, {
        failedCount: "0",
        status: "PROCESSING",
      });

      const stats = await redisClient.hGetAll(key);
      const totalCount = parseInt(stats.totalCount || "0", 10);
      const sentCount = parseInt(stats.sentCount || "0", 10);
      const failedCount = 0;
      const coolDownCount = parseInt(stats.coolDownCount || "0", 10);
      const processed = sentCount + failedCount + coolDownCount;
      const percentage = totalCount > 0 ? Math.min(100, Math.round((processed / totalCount) * 100)) : 0;
      await redisClient.hSet(key, "percentage", percentage.toString());
    }

    res.json({
      success: true,
      message: `Retrying ${failedContacts.length} failed emails`,
      jobId: latestJob._id,
    });
  } catch (err) {
    next(err);
  }
};

const getDailyEmailStats = async (req, res, next) => {
  try {
    const userId = req.currentUserId;
    const stats = await EmailLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.day",
          counts: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json(stats);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendBulkEmails,
  retryFailedEmails,
  getDailyEmailStats,
  getLatestBulkJob,
  getBulkJobStatus,
};
