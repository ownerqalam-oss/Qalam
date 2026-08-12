import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";

export const DEV_AUTH_COOKIE = "qalam-dev-auth";
export const DEV_TEST_USER_ID = "00000000-0000-4000-8000-000000000001";

export async function hasDevelopmentBypass() {
  if (process.env.NODE_ENV === "production") return false;
  return (await cookies()).get(DEV_AUTH_COOKIE)?.value === "test-writer";
}

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
});

export async function requireUser() {
  if (await hasDevelopmentBypass()) {
    return { id: DEV_TEST_USER_ID, email: "test@qalam.local", isDevelopmentBypass: true };
  }
  const user = await getCurrentUser();
  if (!user) redirect("/login?message=session-expired");
  return user;
}

export async function requireOnboardedUser() {
  const user = await requireUser();
  if ("isDevelopmentBypass" in user) return user;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at, suspended_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.suspended_at) redirect("/account-suspended");
  if (!profile?.onboarding_completed_at) redirect("/onboarding");
  return user;
}

export async function isAdmin(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true && Boolean(userId);
}

export async function requireAdmin() {
  const user = await requireUser();
  if ("isDevelopmentBypass" in user) redirect("/dashboard");
  if (!(await isAdmin(user.id))) redirect("/dashboard");
  return user;
}
