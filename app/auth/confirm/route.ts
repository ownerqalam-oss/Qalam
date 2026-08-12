import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { authCodeSchema } from "../../../lib/validation/auth";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";

const allowedTypes: EmailOtpType[] = ["invite", "recovery", "email", "email_change"];

export async function GET(request: NextRequest) {
  const tokenHash = authCodeSchema.safeParse(request.nextUrl.searchParams.get("token_hash"));
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  if (!tokenHash.success || !type || !allowedTypes.includes(type)) return NextResponse.redirect(new URL("/login?message=invalid-link", request.url));

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash.data, type });
  if (error) return NextResponse.redirect(new URL("/login?message=invalid-link", request.url));
  if (type === "invite") {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      await createAdminClient().from("invitations").update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        invited_user_id: user.id,
      }).eq("email", user.email.toLowerCase()).in("status", ["pending", "sent"]);
    }
  }
  return NextResponse.redirect(new URL(type === "invite" || type === "recovery" ? "/set-password" : "/dashboard", request.url));
}
