"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../../lib/supabase/client";
import { useToast } from "../../components/ToastProvider";
import ConfirmDialog from "../../components/ConfirmDialog";
import AyahLoader from "../../components/AyahLoader";
import { getGenreColor } from "../../lib/genreColors";
import InkFlourish from "../../components/InkFlourish";
import CoverImage from "../../components/CoverImage";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

interface Draft {
  id: string;
  title: string;
  created_at: string;
  status: string;
  type: string;
  feedback: string | null;
}

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface SavedArticle {
  id: string;
  title: string;
  type: string;
  cover_image_url: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

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
        .select("id, title, created_at, status, type, feedback")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (draftError) {
        console.error("Error loading drafts:", draftError);
      }

      if (draftData) {
        setDrafts(draftData);
      }

      /*
       * LOAD SAVED ARTICLES
       */
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from("bookmarks")
        .select("draft:drafts(id, title, type, cover_image_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookmarkError) {
        console.error("Error loading saved articles:", bookmarkError);
      }

      if (bookmarkData) {
        const articles: SavedArticle[] = [];

        for (const row of bookmarkData) {
          const draft = Array.isArray(row.draft) ? row.draft[0] : row.draft;
          if (draft) articles.push(draft);
        }

        setSavedArticles(articles);
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
      let resolvedProfile: Profile | null = profileData ?? null;

      if (!profileData) {
        console.log("No profile found. Creating profile...");

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
          resolvedProfile = {
            id: user.id,
            display_name: null,
            bio: null,
            avatar_url: null,
          };
        } else if (createdProfile) {
          console.log("Profile created successfully.");
          resolvedProfile = createdProfile;
        }
      }

      /*
       * New or incomplete profiles never got a chance to set a
       * display name because nothing routed users to
       * /complete-profile. Send them there before showing the
       * dashboard instead of silently defaulting to "Qalam Writer".
       */
      if (!resolvedProfile?.display_name) {
        router.push("/complete-profile");
        return;
      }

      setProfile(resolvedProfile);
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
        showToast("Please select an image.", "error");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast("Image must be smaller than 5MB.", "error");
        return;
      }

      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showToast("You must be logged in.", "error");
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
        showToast(uploadError.message, "error");
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
        showToast(profileError.message, "error");
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

      showToast("Profile picture updated!", "success");
    } catch (error) {
      console.error("Avatar upload error:", error);
      showToast("Something went wrong uploading your picture.", "error");
    }

    setUploading(false);
  }

  function startEditingProfile() {
    setEditName(profile?.display_name || "");
    setEditBio(profile?.bio || "");
    setEditingProfile(true);
  }

  async function saveProfile() {
    if (!editName.trim()) {
      showToast("Please enter your name.", "error");
      return;
    }

    setSavingProfile(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showToast("You must be logged in.", "error");
      setSavingProfile(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: editName.trim(),
        bio: editBio.trim() || null,
      })
      .eq("id", user.id);

    if (error) {
      showToast(error.message, "error");
      setSavingProfile(false);
      return;
    }

    setProfile((current) =>
      current
        ? { ...current, display_name: editName.trim(), bio: editBio.trim() || null }
        : current
    );

    setSavingProfile(false);
    setEditingProfile(false);
    showToast("Profile updated.", "success");
  }

  async function deleteDraft(id: string) {
    const { error } = await supabase
      .from("drafts")
      .delete()
      .eq("id", id);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setDrafts((current) =>
      current.filter((draft) => draft.id !== id)
    );
  }

  function typeLabel(type: string) {
    switch (type) {
      case "reflection":
        return "Reflection";
      case "poetry":
        return "Poetry";
      case "story":
        return "Short Story";
      default:
        return "Article";
    }
  }

  const pendingDrafts = drafts.filter((draft) => draft.status === "submitted");
  const otherDrafts = drafts.filter((draft) => draft.status !== "submitted");

  function renderDraftCard(draft: Draft, index: number) {
    const genreColor = getGenreColor(draft.type);

    return (
      <div
        key={draft.id}
        style={{ animationDelay: `${index * 70}ms` }}
        className={`animate-fade-in-up flex items-center justify-between rounded-xl border border-[#DCD4C9] border-t-4 ${genreColor.cardBorder} bg-[#E9E2D8] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
      >

        <Link
          href={`/editor?id=${draft.id}`}
          className="flex-1"
        >

          <div className="mb-2 flex items-center gap-2">

            <span
              className={`${inter.className} rounded-full ${genreColor.badgeBg} px-3 py-1 text-xs uppercase tracking-wide ${genreColor.badgeText}`}
            >
              {typeLabel(draft.type)}
            </span>

            <span
              className={`${inter.className} rounded-full px-3 py-1 text-xs capitalize ${
                draft.status === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-[#E4EDE6] text-[#2E5138]"
              }`}
            >
              {draft.status}
            </span>

          </div>

          <h3
            className={`${poppins.className} text-xl font-medium text-[#46382F]`}
          >
            {draft.title || "Untitled"}
          </h3>

          <p
            className={`${inter.className} mt-2 text-sm text-[#81766D]`}
          >
            {draft.created_at
              ? new Date(draft.created_at).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "short", year: "numeric" }
                )
              : ""}
          </p>

          {draft.status === "rejected" && draft.feedback && (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
              <span className="font-medium">Feedback: </span>
              {draft.feedback}
            </p>
          )}

        </Link>

        <button
          onClick={() => setDraftToDelete(draft.id)}
          disabled={draft.status === "submitted"}
          className={`${inter.className} rounded-full border border-red-300 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent`}
        >
          Delete
        </button>

      </div>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F1E8]">
        <AyahLoader />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <div className="mx-auto max-w-5xl px-6 py-12 md:px-8">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className={`${poppins.className} text-4xl font-medium text-[#053400]`}
            >
              Dashboard
            </h1>

            <InkFlourish className="mt-2 w-[90px]" />
          </div>

          <Link
            href="/new"
            className={`${inter.className} rounded-full bg-[#053400] px-6 py-3 text-[13px] font-medium text-white transition hover:bg-[#0B4D2B] active:scale-95`}
          >
            New Draft
          </Link>
        </div>

        {/* PROFILE */}
        <section className="mt-10 rounded-2xl border border-[#DCD4C9] bg-[#E9E2D8] p-6">

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
                <div
                  className={`${poppins.className} flex h-24 w-24 items-center justify-center rounded-full bg-[#053400] text-3xl font-medium text-white`}
                >
                  {(profile?.display_name || "Q")[0].toUpperCase()}
                </div>
              )}

            </div>

            {/* PROFILE INFO */}
            <div className="flex-1">

              <div className="flex items-center justify-between gap-3">
                <p
                  className={`${inter.className} text-xs font-medium uppercase tracking-[0.2em] text-[#81766D]`}
                >
                  Your Profile
                </p>

                {!editingProfile && (
                  <button
                    onClick={startEditingProfile}
                    className={`${inter.className} text-xs font-medium text-[#053400] transition hover:underline`}
                  >
                    Edit
                  </button>
                )}
              </div>

              {editingProfile ? (
                <div className="mt-2 space-y-3">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                    className={`${inter.className} w-full rounded-lg border border-[#DCD4C9] bg-white px-3 py-2 text-sm text-[#46382F] outline-none focus:border-[#053400]`}
                  />

                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="A short bio (optional)"
                    rows={3}
                    className={`${inter.className} w-full resize-none rounded-lg border border-[#DCD4C9] bg-white px-3 py-2 text-sm text-[#46382F] outline-none focus:border-[#053400]`}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={saveProfile}
                      disabled={savingProfile}
                      className={`${inter.className} rounded-full bg-[#053400] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#0B4D2B] active:scale-95 disabled:opacity-50`}
                    >
                      {savingProfile ? "Saving..." : "Save"}
                    </button>

                    <button
                      onClick={() => setEditingProfile(false)}
                      disabled={savingProfile}
                      className={`${inter.className} rounded-full border border-[#DCD4C9] px-5 py-2 text-sm font-medium text-[#46382F] transition hover:border-[#053400] disabled:opacity-50`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2
                    className={`${poppins.className} mt-1 text-2xl font-medium text-[#46382F]`}
                  >
                    {profile?.display_name || "Qalam Writer"}
                  </h2>

                  {profile?.bio && (
                    <p
                      className={`${inter.className} mt-2 max-w-xl text-sm text-[#70655C]`}
                    >
                      {profile.bio}
                    </p>
                  )}
                </>
              )}

            </div>

            {/* UPLOAD */}
            <div>

              <label
                htmlFor="avatar-upload"
                className={`${inter.className} inline-flex cursor-pointer items-center rounded-full border border-[#DCD4C9] px-4 py-2 text-sm font-medium text-[#46382F] transition hover:border-[#053400] ${
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

              <p
                className={`${inter.className} mt-2 text-xs text-[#9A9188]`}
              >
                JPG, PNG or WebP · Max 5MB
              </p>

            </div>

          </div>

        </section>

        {/* PENDING REVIEW */}
        {pendingDrafts.length > 0 && (
          <div className="mt-10">
            <h2
              className={`${poppins.className} text-2xl font-medium text-[#053400]`}
            >
              Pending Review
            </h2>

            <p className={`${inter.className} mt-1 mb-4 text-sm text-[#70655C]`}>
              Submitted and waiting on an admin - it&apos;ll stay right here until it&apos;s reviewed.
            </p>

            <div className="space-y-4">
              {pendingDrafts.map((draft, index) =>
                renderDraftCard(draft, index)
              )}
            </div>
          </div>
        )}

        {/* DRAFTS */}
        <div className="mt-10 space-y-4">

          {otherDrafts.length === 0 && pendingDrafts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#DCD4C9] p-10 text-center">

              <p className={`${inter.className} text-[#70655C]`}>
                You don't have any drafts yet.
              </p>

              <Link
                href="/new"
                className={`${inter.className} mt-4 inline-block rounded-full bg-[#053400] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#0B4D2B] active:scale-95`}
              >
                Start Writing
              </Link>

            </div>
          ) : (
            otherDrafts.map((draft, index) => renderDraftCard(draft, index))
          )}

        </div>

        {/* SAVED ARTICLES */}
        {savedArticles.length > 0 && (
          <div className="mt-14">
            <h2
              className={`${poppins.className} text-2xl font-medium text-[#053400]`}
            >
              Saved
            </h2>

            <InkFlourish className="mt-2 w-[70px]" />

            <div className="mt-6 space-y-4">
              {savedArticles.map((article) => {
                const genreColor = getGenreColor(article.type);

                return (
                  <Link
                    key={article.id}
                    href={`/journal/${article.id}`}
                    className={`flex items-center gap-4 rounded-xl border border-[#DCD4C9] border-t-4 ${genreColor.cardBorder} bg-[#F1E7D3] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
                  >
                    <CoverImage
                      src={article.cover_image_url}
                      type={article.type}
                      alt={article.title}
                      className="h-14 w-14 shrink-0 rounded-lg"
                    />

                    <h3
                      className={`${poppins.className} text-base font-medium text-[#46382F]`}
                    >
                      {article.title}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <ConfirmDialog
        open={draftToDelete !== null}
        title="Delete this draft?"
        message="This can't be undone."
        confirmLabel="Delete"
        onCancel={() => setDraftToDelete(null)}
        onConfirm={() => {
          if (draftToDelete) deleteDraft(draftToDelete);
          setDraftToDelete(null);
        }}
      />
    </main>
  );
}
