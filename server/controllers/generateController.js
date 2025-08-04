const { GoogleGenerativeAI } = require("@google/generative-ai");
const Course = require("../models/courses");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

/** ✅ Enhanced Safe JSON Parser with Retry + Fallback */
async function safeParseGeminiJSON(rawText, retryFn) {
  try {
    let cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Invalid JSON boundaries");

    let jsonString = cleaned.slice(start, end + 1);

    // ✅ Sanitize control characters
    jsonString = jsonString.replace(/[\u0000-\u001F\u007F]/g, "");

    // ✅ Try parsing
    return JSON.parse(jsonString);

  } catch (err) {
    console.error("❌ JSON parse error:", err.message);

    // ✅ Retry once if retryFn is provided
    if (retryFn) {
      try {
        console.log("🔄 Retrying Gemini API call...");
        const retryResponse = await retryFn();
        return await safeParseGeminiJSON(retryResponse, null);
      } catch (retryErr) {
        console.error("❌ Retry also failed:", retryErr.message);
      }
    }

    // ✅ Fallback safe object
    return { title: "Parsing Error", description: rawText, sections: [] };
  }
}

/** ✅ STEP 1: Generate + Save Course */
exports.generateCourseStructure = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ message: "Topic is required" });

    const prompt = `
Generate a course OUTLINE for the topic "${topic}".
Rules:
- At least 4 sections
- Each section must have 1–3 lessons
- Include: {title, description, sections: [{id, title, lessons:[{id, title, duration}]}]}
Return only JSON.
    `;

    const fetchGemini = async () => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    };

    const rawText = await fetchGemini();
    const parsed = await safeParseGeminiJSON(rawText, fetchGemini); // ✅ retry enabled

    // ✅ Save to MongoDB
    const newCourse = new Course({
      title: parsed.title,
      description: parsed.description || "",
      sections: parsed.sections || [],
    });

    const savedCourse = await newCourse.save();

    res.status(201).json({ success: true, course: savedCourse });
  } catch (error) {
    console.error("❌ Error generating course:", error.message);
    res.status(500).json({ message: "Failed to generate course" });
  }
};

/** ✅ STEP 2: Generate Lesson Content (Retry + Fallback) */
exports.generateLessonContent = async (req, res) => {
  try {
    const { topic, lessonTitle } = req.body;
    if (!topic || !lessonTitle) {
      return res.status(400).json({ message: "Topic and lessonTitle required" });
    }

    const prompt = `
Write a detailed lesson on "${lessonTitle}" for the course "${topic}".
Return only valid JSON: { "title": "${lessonTitle}", "content": "..." }
    `;

    const fetchGemini = async () => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    };

    const rawText = await fetchGemini();
    const parsed = await safeParseGeminiJSON(rawText, fetchGemini); // ✅ retry enabled

    res.status(200).json({
      title: parsed.title || lessonTitle,
      content: parsed.content || "Content could not be generated",
    });
  } catch (error) {
    console.error("❌ Lesson content error:", error.message);
    res.status(500).json({ message: "Failed to generate lesson content" });
  }
};






// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const dotenv = require("dotenv");
// const { v4:uuidv4 } = require("uuid");

// dotenv.config();

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// const generateLessonPrompt = (courseTitle, lessonTitle) => `
// You are an expert instructor creating a comprehensive course titled "${courseTitle}".

// Now, write the **full lesson content** for the topic: "${lessonTitle}".

// 🔒 Strict Rules:
// - Do NOT include any summary or overview of what the learner will learn.
// - Do NOT begin with phrases like "In this lesson..." or "We'll cover..."
// - Immediately start teaching the actual topic with full-depth explanations.

// 📚 Your lesson MUST include:
// - In-depth theory and core concepts
// - Real-world examples or case studies
// - Visualizable elements (e.g., diagrams, metaphors — described textually)
// - If relevant, include practical syntax, formats, or frameworks
// - Common mistakes and best practices
// - The lesson should be long and complete enough to fill at least 1.5–2 A4 pages (~1000–1200 words)

// 🧠 The tone should be engaging and explanatory, as if teaching a beginner in a classroom.

// Return ONLY the full lesson content, no JSON, headings, or extra annotations.
// `;

// const generateCoursePrompt = (topic) => `
// Generate a structured course outline on the topic "${topic}". Break it down into 5–7 **sections**, each having:
// - A short, descriptive section title
// - 3–5 **lesson titles** within that section (as bullet points)

// Do not explain anything. Just return structured section titles and their lesson titles.
// `;

//  const generateCourse = async (req, res) => {
//   try {
//     const { topic } = req.body;

//     if (!topic) {
//       return res.status(400).json({ error: "Topic is required" });
//     }

//     const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

//     // 1. Generate structured outline
//     const outlineResult = await model.generateContent(generateCoursePrompt(topic));
//     const outlineText = outlineResult.response.text();

//     // 2. Parse sections and lessons from outline
//     const sections = [];
//     const lines = outlineText.split("\n");
//     let currentSection = null;

//     lines.forEach((line) => {
//       if (line.trim() === "") return;

//       if (!line.trim().startsWith("-")) {
//         // Section title
//         if (currentSection) sections.push(currentSection);
//         currentSection = {
//           id: uuidv4(),
//           title: line.trim(),
//           lessons: [],
//         };
//       } else {
//         // Lesson bullet point
//         const lessonTitle = line.replace(/^-/, "").trim();
//         if (currentSection) {
//           currentSection.lessons.push({
//             id: uuidv4(),
//             title: lessonTitle,
//             content: "", // Placeholder
//             duration: "15–20 mins",
//             completed: false,
//           });
//         }
//       }
//     });

//     if (currentSection) sections.push(currentSection);

//     // 3. For each lesson, generate detailed content
//     for (const section of sections) {
//       for (const lesson of section.lessons) {
//         const lessonPrompt = generateLessonPrompt(topic, lesson.title);
//         const lessonResult = await model.generateContent(lessonPrompt);
//         lesson.content = lessonResult.response.text().trim();
//       }
//     }

//     const fullCourse = {
//       id: uuidv4(),
//       title: `Mastering ${topic}`,
//       description: `A detailed and practical course on ${topic}, broken into comprehensive sections and lessons.`,
//       sections,
//     };

//     res.status(200).json({ course: fullCourse });
//   } catch (error) {
//     console.error("Error generating course:", error);
//     res.status(500).json({ error: "Failed to generate course" });
//   }
// };

// module.exports = { generateCourse };

