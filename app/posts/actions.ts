"use server";

import { revalidatePath } from "next/cache";
import { requireOnboardedUser } from "../../lib/auth";
import { sanitizePostHtml } from "../../lib/sanitize";
import { createClient } from "../../lib/supabase/server";
import { postIdSchema, postInputSchema } from "../../lib/validation/posts";

export type SavePostResult =
  | { ok: true; post: { id: string; updatedAt: string } }
  | { ok: false; error: string; conflict?: boolean };

export async function savePost(input: unknown): Promise<SavePostResult> {
  const user = await requireOnboardedUser();
  if ("isDevelopmentBypass" in user) return { ok: false, error: "The test writer cannot save database changes." };

  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your post." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_post", {
    post_id: parsed.data.id,
    post_title: parsed.data.title,
    post_tagline: parsed.data.tagline,
    post_content_html: sanitizePostHtml(parsed.data.contentHtml),
    post_type: parsed.data.type,
    post_tags: parsed.data.tags,
    expected_updated_at: parsed.data.expectedUpdatedAt,
  });

  if (error || !data) {
    const conflict = error?.code === "40001";
    return { ok: false, conflict, error: conflict ? "This post changed elsewhere. Reload before saving again." : "Your post could not be saved." };
  }

  return { ok: true, post: { id: data.id, updatedAt: data.updated_at } };
}

export async function publishPost(id: string) {
  const user = await requireOnboardedUser();
  if ("isDevelopmentBypass" in user) return { error: "The test writer cannot publish." };
  const postId = postIdSchema.parse(id);
  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("title, content_html, status").eq("id", postId).eq("author_id", user.id).single();
  if (!post || post.status !== "draft") return { error: "This draft is unavailable." };
  if (!post.title.trim()) return { error: "Add a title before publishing." };
  if (!sanitizePostHtml(post.content_html).replace(/<[^>]*>/g, "").trim()) return { error: "Add some writing before publishing." };
  const { error } = await supabase.rpc("publish_post", { post_id: postId });
  if (error) return { error: "This post could not be published." };
  revalidatePath("/journal");
  revalidatePath(`/journal/${postId}`);
  return { ok: true };
}

export async function unpublishPost(id: string) {
  const user = await requireOnboardedUser();
  if ("isDevelopmentBypass" in user) return { error: "The test writer cannot unpublish." };
  const postId = postIdSchema.parse(id);
  const supabase = await createClient();
  const { error } = await supabase.rpc("unpublish_post", { post_id: postId });
  if (error) return { error: "This post could not be unpublished." };
  revalidatePath("/journal");
  revalidatePath(`/journal/${postId}`);
  return { ok: true };
}

export async function deletePost(id: string) {
  const user = await requireOnboardedUser();
  if ("isDevelopmentBypass" in user) return { error: "The test writer cannot delete posts." };
  const postId = postIdSchema.parse(id);
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_draft", { post_id: postId });
  if (error) return { error: "Only your drafts can be deleted." };
  revalidatePath("/dashboard");
  return { ok: true };
}
