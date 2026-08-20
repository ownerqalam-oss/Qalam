import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { isValidSignature } from "../../../lib/unsubscribe";

function htmlPage(message: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Qalam</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;background:#F7F1E8;color:#46382F;font-family:system-ui,sans-serif;">
  <div style="max-width:420px;margin:80px auto;padding:0 24px;text-align:center;">
    <h1 style="color:#053400;font-size:24px;">Qalam</h1>
    <p style="font-size:15px;line-height:1.6;color:#70655C;">${message}</p>
    <a href="https://qalam.ie" style="display:inline-block;margin-top:16px;color:#053400;font-size:14px;font-weight:500;">
      &larr; Back to Qalam
    </a>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("uid");
  const signature = request.nextUrl.searchParams.get("sig");

  if (!userId || !signature || !isValidSignature(userId, signature)) {
    return new NextResponse(htmlPage("This unsubscribe link is invalid or has expired."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({ digest_subscribed: false })
    .eq("id", userId);

  if (error) {
    return new NextResponse(htmlPage("Something went wrong. Please try again later."), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }

  return new NextResponse(
    htmlPage("You've been unsubscribed from the Qalam daily digest. You won't receive these emails anymore."),
    { headers: { "Content-Type": "text/html" } }
  );
}
