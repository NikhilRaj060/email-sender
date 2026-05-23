const fs = require("fs");

function safeDelete(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Failed to delete file:", filePath, err.message);
  }
}
module.exports = { safeDelete };