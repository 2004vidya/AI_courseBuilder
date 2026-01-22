/**
 * Safely extracts and parses JSON from AI text output
 * Provider-agnostic (Groq, OpenRouter, Gemini, etc.)
 */
function safeParseAIJSON(rawText, options = {}) {
  const {
    fallback = {},
    requiredKeys = [],
  } = options;

  try {
    if (!rawText || typeof rawText !== "string") {
      throw new Error("Empty or non-string AI response");
    }

    // 1️⃣ Remove common AI wrappers
    let cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // 2️⃣ Extract JSON boundaries
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      console.error("🔍 Raw AI Response (first 1000 chars):", rawText.slice(0, 1000));
      throw new Error("No JSON object found in response");
    }

    let jsonString = cleaned.slice(firstBrace, lastBrace + 1);

    // 3️⃣ Remove control characters (hard failure otherwise)
    jsonString = jsonString.replace(/[\u0000-\u001F\u007F]/g, "");

    // 4️⃣ Parse JSON
    const parsed = JSON.parse(jsonString);

    // 5️⃣ Minimal schema validation
    if (requiredKeys.length > 0) {
      for (const key of requiredKeys) {
        if (!(key in parsed)) {
          throw new Error(`Missing required key: ${key}`);
        }
      }
    }

    return parsed;
  } catch (error) {
    console.error("❌ AI JSON Parse Failure:", error.message);
    console.error("🔍 Raw response preview:", rawText?.slice(0, 500));

    return {
      ...fallback,
      __error: "AI_JSON_PARSE_FAILED",
      __raw: rawText?.slice(0, 500), // safe debug window
    };
  }
}

module.exports = safeParseAIJSON;