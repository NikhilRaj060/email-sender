const XLSX = require("xlsx");
const fs = require("fs");
const { getFinalReportPath } = require("../utils/reportPath");

exports.appendToFinalReport = (results, userId) => {
  const FINAL_REPORT_PATH = getFinalReportPath(userId);
  let workbook;
  let worksheet;
  let existingData = [];

  // 1️⃣ If file already exists → read it
  if (fs.existsSync(FINAL_REPORT_PATH)) {
    workbook = XLSX.readFile(FINAL_REPORT_PATH);
    worksheet = workbook.Sheets["Email Report"];
    existingData = XLSX.utils.sheet_to_json(worksheet);
  } else {
    // 2️⃣ Else create new workbook
    workbook = XLSX.utils.book_new();
  }

  // 3️⃣ Append new results
  const newData = results.map((r) => ({
    Email: r.email,
    Status: r.status,
    Reason: r.reason || "",
    Name: r.name || "",
    Company: r.company || "",
    Time: new Date().toISOString(),
  }));

  const finalData = [...existingData, ...newData];

  // 4️⃣ Create / overwrite sheet
  const newSheet = XLSX.utils.json_to_sheet(finalData);

  XLSX.utils.book_append_sheet(workbook, newSheet, "Email Report", true);

  // 5️⃣ Write back SAME file
  XLSX.writeFile(workbook, FINAL_REPORT_PATH);

  return FINAL_REPORT_PATH;
};
