"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileActionState } from "../app/profile/actions";
import { Avatar } from "./Avatar";
import { SubmitButton } from "./SubmitButton";

const initialState: ProfileActionState = {};

export function ProfileForm({ profile, onboarding = false }: {
  profile: { username: string | null; display_name: string | null; bio: string | null; avatar_path: string | null };
  onboarding?: boolean;
}) {
  const [state, action] = useActionState(saveProfile, initialState);
  const name = profile.display_name || profile.username || "New writer";
  return (
    <form action={action} className="mt-10 space-y-6" encType="multipart/form-data">
      <div className="flex items-center gap-5"><Avatar path={profile.avatar_path} name={name} /><div><label htmlFor="avatar" className="block text-sm font-medium">Avatar</label><input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block max-w-full text-sm" /><p className="mt-1 text-xs text-gray-500">JPEG, PNG, or WebP · maximum 5 MB</p></div></div>
      <div><label htmlFor="username" className="mb-2 block text-sm font-medium">Username</label><input id="username" name="username" required minLength={3} maxLength={30} pattern="[a-z0-9_]+" defaultValue={profile.username ?? ""} placeholder="your_name" className="w-full rounded-lg border px-4 py-3" /><p className="mt-1 text-xs text-gray-500">3–30 lowercase letters, numbers, or underscores.</p></div>
      <div><label htmlFor="displayName" className="mb-2 block text-sm font-medium">Display name</label><input id="displayName" name="displayName" required maxLength={60} defaultValue={profile.display_name ?? ""} className="w-full rounded-lg border px-4 py-3" /></div>
      <div><label htmlFor="bio" className="mb-2 block text-sm font-medium">Bio <span className="font-normal text-gray-500">(optional)</span></label><textarea id="bio" name="bio" maxLength={300} rows={5} defaultValue={profile.bio ?? ""} className="w-full rounded-lg border px-4 py-3" /></div>
      {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <SubmitButton idle={onboarding ? "Complete profile" : "Save profile"} pending="Saving…" />
    </form>
  );
}
