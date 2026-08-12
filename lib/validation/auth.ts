import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password."),
});

export const passwordSchema = z.object({
  password: z.string().min(10, "Use at least 10 characters."),
  confirmPassword: z.string(),
}).refine(({ password, confirmPassword }) => password === confirmPassword, {
  message: "Passwords do not match.", path: ["confirmPassword"],
});

export const authCodeSchema = z.string().min(1).max(2048);
