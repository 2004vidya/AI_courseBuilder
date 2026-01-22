import { z } from "zod";

export const LessonSchema = z.object({
  title: z.string().min(1),
  content: z.union([
    z.string(),
    z.array(z.string())
  ])
});
