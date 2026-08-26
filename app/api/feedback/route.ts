import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ADMIN_EMAILS } from "../../../lib/admin";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to send feedback." },
      { status: 401 }
    );
  }

  const { message, type, pageUrl } = await request.json();

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { error: "Please enter a message." },
      { status: 400 }
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not set");
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 }
    );
  }

  const safeMessage = escapeHtml(message.trim()).replace(/\n/g, "<br>");
  const safeType = type === "bug" ? "Bug report" : "Feedback";
  const safePageUrl = typeof pageUrl === "string" ? escapeHtml(pageUrl) : "unknown";

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Qalam <notifications@qalam.ie>",
      to: ADMIN_EMAILS,
      subject: `${safeType} from ${user.email}`,
      html: `
        <p><strong>From:</strong> ${escapeHtml(user.email ?? "unknown")}</p>
        <p><strong>Page:</strong> ${safePageUrl}</p>
        <p><strong>Type:</strong> ${safeType}</p>
        <p>${safeMessage}</p>
      `,
    }),
  });

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    console.error("Resend API error:", errorText);
    return NextResponse.json(
      { error: "Failed to send feedback" },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
