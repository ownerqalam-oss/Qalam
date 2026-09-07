"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import RichTextEditor from "../../components/RichTextEditor";
import { useToast } from "../../components/ToastProvider";
import AyahLoader from "../../components/AyahLoader";
import { Button, ButtonLink } from "../../components/ui/Button";
import PublishModal from "../../components/PublishModal";
import { prompts, getRandomPrompt } from "../../lib/prompts";

const headingFont = "font-[family-name:var(--font-heading)]";
const bodyFont = "font-[family-name:var(--font-body)]";

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

  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [promptIndex, setPromptIndex] = useState(0);
  const [promptDismissed, setPromptDismissed] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setPromptIndex(getRandomPrompt()), 0);
    return () => clearTimeout(id);
  }, []);

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
   * Save draft.
   *
   * Returns the draft id (existing or newly created) so callers
   * that need to chain a follow-up action (like submitting for
   * review) don't have to rely on the `draftId` state, which
   * wouldn't have flushed yet in the same tick.
   */
  async function saveDraft(): Promise<string | null> {
    if (draftStatus === "submitted") return draftId;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

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
        return null;
      }

      setStatus("Saved");
      return draftId;
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
      return null;
    }

    setDraftId(data.id);

    window.history.replaceState(
      {},
      "",
      `/editor?id=${data.id}`
    );

    setStatus("Saved");
    return data.id;
  }

  /*
   * Submit for review
   */
  async function submitForReview(id: string) {
    const { error } = await supabase
      .from("drafts")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setDraftStatus("submitted");
    setPublishModalOpen(false);
    showToast("Submitted for review! You'll find it under Pending Review on your dashboard.", "success");
    router.push("/dashboard");
  }

  /*
   * Publish button - open the details modal, saving first if this
   * is a brand new draft with nothing persisted yet.
   */
  async function handlePublishClick() {
    if (!title.trim() && !content.trim()) {
      showToast("Write something first.", "error");
      return;
    }

    if (!draftId) {
      await saveDraft();
    }

    setPublishModalOpen(true);
  }

  async function handleConfirmPublish() {
    setPublishing(true);

    const id = await saveDraft();

    if (!id) {
      setPublishing(false);
      return;
    }

    await submitForReview(id);
    setPublishing(false);
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
      <main className="min-h-screen bg-cream">
        <AyahLoader />
      </main>
    );
  }

  const showPrompt =
    !promptDismissed && !title.trim() && !content.trim() && draftStatus !== "submitted";

  return (
    <main className="min-h-screen bg-cream text-ink-900">
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-8">

        {/* TOP BAR */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">

          <ButtonLink href="/dashboard" variant="secondary" className={bodyFont}>
            ← Dashboard
          </ButtonLink>

          <div className="flex items-center gap-3">

            <span
              className={`${bodyFont} rounded-full px-3 py-1 text-xs capitalize ${
                draftStatus === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-brand-100 text-brand-800"
              }`}
            >
              {draftStatus}
            </span>

            <span
              className={`${bodyFont} flex items-center gap-1.5 text-sm ${
                status === "Saved"
                  ? "text-brand-700"
                  : status === "Error"
                  ? "text-danger-600"
                  : "text-ink-400"
              }`}
            >
              {status === "Saved" && (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {status}
            </span>

            <Button
              variant="secondary"
              onClick={saveDraft}
              disabled={draftStatus === "submitted"}
              className={bodyFont}
            >
              Save
            </Button>

            <Button
              onClick={handlePublishClick}
              disabled={draftStatus === "submitted"}
              className={bodyFont}
            >
              Publish
            </Button>

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

        {/* TITLE */}
        <input
          value={title}
          disabled={draftStatus === "submitted"}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className={`${headingFont} mb-4 w-full border-none bg-transparent text-5xl font-medium text-brand-900 outline-none placeholder:text-[#B8AF9F] md:text-6xl`}
        />

        {/* PROMPT */}
        {showPrompt && (
          <div className="mb-8 flex items-start justify-between gap-4 rounded-xl border border-border bg-cream-card px-5 py-4">
            <div>
              <p className={`${bodyFont} text-xs font-medium uppercase tracking-[0.2em] text-brand-600`}>
                Feeling stuck?
              </p>

              <p className={`${bodyFont} mt-2 text-[15px] leading-6 text-ink-900`}>
                {prompts[promptIndex]}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setPromptIndex((current) => getRandomPrompt(current))}
                className={`${bodyFont} text-xs font-medium text-brand-900 transition hover:underline`}
              >
                Another →
              </button>

              <button
                type="button"
                onClick={() => setPromptDismissed(true)}
                aria-label="Dismiss prompt"
                className="text-ink-400 transition hover:text-ink-900"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* EDITOR */}
        {draftStatus === "submitted" ? (

          <div className={`${bodyFont} rounded-xl border border-yellow-300 bg-yellow-50 p-6 text-yellow-800`}>
            This article has been submitted for review and can no longer be edited.
          </div>

        ) : (

          <RichTextEditor
            value={content}
            onChange={setContent}
          />

        )}

      </div>

      <PublishModal
        open={publishModalOpen}
        type={type}
        onTypeChange={setType}
        tags={tags}
        onTagsChange={setTags}
        isAnonymous={isAnonymous}
        onToggleAnonymous={() => setIsAnonymous((current) => !current)}
        coverImageUrl={coverImageUrl}
        onCoverUpload={uploadCoverImage}
        onRemoveCover={() => setCoverImageUrl(null)}
        uploadingCover={uploadingCover}
        publishing={publishing}
        onClose={() => setPublishModalOpen(false)}
        onConfirm={handleConfirmPublish}
      />
    </main>
  );
}
