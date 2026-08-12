"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../../lib/auth";
import { createClient } from "../../lib/supabase/server";
import { avatarSchema, profileSchema } from "../../lib/validation/profiles";

export type ProfileActionState = { error?: string };

export async function saveProfile(_state: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const user = await requireUser();
  if ("isDevelopmentBypass" in user) return { error: "The test writer cannot save database changes." };

  const parsed = profileSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your profile details." };

  const avatarEntry = formData.get("avatar");
  const avatar = avatarEntry instanceof File && avatarEntry.size > 0 ? avatarSchema.safeParse(avatarEntry) : null;
  if (avatar && !avatar.success) return { error: avatar.error.issues[0]?.message ?? "Choose a valid avatar." };

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("avatar_path, onboarding_completed_at")
    .eq("id", user.id)
    .single();
  if (readError) return { error: "Your profile is not ready. Apply the Phase 2 migration and try again." };

  let avatarPath = existing.avatar_path;
  let uploadedPath: string | null = null;
  if (avatar?.success) {
    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[avatar.data.type];
    uploadedPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(uploadedPath, avatar.data, { contentType: avatar.data.type, upsert: false });
    if (error) return { error: "Avatar upload failed. Check the Storage migration and try again." };
    avatarPath = uploadedPath;
  }

  const { error } = await supabase.from("profiles").update({
    username: parsed.data.username,
    display_name: parsed.data.displayName,
    bio: parsed.data.bio,
    avatar_path: avatarPath,
    onboarding_completed_at: existing.onboarding_completed_at ?? new Date().toISOString(),
  }).eq("id", user.id);

  if (error) {
    if (uploadedPath) await supabase.storage.from("avatars").remove([uploadedPath]);
    if (error.code === "23505") return { error: "That username is already taken." };
    return { error: "We could not save your profile." };
  }

  if (uploadedPath && existing.avatar_path && existing.avatar_path !== uploadedPath) {
    await supabase.storage.from("avatars").remove([existing.avatar_path]);
  }

  revalidatePath("/profile");
  revalidatePath(`/writers/${parsed.data.username}`);
  redirect(`/writers/${parsed.data.username}`);
}
