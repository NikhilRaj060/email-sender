const Resume = require("../models/Resume");

exports.uploadResume = async (req, res, next) => {
  try {
    const userId = req?.currentUserId;
    console.log(`📤 [User:${userId}] Resume upload request received`);

    if (!req.file) {
      console.warn(`⚠️ [User:${userId}] Resume upload failed: No file in request`);
      return res.status(400).json({ message: "Resume PDF missing" });
    }

    console.log(`📎 [User:${userId}] File received: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB, ${req.file.mimetype})`);

    const resumeData = {
      filename: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer, // Store binary in MongoDB
      userId,
    };

    // Upsert → replace existing resume
    await Resume.findOneAndUpdate({ userId }, resumeData, {
      upsert: true,
      new: true,
    });

    console.log(`✅ [User:${userId}] Resume saved to database successfully: ${req.file.originalname}`);

    res.json({
      success: true,
      message: "Resume uploaded successfully",
    });
  } catch (err) {
    console.error(`❌ [User:${req?.currentUserId}] Resume upload error:`, err.message);
    next(err);
  }
};

exports.getResume = async (req, res, next) => {
  try {
    const userId = req?.currentUserId;
    console.log(`📥 [User:${userId}] Fetching resume info`);

    const resume = await Resume.findOne({ userId }).select("-data"); // Don't send binary in list response
    if (!resume) {
      console.log(`📭 [User:${userId}] No resume found`);
      return res.json(null);
    }

    console.log(`✅ [User:${userId}] Resume info returned: ${resume.originalName}`);
    res.json({
      filename: resume.originalName || resume.filename,
      size: resume.size,
      mimeType: resume.mimeType,
      updatedAt: resume.updatedAt,
    });
  } catch (err) {
    console.error(`❌ [User:${req?.currentUserId}] Get resume error:`, err.message);
    next(err);
  }
};

exports.deleteResume = async (req, res, next) => {
  try {
    const userId = req?.currentUserId;
    console.log(`🗑️ [User:${userId}] Delete resume request`);

    const result = await Resume.findOneAndDelete({ userId });
    if (!result) {
      console.warn(`⚠️ [User:${userId}] No resume to delete`);
      return res.status(404).json({ message: "No resume found" });
    }

    console.log(`✅ [User:${userId}] Resume deleted successfully`);
    res.json({ success: true, message: "Resume deleted" });
  } catch (err) {
    console.error(`❌ [User:${req?.currentUserId}] Delete resume error:`, err.message);
    next(err);
  }
};
