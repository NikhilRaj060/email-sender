const pdf = require("pdf-parse-fork");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

const restrictedEmails = new Set(["info@jobcurator.in"]);

/**
 * Smart Parsing: Extracts Name and Company from an email string
 */
function parseEmailDetails(email) {
  if (restrictedEmails.has(email.toLowerCase())) return;
  const [handle, domainPart] = email.split("@");
  const domain = domainPart.split(".")[0];

  // 1. Get Name from Handle
  // Converts "amit.sharma_hr" -> "Amit Sharma"
  let name = handle
    .split(/[._\d-]/) // Split by dot, underscore, numbers, or dashes
    .filter(
      (part) =>
        part.length > 1 &&
        ![
          "hr",
          "recruiter",
          "support",
          "info",
          "career",
          "careers",
          "at",
        ].includes(part.toLowerCase()),
    )
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  // If name is empty (e.g. "hr@..."), default to "HR"
  if (!name.trim()) name = "HR";

  // 2. Get Company from Domain
  let company = "your organization";
  const genericDomains = [
    "gmail",
    "yahoo",
    "outlook",
    "hotmail",
    "protonmail",
    "icloud",
  ];

  if (!genericDomains.includes(domain.toLowerCase())) {
    company = domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  return { name, email, company };
}

async function processPdfToExcel(fileBuffer) {
  try {
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    // 1. Extract Text
    const pdfData = await pdf(fileBuffer);
    const text = pdfData.text;

    // 2. Extract ALL Emails using Regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const foundEmails = text.match(emailRegex) || [];
    const uniqueEmails = [...new Set(foundEmails.map((e) => e.toLowerCase()))];

    // 3. Transform into Rows
    let hrData = uniqueEmails.map((email) => parseEmailDetails(email));
    hrData = hrData.filter(Boolean); // Remove undefined entries from restricted emails

    if (hrData.length === 0) throw new Error("No emails found in PDF.");

    // 4. Generate Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("HR Contacts");
    worksheet.columns = [
      { header: "name", key: "name", width: 25 },
      { header: "email", key: "email", width: 35 },
      { header: "company", key: "company", width: 30 },
    ];
    worksheet.addRows(hrData);

    const filePath = path.join(uploadsDir, "generated_hr.xlsx");
    await workbook.xlsx.writeFile(filePath);

    console.log(`Success! Extracted ${hrData.length} unique contacts.`);
    return filePath;
  } catch (error) {
    console.error("SERVICE ERROR:", error.message);
    throw error;
  }
}

module.exports = { processPdfToExcel };
