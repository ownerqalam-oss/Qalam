import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "./lib/admin";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected pages
  if (
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/write") ||
      pathname.startsWith("/admin")) &&
    !user
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin pages require an admin account, not just any login
  if (
    pathname.startsWith("/admin") &&
    user &&
    !isAdminEmail(user.email)
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Logged-in users don't need login/signup
  if (
    (pathname === "/login" || pathname === "/signup") &&
    user
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/write/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
