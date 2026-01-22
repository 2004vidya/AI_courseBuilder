
const { AIerror } = require("../error.js");

const GROQ_MODEL = "llama-3.1-8b-instant";

async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  const baseUrl = process.env.GROQ_BASE_URL;

  if (!apiKey || !baseUrl) {
    throw new AIError(
      "CONFIG_MISSING",
      "Groq API key or base URL not configured",
      "groq",
    );
  }

  if (!prompt || typeof prompt !== "string") {
    throw new AIError(
      "INVALID_INPUT",
      "Prompt must be a non-empty string",
      "groq",
    );
  }

  const requestBody = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: "You are a helpful AI assistant." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  };

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      timeout: 30_000, // 30 seconds hard timeout
    });
    if (response.status === 429) {
      throw new AIError("RATE_LIMIT", "Groq rate limit exceeded", "groq");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new AIError(
        "HTTP_ERROR",
        `Groq HTTP ${response.status}: ${errorText}`,
        "groq",
      );
    }

    const data = await response.json();

    const message = data?.choices?.[0]?.message?.content;

    if (!message) {
      throw new AIError(
        "INVALID_RESPONSE",
        "Groq returned an empty response",
        "groq"
      );
    }

    return {
      success: true,
      provider: "groq",
      model: GROQ_MODEL,
      output: message,
      tokensUsed: data?.usage?.total_tokens ?? null
    };
  } catch (error) {
     if (err instanceof AIError) {
      throw err;
    }
    throw new AIError(
      "NETWORK_ERROR",
      err.message || "Groq network error",
      "groq"
    );
  }
}

module.exports = { callGroq };
