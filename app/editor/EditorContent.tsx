"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../../lib/supabase/client";
import RichTextEditor from "../../components/RichTextEditor";
import { useToast } from "../../components/ToastProvider";
import AyahLoader from "../../components/AyahLoader";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export default function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const initialId = searchParams.get("id");
  const initialType = searchParams.get("type") ?? "article";

  const [draftId, setDraftId] = useState<string | null>(initialId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState(initialType);
  const [tags, setTags] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [status, setStatus] = useState("Saved");
  const [draftStatus, setDraftStatus] = useState("draft");
  const [feedback, setFeedback] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /*
   * Load existing draft
   */
  useEffect(() => {
    async function loadDraft() {
      if (!draftId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("drafts")
        .select("*")
        .eq("id", draftId)
        .single();

      if (error) {
        console.error("Error loading draft:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setTitle(data.title ?? "");
        setContent(data.content ?? "");
        setType(data.type ?? "article");
        setTags(data.tags?.join(", ") ?? "");
        setDraftStatus(data.status ?? "draft");
        setIsAnonymous(data.is_anonymous ?? false);
        setFeedback(data.feedback ?? null);
        setCoverImageUrl(data.cover_image_url ?? null);
      }

      setLoading(false);
    }

    loadDraft();
  }, [draftId]);

  /*
   * Save draft
   */
  async function saveDraft() {
    if (draftStatus === "submitted") return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setStatus("Saving...");

    const tagArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    /*
     * Update existing draft
     */
    if (draftId) {
      const { error } = await supabase
        .from("drafts")
        .update({
          title,
          content,
          type,
          tags: tagArray,
          is_anonymous: isAnonymous,
          cover_image_url: coverImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId);

      if (error) {
        showToast(error.message, "error");
        setStatus("Error");
        return;
      }

      setStatus("Saved");
      return;
    }

    /*
     * Create new draft
     */
    const { data, error } = await supabase
      .from("drafts")
      .insert({
        user_id: user.id,
        title,
        content,
        type,
        tags: tagArray,
        is_anonymous: isAnonymous,
        cover_image_url: coverImageUrl,
      })
      .select()
      .single();

    if (error) {
      showToast(error.message, "error");
      setStatus("Error");
      return;
    }

    setDraftId(data.id);

    window.history.replaceState(
      {},
      "",
      `/editor?id=${data.id}`
    );

    setStatus("Saved");
  }

  /*
   * Submit for review
   */
  async function submitForReview() {
    if (!draftId) {
      showToast("Please save your draft first.", "error");
      return;
    }

    const { error } = await supabase
      .from("drafts")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", draftId);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setDraftStatus("submitted");
    showToast("Submitted for review! You'll find it under Pending Review on your dashboard.", "success");
    router.push("/dashboard");
  }

  /*
   * Upload cover image
   */
  async function uploadCoverImage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Cover image must be smaller than 5MB.", "error");
      return;
    }

    setUploadingCover(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showToast("You must be logged in.", "error");
      setUploadingCover(false);
      return;
    }

    const filePath = `${user.id}/cover-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      showToast(uploadError.message, "error");
      setUploadingCover(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    setCoverImageUrl(`${publicUrl}?t=${Date.now()}`);
    setUploadingCover(false);
  }

  /*
   * Auto-save
   */
  useEffect(() => {
    if (loading) return;

    if (draftStatus === "submitted") return;

    if (!title.trim() && !content.trim()) return;

    setStatus("Typing...");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    title,
    content,
    type,
    tags,
    isAnonymous,
    coverImageUrl,
    loading,
    draftStatus,
  ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F1E8]">
        <AyahLoader />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-8">

        {/* TOP BAR */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">

          <Link
            href="/dashboard"
            className={`${inter.className} text-sm text-[#81766D] transition hover:text-[#053400]`}
          >
            ← Dashboard
          </Link>

          <div className="flex items-center gap-3">

            <span
              className={`${inter.className} rounded-full px-3 py-1 text-xs capitalize ${
                draftStatus === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-[#E4EDE6] text-[#2E5138]"
              }`}
            >
              {draftStatus}
            </span>

            <span className={`${inter.className} text-sm text-[#81766D]`}>
              {status}
            </span>

            <button
              onClick={saveDraft}
              disabled={draftStatus === "submitted"}
              className={`${inter.className} rounded-full border border-[#DCD4C9] px-5 py-2 text-sm font-medium text-[#46382F] transition hover:border-[#053400] disabled:opacity-50`}
            >
              Save
            </button>

            <button
              onClick={submitForReview}
              disabled={!draftId || draftStatus === "submitted"}
              className={`${inter.className} rounded-full bg-[#053400] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#0B4D2B] active:scale-95 disabled:opacity-50`}
            >
              Submit
            </button>

          </div>
        </div>

        {/* REJECTION FEEDBACK */}
        {draftStatus === "rejected" && feedback && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p className="mb-1 text-sm font-medium">
              This was sent back with feedback:
            </p>
            <p className="text-sm">{feedback}</p>
          </div>
        )}

        {/* TYPE */}
        <select
          value={type}
          disabled={draftStatus === "submitted"}
          onChange={(e) => setType(e.target.value)}
          className={`${inter.className} mb-6 rounded-lg border border-[#DCD4C9] bg-white px-4 py-2 text-sm text-[#46382F] outline-none focus:border-[#053400]`}
        >
          <option value="article">Article</option>
          <option value="reflection">Reflection</option>
          <option value="poetry">Poetry</option>
          <option value="story">Short Story</option>
        </select>


        {/* TAGS */}
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          disabled={draftStatus === "submitted"}
          placeholder="Tags (e.g. History, Palestine, Seerah)"
          className={`${inter.className} mb-6 w-full rounded-lg border border-[#DCD4C9] bg-white px-4 py-2 text-sm outline-none focus:border-[#053400]`}
        />


        {/* COVER IMAGE */}
        <div className="mb-6">
          <label
            htmlFor="cover-upload"
            className={`relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#DCD4C9] bg-white transition hover:border-[#053400] ${
              draftStatus === "submitted" || uploadingCover
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }`}
          >
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt="Cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className={`${inter.className} text-sm text-[#81766D]`}>
                {uploadingCover
                  ? "Uploading..."
                  : "Add a cover image (optional)"}
              </span>
            )}
          </label>

          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            onChange={uploadCoverImage}
            className="hidden"
            disabled={draftStatus === "submitted" || uploadingCover}
          />

          {coverImageUrl && (
            <button
              type="button"
              onClick={() => setCoverImageUrl(null)}
              disabled={draftStatus === "submitted"}
              className={`${inter.className} mt-2 text-xs text-red-600 transition hover:underline disabled:opacity-50`}
            >
              Remove cover image
            </button>
          )}
        </div>


        {/* TITLE */}
        <input
          value={title}
          disabled={draftStatus === "submitted"}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className={`${poppins.className} mb-8 w-full border-none bg-transparent text-5xl font-medium text-[#053400] outline-none placeholder:text-[#B8AF9F] md:text-6xl`}
        />


        {/* ANONYMOUS OPTION */}
        <div className="mb-8 flex items-center justify-between rounded-xl border border-[#DCD4C9] bg-white px-5 py-4">

          <div>
            <p className={`${inter.className} text-sm font-medium text-[#46382F]`}>
              Publish anonymously
            </p>

            <p className={`${inter.className} mt-1 max-w-xl text-xs leading-5 text-[#81766D]`}>
              Your name will not be shown publicly with this article.
              You will still be able to see the article on your own profile.
            </p>
          </div>

          <button
            type="button"
            disabled={draftStatus === "submitted"}
            onClick={() => setIsAnonymous((current) => !current)}
            aria-label="Toggle anonymous publication"
            aria-pressed={isAnonymous}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              isAnonymous
                ? "bg-[#053400]"
                : "bg-[#DCD4C9]"
            } ${
              draftStatus === "submitted"
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                isAnonymous
                  ? "left-6"
                  : "left-1"
              }`}
            />
          </button>

        </div>


        {/* EDITOR */}
        {draftStatus === "submitted" ? (

          <div className={`${inter.className} rounded-xl border border-yellow-300 bg-yellow-50 p-6 text-yellow-800`}>
            This article has been submitted for review and can no longer be edited.
          </div>

        ) : (

          <RichTextEditor
            value={content}
            onChange={setContent}
          />

        )}

      </div>
    </main>
  );
}
