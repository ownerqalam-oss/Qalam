import { redirect } from "next/navigation";
import { ProfileForm } from "../../components/ProfileForm";
import { requireUser } from "../../lib/auth";
import { createClient } from "../../lib/supabase/server";

export default async function OnboardingPage() {
  const user = await requireUser();
  if ("isDevelopmentBypass" in user) redirect("/dashboard");
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("username, display_name, bio, avatar_path, onboarding_completed_at").eq("id", user.id).single();
  if (profile?.onboarding_completed_at) redirect("/dashboard");

  return <main className="mx-auto max-w-2xl px-5 py-12 sm:px-6 sm:py-16"><p className="text-sm font-medium uppercase tracking-[0.25em] text-[#42614A]">One last step</p><h1 className="mt-4 text-4xl font-bold text-[#053400]">Create your writer profile</h1><p className="mt-4 text-gray-600">Choose how readers will know you on Qalam.</p><ProfileForm onboarding profile={profile ?? { username: null, display_name: null, bio: null, avatar_path: null }} /></main>;
}
