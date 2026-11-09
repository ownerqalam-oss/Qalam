import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isAdminEmail } from "../../../lib/admin";
import { createAdminClient } from "../../../lib/supabase/admin";

// Emails the writer when an admin publishes their piece or sends it back
// with feedback. Called by the admin review page right after the decision
// is saved; the outcome is read back from the database, not trusted from
// the request. (The in-app notification comes from the trigger in 0015.)

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function layout(body: string) {
  return `<div style="font-family:Georgia,'Times New Roman',serif;color:#46382F;max-width:560px;margin:0 auto;padding:24px;background:#F7F1E8;">
    <p style="margin:0 0 20px;font-size:22px;color:#053400;">Qalam</p>
    ${body}
    <p style="margin:28px 0 0;font-size:13px;color:#70655C;">With thanks,<br>The Qalam team</p>
  </div>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:#8A2E2A;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-family:Arial,sans-serif;font-size:15px;">${label}</a></p>`;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { draftId } = await request.json();
  if (!draftId) {
    return NextResponse.json({ error: "Missing draftId" }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not set");
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: draft, error } = await admin
    .from("drafts")
    .select("id, title, status, feedback, user_id")
    .eq("id", draftId)
    .maybeSingle();

  if (error || !draft) {
    return NextResponse.json({ error: "Piece not found" }, { status: 404 });
  }
  if (draft.status !== "published" && draft.status !== "rejected") {
    return NextResponse.json({ skipped: "not reviewed" });
  }

  const [{ data: authUser }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(draft.user_id),
    admin.from("profiles").select("display_name").eq("id", draft.user_id).maybeSingle(),
  ]);
  const to = authUser.user?.email;
  if (!to) {
    return NextResponse.json({ skipped: "writer has no email" });
  }

  const title = escapeHtml(draft.title || "your piece");
  const greeting = `<p>Assalamu alaykum${profile?.display_name ? ` ${escapeHtml(profile.display_name)}` : ""},</p>`;

  const email =
    draft.status === "published"
      ? {
          subject: `Your piece is published on Qalam: ${draft.title || "Untitled"}`,
          html: layout(`${greeting}
            <p><strong>${title}</strong> is now published on Qalam for everyone to read. Thank you for writing it.</p>
            ${button(`https://qalam.ie/journal/${draft.id}`, "Read it on Qalam")}
            <p>Share it with someone who'd appreciate it. Every reader helps.</p>`),
        }
      : {
          subject: `Your piece needs a few changes: ${draft.title || "Untitled"}`,
          html: layout(`${greeting}
            <p>Thank you for sending us <strong>${title}</strong>. Before we publish it, our team has asked for a few changes:</p>
            <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #B8860B;background:#ffffff;white-space:pre-wrap;">${escapeHtml(draft.feedback || "")}</blockquote>
            <p>Make the changes and submit it again whenever you're ready. It keeps everything you've written so far.</p>
            ${button(`https://qalam.ie/editor?id=${draft.id}`, "Edit your piece")}`),
        };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Qalam <notifications@qalam.ie>", to: [to], ...email }),
  });

  if (!response.ok) {
    console.error("Resend API error:", await response.text());
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
