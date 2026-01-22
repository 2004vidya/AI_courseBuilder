import { LessonSchema } from "../validators/lessonSchema.js";

export function parseLesson(raw, fallbackTitle) {
  const parsed = LessonSchema.safeParse(raw);

  if (!parsed.success) {
    console.error("❌ Lesson validation failed:", parsed.error.format());

    return {
      title: fallbackTitle,
      content: ""
    };
  }

  const { title, content } = parsed.data;

  return {
    title: title || fallbackTitle,
    content: Array.isArray(content) ? content.join("\n\n") : content
  };
}
