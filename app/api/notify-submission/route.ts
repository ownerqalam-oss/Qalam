import { NextRequest, NextResponse } from "next/server";
import { ADMIN_EMAILS } from "../../../lib/admin";

interface DraftRecord {
  id: number;
  title: string | null;
  status: string;
  type: string;
}

interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: DraftRecord | null;
  old_record: DraftRecord | null;
}

// Supabase Database Webhook: Database > Webhooks > drafts table > UPDATE
// event, pointing at https://qalam.ie/api/notify-submission with header
// x-webhook-secret: <SUPABASE_WEBHOOK_SECRET>. Sends an email to every
// admin in lib/admin.ts whenever a draft's status transitions into
// "submitted" (not on every update to an already-submitted draft).
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");

  if (!secret || secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: SupabaseWebhookPayload = await request.json();
  const record = payload.record;
  const oldRecord = payload.old_record;

  if (!record || record.status !== "submitted") {
    return NextResponse.json({ skipped: "not a submission" });
  }

  if (oldRecord?.status === "submitted") {
    return NextResponse.json({ skipped: "already submitted" });
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not set");
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 }
    );
  }

  const reviewUrl = `https://qalam.ie/admin/review/${record.id}`;
  const title = record.title || "Untitled";

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Qalam <notifications@qalam.ie>",
      to: ADMIN_EMAILS,
      subject: `New submission for review: ${title}`,
      html: `
        <p>A new ${record.type} was submitted for review on Qalam.</p>
        <p><strong>${title}</strong></p>
        <p><a href="${reviewUrl}">Review it here</a></p>
      `,
    }),
  });

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    console.error("Resend API error:", errorText);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
