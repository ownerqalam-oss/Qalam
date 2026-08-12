import { NextResponse } from "next/server";
import { getCurrentUser, hasDevelopmentBypass, isAdmin } from "../../../lib/auth";

export async function GET() {
  const developmentBypass = await hasDevelopmentBypass();
  const user = developmentBypass ? null : await getCurrentUser();
  return NextResponse.json(
    {
      authenticated: developmentBypass || Boolean(user),
      admin: user ? await isAdmin(user.id) : false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
