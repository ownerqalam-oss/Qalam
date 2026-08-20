import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { unsubscribeUrl } from "../../../lib/unsubscribe";

interface NewPiece {
  id: string;
  title: string;
  type: string;
  is_anonymous: boolean;
  user_id: string;
}

function pieceListHtml(pieces: NewPiece[], writerNames: Record<string, string>) {
  return pieces
    .map((piece) => {
      const byline = piece.is_anonymous
        ? "Anonymous"
        : writerNames[piece.user_id] ?? "Qalam Writer";

      const typeLabel = piece.type === "story" ? "Short Story" : piece.type;

      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #DCD4C9;">
            <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#42614A;">${typeLabel}</p>
            <a href="https://qalam.ie/journal/${piece.id}" style="display:block;margin-top:4px;font-size:17px;font-weight:600;color:#053400;text-decoration:none;">${piece.title}</a>
            <p style="margin:4px 0 0;font-size:13px;color:#81766D;">${byline}</p>
          </td>
        </tr>`;
    })
    .join("");
}

function digestHtml(pieces: NewPiece[], writerNames: Record<string, string>, unsubscribeLink: string) {
  return `<!doctype html>
<html>
<body style="margin:0;background:#F7F1E8;font-family:system-ui,sans-serif;color:#46382F;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <h1 style="color:#053400;font-size:22px;margin:0 0 4px;">Qalam</h1>
    <p style="color:#70655C;font-size:14px;margin:0 0 24px;">New on Qalam today</p>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${pieceListHtml(pieces, writerNames)}
    </table>

    <p style="margin-top:32px;font-size:12px;color:#9A9188;">
      You're receiving this because you have an account on Qalam.
      <a href="${unsubscribeLink}" style="color:#9A9188;">Unsubscribe</a> from these daily emails.
    </p>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");

  if (!secret || secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: newPieces, error: piecesError } = await supabase
    .from("drafts")
    .select("id, title, type, is_anonymous, user_id")
    .eq("status", "published")
    .gte("published_at", since);

  if (piecesError) {
    console.error("Error loading new pieces for digest:", piecesError);
    return NextResponse.json({ error: "Failed to load new pieces" }, { status: 500 });
  }

  if (!newPieces || newPieces.length === 0) {
    return NextResponse.json({ skipped: "no new pieces in the last 24h" });
  }

  const authorIds = Array.from(
    new Set(newPieces.filter((piece) => !piece.is_anonymous).map((piece) => piece.user_id))
  );

  const { data: authorProfiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", authorIds.length > 0 ? authorIds : ["00000000-0000-0000-0000-000000000000"]);

  const writerNames: Record<string, string> = {};
  for (const profile of authorProfiles ?? []) {
    writerNames[profile.id] = profile.display_name || "Qalam Writer";
  }

  const { data: subscribedProfiles, error: subscribersError } = await supabase
    .from("profiles")
    .select("id")
    .eq("digest_subscribed", true);

  if (subscribersError) {
    console.error("Error loading digest subscribers:", subscribersError);
    return NextResponse.json({ error: "Failed to load subscribers" }, { status: 500 });
  }

  if (!subscribedProfiles || subscribedProfiles.length === 0) {
    return NextResponse.json({ skipped: "no subscribers" });
  }

  const subscribedIds = new Set(subscribedProfiles.map((profile) => profile.id));

  const { data: userList, error: usersError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (usersError) {
    console.error("Error loading users for digest:", usersError);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }

  const recipients = userList.users.filter(
    (user) => subscribedIds.has(user.id) && !!user.email
  );

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not set");
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const html = digestHtml(newPieces, writerNames, unsubscribeUrl(recipient.id));

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Qalam <onboarding@resend.dev>",
        to: recipient.email,
        subject: `${newPieces.length} new ${newPieces.length === 1 ? "piece" : "pieces"} on Qalam today`,
        html,
      }),
    });

    if (emailResponse.ok) {
      sent += 1;
    } else {
      failed += 1;
      console.error("Digest send failed for", recipient.email, await emailResponse.text());
    }
  }

  return NextResponse.json({ sent, failed, pieces: newPieces.length });
}
