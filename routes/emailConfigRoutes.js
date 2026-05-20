const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyAuth");
const emailConfigController = require("../controller/emailConfigController");

/* GET home page. */
router.post(
  "/add/config",
  verifyToken,
  emailConfigController.postEmailConfig,
);

module.exports = router;
