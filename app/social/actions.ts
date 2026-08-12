"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedUser } from "../../lib/auth";
import { createClient } from "../../lib/supabase/server";

const idSchema = z.uuid();
export type SocialActionResult = { ok: true } | { ok: false; error: string };

async function runSocialAction(
  rpc: "follow_writer" | "unfollow_writer" | "save_post_for_later" | "unsave_post_for_later",
  id: string,
): Promise<SocialActionResult> {
  const user = await requireOnboardedUser();
  if ("isDevelopmentBypass" in user) return { ok: false, error: "The local test writer cannot change social data." };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "That item is unavailable." };

  const supabase = await createClient();
  const args = rpc === "follow_writer" || rpc === "unfollow_writer"
    ? { writer_id: parsed.data }
    : { target_post_id: parsed.data };
  const { error } = await supabase.rpc(rpc, args);
  if (error) return { ok: false, error: "That change could not be saved. Please try again." };

  revalidatePath("/journal");
  revalidatePath("/following");
  revalidatePath("/saved");
  return { ok: true };
}

export async function followWriter(id: string) { return runSocialAction("follow_writer", id); }
export async function unfollowWriter(id: string) { return runSocialAction("unfollow_writer", id); }
export async function savePostForLater(id: string) { return runSocialAction("save_post_for_later", id); }
export async function unsavePostForLater(id: string) { return runSocialAction("unsave_post_for_later", id); }
