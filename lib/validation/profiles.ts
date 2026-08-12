import { z } from "zod";

export const usernameSchema = z.string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be at most 30 characters.")
  .regex(/^[a-z0-9_]+$/, "Use only lowercase letters, numbers, and underscores.");

export const profileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1, "Display name is required.").max(60, "Display name must be at most 60 characters."),
  bio: z.string().trim().max(300, "Bio must be at most 300 characters.").transform((value) => value || null),
});

export const avatarSchema = z.instanceof(File)
  .refine((file) => file.size <= 5 * 1024 * 1024, "Avatar must be 5 MB or smaller.")
  .refine((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type), "Avatar must be a JPEG, PNG, or WebP image.");

export const invitationSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
});

export const suspensionSchema = z.object({
  userId: z.uuid(),
  suspended: z.boolean(),
});
