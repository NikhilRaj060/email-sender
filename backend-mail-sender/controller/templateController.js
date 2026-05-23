const Template = require("../models/Template");

const parseSubjects = (subjectsValue) => {
  if (!subjectsValue) return [];
  if (Array.isArray(subjectsValue)) {
    return subjectsValue
      .flatMap((value) => String(value).split(","))
      .map((subject) => subject.trim())
      .filter(Boolean);
  }

  return String(subjectsValue)
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
};


const uploadTemplate = async (req, res, next) => {
  try {
    const userId = req.currentUserId;
    const name = req.body.name || (req.file && req.file.originalname) || "Untitled Template";
    const subjects = parseSubjects(req.body.subjects);

    if (!req.file && !req.body.content) {
      return res.status(400).json({
        success: false,
        message: "Template file or content is required",
      });
    }

    const content = req.file
      ? req.file.buffer.toString("utf-8")
      : req.body.content;

    if (!subjects.length) {
      return res.status(400).json({ success: false, message: "Email subjects are required" });
    }

    if (!content) {
      return res.status(400).json({ success: false, message: "HTML content is required" });
    }

    const existingTemplate = await Template.findOne({ userId, name });
    if (existingTemplate) {
      existingTemplate.content = content;
      existingTemplate.fileName = req.file ? req.file.originalname : existingTemplate.fileName;
      if (subjects.length) {
        existingTemplate.subjects = subjects;
      }
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
      subjects,
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

const updateTemplate = async (req, res, next) => {
  try {
    const userId = req.currentUserId;
    const templateId = req.params.id;
    const existingTemplate = await Template.findOne({ _id: templateId, userId });

    if (!existingTemplate) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    const name = req.body.name || existingTemplate.name;
    const subjects = req.body.subjects !== undefined ? parseSubjects(req.body.subjects) : existingTemplate.subjects;
    if (req.body.subjects !== undefined && subjects.length === 0) {
      return res.status(400).json({ success: false, message: "Email subjects are required" });
    }

    if (req.body.content !== undefined && !String(req.body.content).trim() && !req.file) {
      return res.status(400).json({ success: false, message: "HTML content is required" });
    }

    const content = req.file
      ? req.file.buffer.toString("utf-8")
      : req.body.content !== undefined
      ? req.body.content
      : existingTemplate.content;

    const nameConflict = await Template.findOne({ userId, name, _id: { $ne: existingTemplate._id } });
    if (nameConflict) {
      return res.status(409).json({ success: false, message: "Another template with this name already exists" });
    }

    existingTemplate.name = name;
    existingTemplate.content = content;
    existingTemplate.fileName = req.file ? req.file.originalname : existingTemplate.fileName;
    existingTemplate.subjects = subjects;

    await existingTemplate.save();

    res.json({ success: true, message: "Template updated successfully", template: existingTemplate });
  } catch (error) {
    next(error);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const userId = req.currentUserId;
    const templateId = req.params.id;
    const deletedTemplate = await Template.findOneAndDelete({ _id: templateId, userId });

    if (!deletedTemplate) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    res.json({ success: true, message: "Template deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadTemplate, getTemplates, updateTemplate, deleteTemplate };
