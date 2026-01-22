
const { AIError } = require("../error.js");

const OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct";

async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENROUTER_BASE_URL;

  if (!apiKey || !baseUrl) {
    throw new AIError(
      "CONFIG_MISSING",
      "OpenRouter API key or base URL not configured",
      "openrouter",
    );
  }

  if (!prompt || typeof prompt !== "string") {
    throw new AIError(
      "INVALID_INPUT",
      "Prompt must be a non-empty string",
      "openrouter",
    );
  }

  const requestBody = {
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: "You are a helpful AI assistant." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  };

  try {
    const response = await fetch(`${baseurl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",

        // 🔴 REQUIRED by OpenRouter
        "HTTP-Referer": "http://localhost:5000", // change in production
        "X-Title": "MERN Course Builder",
      },
      body: JSON.stringify(requestBody),
      timeout: 30_000,
    });

      if (response.status === 429) {
      throw new AIError(
        "RATE_LIMIT",
        "OpenRouter rate limit exceeded",
        "openrouter"
      );
    }

     if (!response.ok) {
      const errorText = await response.text();
      throw new AIError(
        "HTTP_ERROR",
        `OpenRouter HTTP ${response.status}: ${errorText}`,
        "openrouter"
      );
    }

    const data = await response.json();

    const message = data?.choices?.[0]?.message?.content;

    if (!message) {
      throw new AIError(
        "INVALID_RESPONSE",
        "OpenRouter returned an empty response",
        "openrouter"
      );
    }

      return {
      success: true,
      provider: "openrouter",
      model: OPENROUTER_MODEL,
      output: message,
      tokensUsed: data?.usage?.total_tokens ?? null
    };
  } catch (error) {
     if (err instanceof AIError) {
      throw err;
    }

    throw new AIError(
      "NETWORK_ERROR",
      err.message || "OpenRouter network error",
      "openrouter"
    );
  }
}

module.exports = { callOpenRouter };
