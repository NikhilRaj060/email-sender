const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyAuth");
const emailControler = require("../controller/emailController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// POST /email/send
router.post(
  "/send",
  verifyToken,
  upload.single("pdf"),
  emailControler.sendBulkEmails,
);
// POST /email/retry
router.post("/retry", verifyToken, emailControler.retryFailedEmails);
// GET /email/stats/daily
router.get("/stats/daily", verifyToken, emailControler.getDailyEmailStats);

// ─── Bulk Job tracking routes ──────────────────────────────────────────────────
router.get("/job/latest", verifyToken, emailControler.getLatestBulkJob);
router.get("/job/:jobId", verifyToken, emailControler.getBulkJobStatus);
router.post("/job/:jobId/cancel", verifyToken, emailControler.cancelBulkJob);

module.exports = router;
