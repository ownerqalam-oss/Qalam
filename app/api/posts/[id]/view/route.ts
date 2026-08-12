import { createHmac, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { createClient } from "../../../../../lib/supabase/server";
import { postIdSchema } from "../../../../../lib/validation/posts";

const VISITOR_COOKIE = "qalam-visitor";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const parsedId = postIdSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ error: "Post unavailable." }, { status: 404 });

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });

  const secret = process.env.ANALYTICS_HMAC_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) return NextResponse.json({ error: "Analytics are not configured." }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const existingVisitor = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitor && /^[0-9a-f-]{36}$/i.test(existingVisitor) ? existingVisitor : randomUUID();
  const identity = user ? `user:${user.id}` : `visitor:${visitorId}`;
  const utcDay = new Date().toISOString().slice(0, 10);
  const viewerKey = createHmac("sha256", secret).update(`${utcDay}:${identity}`).digest("hex");

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("record_post_view", { target_post_id: parsedId.data, derived_viewer_key: viewerKey });
    if (error) return NextResponse.json({ error: "Post unavailable." }, { status: error.code === "22023" ? 404 : 500 });

    const response = NextResponse.json({ counted: data });
    response.headers.set("Cache-Control", "no-store");
    if (!user && !existingVisitor) response.cookies.set(VISITOR_COOKIE, visitorId, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: ONE_YEAR });
    return response;
  } catch {
    return NextResponse.json({ error: "Analytics are unavailable." }, { status: 503 });
  }
}
