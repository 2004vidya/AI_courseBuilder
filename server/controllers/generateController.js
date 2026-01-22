const { generateAIContent } = require("../ai/aiWrapper");
const safeParseAIJSON = require("../ai/safeParseAIJSON");
const Course = require("../models/courses");

// Helper function to normalize content
function normalizeContent(content) {
  if (Array.isArray(content)) return content.join("\n\n");
  if (typeof content === "string") return content;
  return "";
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

    const aiResult = await generateAIContent(prompt);
    console.log("AI Provider Used:", aiResult.provider);

    const parsed = safeParseAIJSON(aiResult.output, {
      requiredKeys: ["title", "sections"],
      fallback: {
        title: "Untitled Course",
        description: "",
        sections: [],
      },
    });

    // ✅ Save to MongoDB
    const newCourse = new Course({
      title: parsed.title,
      description: parsed.description || "",
      sections: parsed.sections || [],
    });

    const savedCourse = await newCourse.save();

    res.status(201).json({ success: true, course: savedCourse });
  } catch (error) {
    if (error.code === "ALL_PROVIDERS_FAILED") {
      console.error("AI providers exhausted:", error.details);
      return res.status(503).json({
        message: "AI services temporarily unavailable",
      });
    }

    res.status(500).json({ message: "Failed to generate content" });
  }
};

/** ✅ STEP 2: Generate Lesson Content (Retry + Fallback) */
exports.generateLessonContent = async (req, res) => {
  try {
    const { topic, lessonTitle } = req.body;
    if (!topic || !lessonTitle) {
      return res
        .status(400)
        .json({ message: "Topic and lessonTitle required" });
    }

    const prompt = `
CRITICAL: You MUST respond with ONLY valid JSON. No explanations, no markdown, no extra text.

Create a detailed lesson for "${lessonTitle}" in the course "${topic}".

REQUIRED JSON FORMAT (copy this structure exactly):
{
  "title": "${lessonTitle}",
  "content": [
    "First paragraph of lesson content here",
    "Second paragraph of lesson content here",
    "Third paragraph of lesson content here"
  ]
}

LESSON CONTENT REQUIREMENTS:
- The "content" field MUST be an array of strings (each string is one paragraph)
- Start teaching immediately (no "In this lesson..." introductions)
- Include in-depth theory and core concepts
- Provide real-world examples or case studies
- Use clear explanations with metaphors or analogies
- Include practical syntax, formats, or frameworks if relevant
- Highlight common mistakes and best practices
- Length: 1000-1200 words minimum (split into multiple paragraphs)
- Tone: engaging, clear, beginner-friendly but professional

CRITICAL REMINDER: Return ONLY the JSON object above with content as an array. Nothing else.
`;

    const aiResult = await generateAIContent(prompt);
    const parsed = safeParseAIJSON(aiResult.output, {
      requiredKeys: ["title", "content"],
      fallback: {
        title: lessonTitle,
        content: "Lesson content could not be generated.",
      },
    });

    res.status(200).json({
      title: parsed?.title || lessonTitle,
      content: normalizeContent(parsed?.content),
    });
  } catch (error) {
    if (error.code === "ALL_PROVIDERS_FAILED") {
      console.error("AI providers exhausted:", error.details);
      return res.status(503).json({
        message: "AI services temporarily unavailable",
      });
    }

    res.status(500).json({ message: "Failed to generate content" });
  }
};

/** ✅ STEP 3: Generate Quiz Content (New Functionality) */
exports.generateQuizContent = async (req, res) => {
  try {
    const { topic, lessonTitle } = req.body;
    if (!topic || !lessonTitle) {
      return res
        .status(400)
        .json({ message: "Topic and lessonTitle required" });
    }

    const prompt = `
You are creating a quiz for the course "${topic}", specifically for the lesson "${lessonTitle}".

Strict Rules:
- Return ONLY valid JSON in the format:
{
  "title": "Quiz: ${lessonTitle}",
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}
- No extra text, no markdown formatting, no backticks — just valid JSON.
- Generate exactly 5 multiple-choice questions per quiz.
- Each question should have 4 options (A, B, C, D).
- correctAnswer should be the index (0-3) of the correct option.
- Include a brief explanation for each correct answer.

Quiz Content Requirements:
- Questions should test understanding of key concepts from the lesson.
- Mix of difficulty levels: 2 easy, 2 medium, 1 challenging question.
- Avoid trick questions or overly complex wording.
- Focus on practical application and conceptual understanding.
- Questions should be clear, unambiguous, and relevant to the lesson topic.
- Explanations should reinforce learning and clarify misconceptions.

Ensure all text is properly escaped for valid JSON format.
`;

    const aiResult = await generateAIContent(prompt);
    const parsed = safeParseAIJSON(aiResult.output, {
      requiredKeys: ["title", "questions"],
      fallback: {
        title: `Quiz: ${lessonTitle}`,
        questions: [],
      },
    });

    // ✅ Fallback for quiz-specific parsing errors
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return res.status(200).json({
        title: `Quiz: ${lessonTitle}`,
        questions: [
          {
            id: 1,
            question:
              "Quiz content could not be generated properly. Please try again.",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0,
            explanation: "This is a fallback question due to generation error.",
          },
        ],
      });
    }

    res.status(200).json({
      title: parsed.title || `Quiz: ${lessonTitle}`,
      questions: parsed.questions,
    });
  } catch (error) {
    if (error.code === "ALL_PROVIDERS_FAILED") {
      console.error("AI providers exhausted:", error.details);
      return res.status(503).json({
        message: "AI services temporarily unavailable",
      });
    }

    res.status(500).json({ message: "Failed to generate content" });
  }
};
