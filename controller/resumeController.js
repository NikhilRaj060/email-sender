const Resume = require("../models/Resume");

exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume PDF missing" });
    }

    const userId = req?.currentUserId;

    const resumeData = {
      filename: req.file.filename,
      path: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      userId,
    };

    // Upsert → replace existing resume
    await Resume.findOneAndUpdate({ userId }, resumeData, {
      upsert: true,
      new: true,
    });

    res.json({
      success: true,
      message: "Resume uploaded successfully",
    });
  } catch (err) {
    next(err);
  }
};
