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
  try {
    if (!req.file) return res.status(400).json({ message: "PDF missing" });

    // 1. Call the service to do the extraction and file creation
    const filePath = await processPdfToExcel(req.file.buffer);

    // 2. Read from the newly created XLSX
    const hrList = readHRExcel(filePath);

    const userId = req.currentUserId;

    // Ensure the dynamic per-user sequential worker is started and listening
    await emailWorker.startUserWorker(userId);

    const resume = await getResumeForUser(userId);

    if (!resume) {
      safeDelete(filePath);
      return res.status(422).json({
        message: "Please upload your resume before sending emails",
      });
    }

    const { templateId, templateName } = req.body;
    let template;

    if (templateId) {
      template = await Template.findOne({ _id: templateId, userId });
    } else if (templateName) {
      template = await Template.findOne({ name: templateName, userId });
    } else {
      template = await Template.findOne({ userId }).sort({ createdAt: 1 });
    }

    if (!template) {
      safeDelete(filePath);
      return res.status(422).json({
        message: "Please upload at least one email template before sending",
      });
    }

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

    // 4. Initialize Redis cache tracking state
    await redisService.initJobProgress(bulkJob._id.toString(), {
      totalCount: hrList.length,
      status: "PENDING",
    });

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
    for (const hr of hrList) {
      if (!hr.email) continue;
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
    }

    // 6. Mark job status as PROCESSING
    bulkJob.status = "PROCESSING";
    await bulkJob.save();

    // 7. Safe cleanup of intermediate XLS file
    safeDelete(filePath);

    // 8. Return immediately with 202 Accepted response
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
