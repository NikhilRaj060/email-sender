const Resume = require("../models/Resume");
const fs = require("fs");

exports.getResumeForUser = async (userId) => {
  const resume = await Resume.findOne({ userId });

  if (!resume) {
    return null;
  }

  if (!fs.existsSync(resume.path)) {
    return null;
  }

  return {
    filename: resume.originalName || resume.filename,
    path: resume.path,
  };
};
