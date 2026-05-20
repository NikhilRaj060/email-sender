const Handlebars = require("handlebars");
const { readHRExcel } = require("../services/excelReader");
const { sendEmail } = require("../services/emailService");
const { buildEmailFromContent } = require("../services/templateEngine");
const { getResumeForUser } = require("../services/resumeService");
const { processPdfToExcel } = require("../services/extractionService");
const { appendToFinalReport } = require("../services/finalReportWriter");
const { safeDelete } = require("../utils/deleteTempXlxs");
const EmailLog = require("../models/EmailLog");
const Template = require("../models/Template");
const { getTransporterForUser } = require("../config/mailTransport");

const sendBulkEmails = async (req, res, next) => {
  let failedCount = 0;
  try {
    if (!req.file) return res.status(400).json({ message: "PDF missing" });

    // 1. Call the service to do the extraction and file creation
    const filePath = await processPdfToExcel(req.file.buffer);

    // 2. Read from the newly created XLSX
    const hrList = readHRExcel(filePath);

    const userId = req.currentUserId;

    const resume = await getResumeForUser(userId);

    if (!resume) {
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
      return res.status(422).json({
        message: "Please upload at least one email template before sending",
      });
    }

    let total = hrList.length;
    let sent = 0;
    let coolDownCount = 0;

    const failedEmails = [];
    const results = [];

    const { transporter, fromEmail } = await getTransporterForUser(userId);

    for (const hr of hrList) {
      const email = hr?.email;

      const subjectTemplate = hr?.company
        ? `Frontend Engineer | Exploring Opportunities at ${hr.company}`
        : "Open to Opportunities – Frontend Engineer";

      const subject = Handlebars.compile(subjectTemplate)(hr);
      const html = buildEmailFromContent(template.content, hr);

      const r = await sendEmail({
        transporter,
        to: email,
        fromEmail,
        subject,
        html,
        resume,
        sent,
        coolDownCount,
        failedCount,
        total,
        userId,
      });

      if (r.status === "SENT") sent++;
      else if (r.status === "COOLDOWN") coolDownCount++;
      else failedCount++;

      if (r.status !== "SENT") {
        failedEmails.push({ email, reason: r.reason });
      }

      results.push({
        email,
        status: r.status,
        reason: r.reason,
        company: hr.company,
        name: hr.name,
      });
    }

    // 1️⃣ Create final report XLSX
    const finalReportPath = appendToFinalReport(results, userId);

    // 2️⃣ Delete the intermediate XLS
    safeDelete(filePath);

    res.json({
      success: true,
      fileCreated: "generated_hr.xlsx",
      summary: {
        total,
        sent,
        failedCount,
        coolDownCount,
      },
      failedEmails,
      results,
      finalReport: finalReportPath.split("/").pop(),
    });
  } catch (err) {
    failedCount++;
    next(err);
  }
};

const retryFailedEmails = async (req, res, next) => {
  try {
    const resume = getResume();

    if (!resume) {
      return res.status(400).json({
        success: false,
        message: "Resume file missing in uploads folder",
      });
    }

    const failedEmails = await EmailLog.find({
      status: { $in: ["FAILED"] },
    });

    const result = [];

    for (const log of failedEmails) {
      if (!hr.email || !hr.company || !hr.name) {
        results.push({
          email: hr.email || "UNKNOWN",
          status: "SKIPPED",
          reason: "Missing required fields in Excel",
        });
        continue;
      }

      const r = await sendEmail({
        to: log.email,
        subject: "Job Opportunity - Retry",
        html: "<p>Following up on my previous email</p>",
        resume,
      });

      result.push({
        email: log.email,
        status: r.status,
        reason: r.reason,
      });
    }

    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
};

const getDailyEmailStats = async (req, res, next) => {
  try {
    const stats = await EmailLog.aggregate([
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

module.exports = { sendBulkEmails, retryFailedEmails, getDailyEmailStats };
