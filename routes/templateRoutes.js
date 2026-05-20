const express = require("express");
const router = express.Router();
const multer = require("multer");
const verifyToken = require("../middlewares/verifyAuth");
const templateController = require("../controller/templateController");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", verifyToken, upload.single("template"), templateController.uploadTemplate);
router.get("/", verifyToken, templateController.getTemplates);

module.exports = router;
