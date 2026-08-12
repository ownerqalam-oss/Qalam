"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../lib/auth";
import { createClient } from "../../lib/supabase/server";
import { moderationSchema, reportReviewSchema } from "../../lib/validation/reports";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

function refreshModeration(targetId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/members");
  revalidatePath("/journal");
  if (targetId) revalidatePath(`/journal/${targetId}`);
}

export async function moderateTarget(input: unknown): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = moderationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the moderation action." };
  const data = parsed.data;
  const valid = data.targetType === "post" ? ["remove", "restore"].includes(data.action) : ["suspend", "reactivate"].includes(data.action);
  if (!valid) return { ok: false, error: "That action does not match the target." };
  const supabase = await createClient();
  const result = data.targetType === "post"
    ? await supabase.rpc("moderate_post", { target_post_id: data.targetId, should_remove: data.action === "remove", action_reason: data.reason, action_note: data.note || null, source_report_id: data.reportId })
    : await supabase.rpc("moderate_profile", { target_profile_id: data.targetId, should_suspend: data.action === "suspend", action_reason: data.reason, action_note: data.note || null, source_report_id: data.reportId });
  if (result.error) return { ok: false, error: "The moderation action could not be completed." };
  refreshModeration(data.targetId);
  return { ok: true };
}

export async function updateReportState(input: unknown): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = reportReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the report update." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_report_review_state", { target_report_id: parsed.data.reportId, next_status: parsed.data.status, action_note: parsed.data.note || null });
  if (error) return { ok: false, error: "The report could not be updated." };
  refreshModeration();
  return { ok: true };
}
