"use server";

import { requireOnboardedUser } from "../../lib/auth";
import { createClient } from "../../lib/supabase/server";
import { reportSchema } from "../../lib/validation/reports";

export type ReportResult = { ok: true } | { ok: false; error: string };

export async function submitReport(input: unknown): Promise<ReportResult> {
  const user = await requireOnboardedUser();
  if ("isDevelopmentBypass" in user) return { ok: false, error: "The local test writer cannot submit reports." };
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your report." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_report", { target_kind: parsed.data.targetType, target_id: parsed.data.targetId, report_reason: parsed.data.reason, report_details: parsed.data.details || null });
  if (error?.code === "23505") return { ok: false, error: "You already have an open report for this item." };
  if (error) return { ok: false, error: "Your report could not be submitted." };
  return { ok: true };
}
