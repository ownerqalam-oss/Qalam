import { z } from "zod";

export const reportReasonSchema = z.enum(["spam", "harassment", "hateful_abusive", "inappropriate", "plagiarism", "other"]);
export const reportTargetSchema = z.enum(["post", "profile"]);
export const reportSchema = z.object({
  targetType: reportTargetSchema,
  targetId: z.uuid(),
  reason: reportReasonSchema,
  details: z.string().trim().max(1000),
}).superRefine((value, context) => {
  if (value.reason === "other" && value.details.length < 10) context.addIssue({ code: "custom", path: ["details"], message: "Please provide at least 10 characters of detail." });
});

export const moderationSchema = z.object({
  targetType: reportTargetSchema,
  targetId: z.uuid(),
  reportId: z.uuid().nullable(),
  action: z.enum(["remove", "restore", "suspend", "reactivate"]),
  reason: reportReasonSchema,
  note: z.string().trim().max(1000),
});

export const reportReviewSchema = z.object({ reportId: z.uuid(), status: z.enum(["under_review", "dismissed"]), note: z.string().trim().max(1000) });

export const reportReasonLabels: Record<z.infer<typeof reportReasonSchema>, string> = {
  spam: "Spam",
  harassment: "Harassment",
  hateful_abusive: "Hateful or abusive material",
  inappropriate: "Inappropriate content",
  plagiarism: "Plagiarism",
  other: "Other",
};
