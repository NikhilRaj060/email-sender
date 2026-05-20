const Template = require("../models/Template");

const uploadTemplate = async (req, res, next) => {
  try {
    const userId = req.currentUserId;
    const name = req.body.name || (req.file && req.file.originalname) || "Untitled Template";

    if (!req.file && !req.body.content) {
      return res.status(400).json({
        success: false,
        message: "Template file or content is required",
      });
    }

    const content = req.file
      ? req.file.buffer.toString("utf-8")
      : req.body.content;

    const existingTemplate = await Template.findOne({ userId, name });
    if (existingTemplate) {
      existingTemplate.content = content;
      existingTemplate.fileName = req.file ? req.file.originalname : existingTemplate.fileName;
      await existingTemplate.save();
      return res.json({
        success: true,
        message: "Template updated successfully",
        template: existingTemplate,
      });
    }

    const template = new Template({
      name,
      content,
      fileName: req.file ? req.file.originalname : undefined,
      userId,
    });

    await template.save();

    res.status(201).json({
      success: true,
      message: "Template uploaded successfully",
      template,
    });
  } catch (error) {
    next(error);
  }
};

const getTemplates = async (req, res, next) => {
  try {
    const userId = req.currentUserId;
    const templates = await Template.find({ userId }).sort({ createdAt: 1 });

    res.json({ success: true, templates });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadTemplate, getTemplates };
