import { z } from "zod";

export const postIdSchema = z.uuid();
export const writingTypeSchema = z.enum(["article", "reflection", "poetry", "story"]);
export const postInputSchema = z.object({
  id: z.uuid().nullable(),
  title: z.string().trim().max(200),
  tagline: z.string().trim().max(300).transform((value) => value || null),
  contentHtml: z.string().max(1_000_000),
  type: writingTypeSchema,
  tags: z.array(z.string().trim().min(1).max(40)).max(10),
  expectedUpdatedAt: z.iso.datetime().nullable(),
});
