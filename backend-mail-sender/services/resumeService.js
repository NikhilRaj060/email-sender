const Resume = require("../models/Resume");

exports.getResumeForUser = async (userId) => {
  console.log(`📄 [User:${userId}] Looking up resume in database...`);
  
  const resume = await Resume.findOne({ userId });

  if (!resume) {
    console.warn(`⚠️ [User:${userId}] No resume record found in database`);
    return null;
  }

  if (!resume.data || resume.data.length === 0) {
    console.warn(`⚠️ [User:${userId}] Resume record exists but has no data (filename: ${resume.filename})`);
    return null;
  }

  console.log(`✅ [User:${userId}] Resume found: ${resume.originalName || resume.filename} (${(resume.data.length / 1024).toFixed(1)}KB)`);

  return {
    filename: resume.originalName || resume.filename,
    content: resume.data, // Buffer — passed to nodemailer attachment
  };
};
