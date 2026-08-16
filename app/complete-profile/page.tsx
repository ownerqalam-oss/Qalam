"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";

export default function CompleteProfilePage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!displayName.trim()) {
      alert("Please enter your name.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in.");
        setLoading(false);
        return;
      }

      let avatarUrl: string | null = null;

      // Upload profile picture if one was selected
      if (avatar) {
        if (!avatar.type.startsWith("image/")) {
          alert("Please select an image.");
          setLoading(false);
          return;
        }

        if (avatar.size > 5 * 1024 * 1024) {
          alert("Profile picture must be smaller than 5MB.");
          setLoading(false);
          return;
        }

        const filePath = `${user.id}/avatar-${Date.now()}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatar, {
            cacheControl: "3600",
            upsert: false,
            contentType: avatar.type,
          });

        if (uploadError) {
          console.error("Avatar upload error:", uploadError);
          alert(uploadError.message);
          setLoading(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = `${publicUrl}?t=${Date.now()}`;
      }

      // Update existing profile
      const updateData: {
        display_name: string;
        bio: string | null;
        avatar_url?: string;
      } = {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
      };

      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        alert(profileError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Profile setup error:", error);
      alert("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-[#F7F1E8] px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-[#DCD4C9] bg-[#F7F1E8] p-8">

        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]">
            WELCOME TO QALAM
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-[#053400]">
            Complete Your Profile
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#70655C]">
            Tell us a little about yourself before you start writing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">

          {/* NAME */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#46382F]">
              Display Name
            </label>

            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full rounded-lg border border-[#DCD4C9] bg-white px-4 py-3 text-[#46382F] outline-none focus:border-[#053400]"
            />

            <p className="mt-2 text-xs text-[#81766D]">
              This is the name other Qalam readers will see.
            </p>
          </div>

          {/* BIO */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#46382F]">
              Bio
            </label>

            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell readers a little about yourself..."
              rows={4}
              className="w-full resize-none rounded-lg border border-[#DCD4C9] bg-white px-4 py-3 text-[#46382F] outline-none focus:border-[#053400]"
            />

            <p className="mt-2 text-xs text-[#81766D]">
              Optional.
            </p>
          </div>

          {/* PROFILE PICTURE */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#46382F]">
              Profile Picture
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setAvatar(e.target.files?.[0] || null);
              }}
              className="block w-full text-sm text-[#70655C]"
            />

            <p className="mt-2 text-xs text-[#81766D]">
              JPG, PNG or WebP · Max 5MB · Optional
            </p>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#053400] py-3 font-medium text-white transition hover:bg-[#0B4D2B] disabled:opacity-60"
          >
            {loading ? "Saving Profile..." : "Complete Profile"}
          </button>

        </form>
      </div>
    </main>
  );
}
