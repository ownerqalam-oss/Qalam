"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DEV_AUTH_COOKIE } from "../../lib/auth";
import { loginSchema, passwordSchema } from "../../lib/validation/auth";
import { createClient } from "../../lib/supabase/server";

export type AuthActionState = { error?: string };

export async function login(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid credentials." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email or password is incorrect." };
  redirect("/dashboard");
}

export async function logout() {
  (await cookies()).delete(DEV_AUTH_COOKIE);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function loginAsTestWriter() {
  if (process.env.NODE_ENV === "production") throw new Error("Development login is disabled.");
  (await cookies()).set(DEV_AUTH_COOKIE, "test-writer", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/dashboard");
}

export async function setPassword(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = passwordSchema.safeParse({ password: formData.get("password"), confirmPassword: formData.get("confirmPassword") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid password." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your invitation has expired. Ask for a new invite." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "We could not set your password. Request a new invite and try again." };
  redirect("/onboarding");
}
