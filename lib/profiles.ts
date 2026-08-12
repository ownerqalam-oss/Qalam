import { supabaseUrl } from "./supabase/env";

export function getAvatarUrl(path: string | null) {
  if (!path) return null;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl()}/storage/v1/object/public/avatars/${encodedPath}`;
}
