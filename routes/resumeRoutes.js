const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/verifyAuth");
const resumeUpload = require("../middlewares/resumeUpload");
const resumeController = require("../controller/resumeController");

router.post(
  "/upload",
  verifyToken,
  resumeUpload.single("resume"),
  resumeController.uploadResume,
);

module.exports = router;
