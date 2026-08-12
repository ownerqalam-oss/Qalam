import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseUrl } from "./env";

export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing server-only SUPABASE_SECRET_KEY");

  return createClient<Database>(supabaseUrl(), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
