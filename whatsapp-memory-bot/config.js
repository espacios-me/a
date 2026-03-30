"use strict";

try {
  require("dotenv").config();
} catch {
  // no-op
}

const ENV_VARS = ["ACCESS_TOKEN", "APP_SECRET", "VERIFY_TOKEN"];

function envFlag(value, fallback = false) {
  if (value == null) return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

module.exports = Object.freeze({
  appSecret: process.env.APP_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  port: Number(process.env.PORT || 8080),
  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: Number(process.env.REDIS_PORT || 6379),
  redisUrl: process.env.REDIS_URL,
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  memoryBackend: process.env.MEMORY_BACKEND || "local",
  dataFile: process.env.DATA_FILE || "./data/store.json",
  googleSheetId: process.env.GOOGLE_SHEET_ID,
  googleServiceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
  cronSecret: process.env.CRON_SECRET,
  reminderTemplateName: process.env.REMINDER_TEMPLATE_NAME,
  reminderTemplateLocale: process.env.REMINDER_TEMPLATE_LOCALE || "en_US",
  disableSignatureValidation: envFlag(process.env.DISABLE_SIGNATURE_VALIDATION, false),
  checkEnvVariables() {
    ENV_VARS.forEach((key) => {
      if (!process.env[key]) console.warn(`WARNING: Missing the environment variable ${key}`);
    });
  },
});
