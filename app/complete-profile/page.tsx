"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { useToast } from "../../components/ToastProvider";
import { Button } from "../../components/ui/Button";

const headingFont = "font-[family-name:var(--font-heading)]";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!displayName.trim()) {
      showToast("Please enter your name.", "error");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showToast("You must be logged in.", "error");
        setLoading(false);
        return;
      }

      let avatarUrl: string | null = null;

      // Upload profile picture if one was selected
      if (avatar) {
        if (!avatar.type.startsWith("image/")) {
          showToast("Please select an image.", "error");
          setLoading(false);
          return;
        }

        if (avatar.size > 5 * 1024 * 1024) {
          showToast("Profile picture must be smaller than 5MB.", "error");
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
          showToast(uploadError.message, "error");
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
        showToast(profileError.message, "error");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Profile setup error:", error);
      showToast("Something went wrong.", "error");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-cream px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-cream-card p-8">

        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-600">
            WELCOME TO QALAM
          </p>

          <h1 className={`${headingFont} mt-3 text-3xl font-semibold text-brand-900`}>
            Complete Your Profile
          </h1>

          <p className="mt-3 text-sm leading-6 text-ink-600">
            Tell us a little about yourself before you start writing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">

          {/* NAME */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-900">
              Display Name
            </label>

            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-ink-900 outline-none focus:border-brand-900"
            />

            <p className="mt-2 text-xs text-ink-400">
              This is the name other Qalam readers will see.
            </p>
          </div>

          {/* BIO */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-900">
              Bio
            </label>

            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell readers a little about yourself..."
              rows={4}
              className="w-full resize-none rounded-lg border border-border bg-white px-4 py-3 text-ink-900 outline-none focus:border-brand-900"
            />

            <p className="mt-2 text-xs text-ink-400">
              Optional.
            </p>
          </div>

          {/* PROFILE PICTURE */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-900">
              Profile Picture
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setAvatar(e.target.files?.[0] || null);
              }}
              className="block w-full text-sm text-ink-600"
            />

            <p className="mt-2 text-xs text-ink-400">
              JPG, PNG or WebP · Max 5MB · Optional
            </p>
          </div>

          {/* SUBMIT */}
          <Button type="submit" shape="block" disabled={loading} className="w-full">
            {loading ? "Saving Profile..." : "Complete Profile"}
          </Button>

        </form>
      </div>
    </main>
  );
}
