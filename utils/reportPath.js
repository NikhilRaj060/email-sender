const path = require("path");

exports.getFinalReportPath = (userId) => {
  return path.join(__dirname, "..", "reports", `final_email_report_${userId}.xlsx`);
};
