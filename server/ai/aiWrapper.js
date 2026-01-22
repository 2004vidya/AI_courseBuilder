const providerRegistry = require("./providerRegistry");
const { AIError } = require("./error");

const { callGroq } = require("./providers/groq");
const { callOpenRouter } = require("./providers/openrouter");

const providerMap = {
  groq: callGroq,
  openrouter: callOpenRouter,
};
//  * @param {string} prompt
//  * @returns {Promise<Object>} normalized AI response

async function generateAIContent(prompt) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt must be a non-empty string");
  }
  const errors = [];

  for (const provider of providerRegistry) {
    const providerName = provider.name;
    const providerFn = providerMap[providerName];

    if (!providerFn) {
      continue;
    }

    try {
      const result = await providerFn(prompt);

      // First success wins
      if (result && result.success) {
        return result;
      }
    } catch (err) {
      // Normalize unknown errors
      if (err instanceof AIError) {
        errors.push({
          provider: err.provider,
          code: err.code,
          message: err.message,
        });
      } else {
        errors.push({
          provider: providerName,
          code: "UNKNOWN_ERROR",
          message: err.message,
        });
      }

      // Move to next provider
      continue;
    }
  }
  const error = new Error("All AI providers failed");
  error.code = "ALL_PROVIDERS_FAILED";
  error.details = errors;

  throw error;
}

module.exports = { generateAIContent };
