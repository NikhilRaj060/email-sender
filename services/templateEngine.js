const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

exports.buildEmailFromFile = (templateName, data) => {
  const templatePath = path.join(__dirname, "..", "templates", templateName);
  const source = fs.readFileSync(templatePath, "utf-8");
  const compile = Handlebars.compile(source);
  return compile(data);
};

exports.buildEmailFromContent = (content, data) => {
  const compile = Handlebars.compile(content);
  return compile(data);
};
