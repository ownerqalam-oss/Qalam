"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/auth";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";
import { invitationSchema } from "../../../lib/validation/profiles";

export type InvitationActionState = { error?: string; success?: string };

export async function inviteWriter(_state: InvitationActionState, formData: FormData): Promise<InvitationActionState> {
  const admin = await requireAdmin();
  const parsed = invitationSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email." };

  const supabase = await createClient();
  const { data: invitation, error: auditError } = await supabase.from("invitations").insert({ inviter_id: admin.id, email: parsed.data.email }).select("id").single();
  if (auditError || !invitation) return { error: "Could not create the invitation audit record." };

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin");
  if (!origin) return { error: "Could not determine the application URL." };

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    await supabase.from("invitations").update({ status: "failed", error_message: "Server invitation key is not configured." }).eq("id", invitation.id);
    return { error: "Set SUPABASE_SECRET_KEY before sending invitations." };
  }
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(parsed.data.email, { redirectTo: origin });
  await supabase.from("invitations").update(error ? {
    status: "failed", error_message: error.message,
  } : {
    status: "sent", invited_user_id: data.user.id, sent_at: new Date().toISOString(), error_message: null,
  }).eq("id", invitation.id);

  revalidatePath("/admin/invitations");
  if (error) return { error: error.message };
  return { success: `Invitation sent to ${parsed.data.email}.` };
}
