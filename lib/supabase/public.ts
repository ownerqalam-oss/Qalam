import { createClient } from "@supabase/supabase-js";

// Anonymous, cookie-less client for server components. Only use it for
// public data: it sees exactly what a logged-out visitor (or a search
// engine crawler) is allowed to see.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
