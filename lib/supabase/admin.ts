import { createClient } from "@supabase/supabase-js";

// Service-role client - bypasses RLS entirely. Only ever import this
// from server-side code (API routes), never from anything that ships
// to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
