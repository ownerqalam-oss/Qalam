"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";

interface Draft {
  id: string;
  title: string;
  created_at: string;
  status: string;
  type: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function DashboardPage() {
  
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error:", userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      /*
       * LOAD DRAFTS
       */
      const { data: draftData, error: draftError } = await supabase
        .from("drafts")
        .select("id, title, created_at, status, type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (draftError) {
        console.error("Error loading drafts:", draftError);
      }

      if (draftData) {
        setDrafts(draftData);
      }

      /*
       * LOAD PROFILE
       */
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, bio, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Error loading profile:",
          JSON.stringify(profileError, null, 2)
        );
      }

      /*
       * PROFILE DOES NOT EXIST
       * Create it automatically.
       */
      if (!profileData) {
        console.log("No profile found. Creating profile...");

        const newProfile: Profile = {
          id: user.id,
          display_name: null,
          bio: null,
          avatar_url: null,
        };

        const { data: createdProfile, error: createProfileError } =
          await supabase
            .from("profiles")
            .insert({
              id: user.id,
              display_name: null,
              bio: null,
              avatar_url: null,
            })
            .select("id, display_name, bio, avatar_url")
            .single();

        if (createProfileError) {
          console.error(
            "Error creating profile:",
            JSON.stringify(createProfileError, null, 2)
          );

          /*
           * Even if creation fails, keep the dashboard usable.
           * This gives the user a temporary profile object.
           */
          setProfile(newProfile);
        } else if (createdProfile) {
          console.log("Profile created successfully.");
          setProfile(createdProfile);
        }
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    }

    setLoading(false);
  }

  async function uploadAvatar(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    try {
      const file = event.target.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please select an image.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB.");
        return;
      }

      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in.");
        setUploading(false);
        return;
      }

      const filePath = `${user.id}/avatar-${Date.now()}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error(
          "Upload error:",
          JSON.stringify(uploadError, null, 2)
        );
        alert(uploadError.message);
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error(
          "Profile update error:",
          JSON.stringify(profileError, null, 2)
        );
        alert(profileError.message);
        setUploading(false);
        return;
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              avatar_url: avatarUrl,
            }
          : current
      );

      alert("Profile picture updated!");
    } catch (error) {
      console.error("Avatar upload error:", error);
      alert("Something went wrong uploading your picture.");
    }

    setUploading(false);
  }

  async function deleteDraft(id: string) {
    if (!window.confirm("Delete this draft?")) return;

    const { error } = await supabase
      .from("drafts")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setDrafts((current) =>
      current.filter((draft) => draft.id !== id)
    );
  }

  function typeEmoji(type: string) {
    switch (type) {
      case "reflection":
        return "✍️ Reflection";

      case "poetry":
        return "📜 Poetry";

      case "story":
        return "📚 Short Story";

      default:
        return "📖 Article";
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-gray-500">
          Loading dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Dashboard
        </h1>

        <Link
          href="/new"
          className="rounded-lg bg-black px-5 py-3 text-white"
        >
          New Draft
        </Link>
      </div>

      {/* PROFILE */}
      <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

          {/* PROFILE IMAGE */}
          <div className="relative">

            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || "Profile"}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black text-3xl font-medium text-white">
                {(profile?.display_name || "Q")[0].toUpperCase()}
              </div>
            )}

          </div>

          {/* PROFILE INFO */}
          <div className="flex-1">

            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
              Your Profile
            </p>

            <h2 className="mt-1 text-2xl font-semibold">
              {profile?.display_name || "Qalam Writer"}
            </h2>

            {profile?.bio && (
              <p className="mt-2 max-w-xl text-sm text-gray-500">
                {profile.bio}
              </p>
            )}

          </div>

          {/* UPLOAD */}
          <div>

            <label
              htmlFor="avatar-upload"
              className={`inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50 ${
                uploading
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              {uploading
                ? "Uploading..."
                : profile?.avatar_url
                ? "Change Picture"
                : "Upload Picture"}
            </label>

            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={uploadAvatar}
              className="hidden"
              disabled={uploading}
            />

            <p className="mt-2 text-xs text-gray-400">
              JPG, PNG or WebP · Max 5MB
            </p>

          </div>

        </div>

      </section>

      {/* DRAFTS */}
      <div className="mt-10 space-y-4">

        {drafts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">

            <p className="text-gray-500">
              You don't have any drafts yet.
            </p>

            <Link
              href="/new"
              className="mt-4 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Start Writing
            </Link>

          </div>
        ) : (
          drafts.map((draft) => (

            <div
              key={draft.id}
              className="flex items-center justify-between rounded-xl border p-5"
            >

              <Link
                href={`/editor?id=${draft.id}`}
                className="flex-1"
              >

                <div className="mb-2 flex items-center gap-2">

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                    {typeEmoji(draft.type)}
                  </span>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs capitalize text-blue-700">
                    {draft.status}
                  </span>

                </div>

                <h3 className="text-xl font-semibold">
                  {draft.title || "Untitled"}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {new Date(
                    draft.created_at
                  ).toLocaleDateString()}
                </p>

              </Link>

              <button
                onClick={() => deleteDraft(draft.id)}
                disabled={draft.status === "submitted"}
                className="rounded-lg border border-red-300 px-4 py-2 text-red-600 disabled:opacity-50"
              >
                Delete
              </button>

            </div>

          ))
        )}

      </div>

    </main>
  );
}
