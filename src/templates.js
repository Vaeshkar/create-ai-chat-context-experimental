const path = require("path");

/**
 * Available project templates
 */
const TEMPLATES = {
  default: {
    name: "Generic/Universal",
    description: "Works for any project type",
    dir: "ai",
  },
  nextjs: {
    name: "Next.js/React",
    description: "Next.js, React, TypeScript projects",
    dir: "nextjs",
  },
  python: {
    name: "Python",
    description: "Python, FastAPI, Django, Flask projects",
    dir: "python",
  },
  rust: {
    name: "Rust",
    description: "Rust projects",
    dir: "rust",
  },
  api: {
    name: "Backend API",
    description: "Generic backend API projects",
    dir: "api",
  },
};

/**
 * Get template configuration
 */
function getTemplate(templateName) {
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(
      `Unknown template: ${templateName}. Available: ${Object.keys(TEMPLATES).join(", ")}`
    );
  }
  return template;
}

/**
 * Get all available templates
 */
function listTemplates() {
  return Object.entries(TEMPLATES).map(([key, value]) => ({
    key,
    ...value,
  }));
}

/**
 * Get template directory path
 */
function getTemplateDir(templateName) {
  const template = getTemplate(templateName);
  return path.join(__dirname, "../templates", template.dir);
}

/**
 * Check if template exists
 */
function templateExists(templateName) {
  return templateName in TEMPLATES;
}

module.exports = {
  TEMPLATES,
  getTemplate,
  listTemplates,
  getTemplateDir,
  templateExists,
};

