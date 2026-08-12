import { ProfileForm } from "../../components/ProfileForm";
import { requireOnboardedUser } from "../../lib/auth";
import { createClient } from "../../lib/supabase/server";

export default async function ProfilePage() {
  const user = await requireOnboardedUser();
  if ("isDevelopmentBypass" in user) return <main className="mx-auto max-w-2xl px-6 py-16"><h1 className="text-4xl font-bold">Test writer profile</h1><p className="mt-4 text-gray-600">The development test writer has no database profile. Sign in with a real invited account to edit profile data.</p></main>;
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("username, display_name, bio, avatar_path").eq("id", user.id).single();
  if (!profile) return null;
  return <main className="mx-auto max-w-2xl px-5 py-12 sm:px-6 sm:py-16"><h1 className="text-4xl font-bold">Edit profile</h1><p className="mt-3 text-gray-600">Update how you appear to readers.</p><ProfileForm profile={profile} /></main>;
}
