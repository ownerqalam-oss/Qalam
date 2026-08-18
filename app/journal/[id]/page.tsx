"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../../../lib/supabase/client";
import { useToast } from "../../../components/ToastProvider";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { isAdminEmail } from "../../../lib/admin";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface Article {
  id: string;
  title: string;
  content: string;
  tagline: string | null;
  type: string;
  tags: string[] | null;
  published_at: string | null;
  user_id: string;
  is_anonymous: boolean;
  cover_image_url: string | null;
}

interface CommentRow {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
}

interface CommentAuthor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function ArticlePage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(
    null
  );
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentAuthors, setCommentAuthors] = useState<CommentAuthor[]>([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (id) {
      loadArticle();
      loadEngagement();
      loadComments();
    }
  }, [id]);

  async function loadEngagement() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("draft_id", id);

    setLikeCount(count ?? 0);

    if (!user) return;

    setCurrentUserId(user.id);
    setCurrentUserEmail(user.email ?? null);

    const { data: likeRow } = await supabase
      .from("likes")
      .select("id")
      .eq("draft_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    setLiked(!!likeRow);

    const { data: bookmarkRow } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("draft_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    setBookmarked(!!bookmarkRow);
  }

  async function loadComments() {
    const { data: commentData, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id")
      .eq("draft_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading comments:", error);
      return;
    }

    if (!commentData) return;

    setComments(commentData);

    const authorIds = Array.from(
      new Set(commentData.map((comment) => comment.user_id))
    );

    if (authorIds.length === 0) return;

    const { data: authorData } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds);

    if (authorData) {
      setCommentAuthors(authorData);
    }
  }

  function getCommentAuthor(userId: string) {
    return commentAuthors.find((author) => author.id === userId);
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();

    if (!currentUserId) {
      showToast("Sign in to comment.", "error");
      return;
    }

    if (!commentText.trim()) return;

    setPostingComment(true);

    const { error } = await supabase.from("comments").insert({
      draft_id: id,
      user_id: currentUserId,
      content: commentText.trim(),
    });

    if (error) {
      showToast(error.message, "error");
      setPostingComment(false);
      return;
    }

    setCommentText("");
    setPostingComment(false);
    loadComments();
  }

  async function deleteComment(commentId: number) {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setComments((current) =>
      current.filter((comment) => comment.id !== commentId)
    );
  }

  async function toggleLike() {
    if (!currentUserId) {
      showToast("Sign in to like this piece.", "error");
      return;
    }

    if (liked) {
      setLiked(false);
      setLikeCount((count) => count - 1);

      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("draft_id", id)
        .eq("user_id", currentUserId);

      if (error) {
        setLiked(true);
        setLikeCount((count) => count + 1);
        showToast(error.message, "error");
      }
    } else {
      setLiked(true);
      setLikeCount((count) => count + 1);

      const { error } = await supabase
        .from("likes")
        .insert({ draft_id: id, user_id: currentUserId });

      if (error) {
        setLiked(false);
        setLikeCount((count) => count - 1);
        showToast(error.message, "error");
      }
    }
  }

  async function toggleBookmark() {
    if (!currentUserId) {
      showToast("Sign in to save this piece.", "error");
      return;
    }

    if (bookmarked) {
      setBookmarked(false);

      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("draft_id", id)
        .eq("user_id", currentUserId);

      if (error) {
        setBookmarked(true);
        showToast(error.message, "error");
      }
    } else {
      setBookmarked(true);

      const { error } = await supabase
        .from("bookmarks")
        .insert({ draft_id: id, user_id: currentUserId });

      if (error) {
        setBookmarked(false);
        showToast(error.message, "error");
      } else {
        showToast("Saved to your dashboard.", "success");
      }
    }
  }

  async function shareArticle() {
    if (!article) return;

    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, url });
      } catch {
        // User cancelled the share sheet - not an error.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard.", "success");
    } catch {
      showToast("Could not copy link.", "error");
    }
  }

  function whatsappShareUrl() {
    if (!article) return "#";

    const text = `${article.title} — ${window.location.href}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  async function loadArticle() {
    /*
     * Load the published article.
     */
    const { data: articleData, error: articleError } = await supabase
      .from("drafts")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (articleError || !articleData) {
      console.error("Error loading article:", articleError);
      setLoading(false);
      return;
    }

    setArticle(articleData);

    /*
     * If the article is anonymous, we still load the
     * author's profile privately for the page logic,
     * but we NEVER display it publicly.
     */
    if (!articleData.is_anonymous) {
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, display_name, bio, avatar_url")
          .eq("id", articleData.user_id)
          .single();

      if (profileError) {
        console.error(
          "Error loading writer profile:",
          profileError
        );
      }

      if (profileData) {
        setProfile(profileData);
      }
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F1E8] px-6 py-20 text-[#46382F]">
        <div className="mx-auto max-w-3xl">
          <p className={`${inter.className} text-sm text-[#81766D]`}>
            Loading...
          </p>
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-[#F7F1E8] px-6 py-20 text-[#46382F]">
        <div className="mx-auto max-w-3xl">
          <h1
            className={`${poppins.className} mb-4 text-4xl font-medium`}
          >
            Article not found
          </h1>

          <Link
            href="/journal"
            className={`${inter.className} text-[#053400] hover:underline`}
          >
            ← Back to Journal
          </Link>
        </div>
      </main>
    );
  }

  const isAnonymous = article.is_anonymous;

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <article className="mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-20">

        {/* BACK TO JOURNAL */}
        <Link
          href="/journal"
          className={`${inter.className} mb-12 inline-block text-sm text-[#81766D] transition hover:text-[#053400]`}
        >
          ← Back to Journal
        </Link>

        {/* COVER IMAGE */}
        {article.cover_image_url && (
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="mb-10 h-[220px] w-full rounded-2xl object-cover md:h-[360px]"
          />
        )}

        {/* CATEGORY */}
        <div className="mb-5 flex flex-wrap gap-2">
          <span
            className={`${inter.className} rounded-full bg-[#E9E2D8] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#42614A]`}
          >
            {article.type === "story"
              ? "Short Story"
              : article.type}
          </span>

          {article.tags?.map((tag) => (
            <span
              key={tag}
              className={`${inter.className} rounded-full bg-[#E9E2D8] px-3 py-1 text-xs text-[#70655C]`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* TITLE */}
        <h1
          className={`${poppins.className} max-w-4xl text-[44px] font-medium leading-[1.12] tracking-[-1.5px] text-[#46382F] md:text-[58px]`}
        >
          {article.title}
        </h1>

        {/* TAGLINE */}
        {article.tagline && (
          <p
            className={`${inter.className} mt-6 max-w-3xl text-lg leading-8 text-[#70655C] md:text-xl`}
          >
            {article.tagline}
          </p>
        )}

        {/* WRITER */}
        <div className="mt-8 flex items-center gap-4 border-b border-[#DCD4C9] pb-10">

          {isAnonymous ? (
            <>
              {/* ANONYMOUS AVATAR */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#053400] text-white">
                <span className={`${poppins.className} text-lg`}>
                  Q
                </span>
              </div>

              {/* ANONYMOUS NAME */}
              <div>
                <p
                  className={`${poppins.className} text-[15px] font-medium text-[#46382F]`}
                >
                  Anonymous
                </p>

                {article.published_at && (
                  <p
                    className={`${inter.className} mt-1 text-xs uppercase tracking-[0.12em] text-[#81766D]`}
                  >
                    {new Date(
                      article.published_at
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* NORMAL AVATAR */}
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || "Writer"}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#053400] text-white">
                  <span className={`${poppins.className} text-lg`}>
                    {profile?.display_name
                      ?.charAt(0)
                      .toUpperCase() || "Q"}
                  </span>
                </div>
              )}

              {/* NORMAL NAME + DATE */}
              <div>
                <p
                  className={`${poppins.className} text-[15px] font-medium text-[#46382F]`}
                >
                  {profile?.display_name || "Qalam Writer"}
                </p>

                {article.published_at && (
                  <p
                    className={`${inter.className} mt-1 text-xs uppercase tracking-[0.12em] text-[#81766D]`}
                  >
                    {new Date(
                      article.published_at
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ENGAGEMENT */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={toggleLike}
            aria-pressed={liked}
            className={`${inter.className} flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95 ${
              liked
                ? "border-[#053400] bg-[#E4EDE6] text-[#2E5138]"
                : "border-[#DCD4C9] text-[#46382F] hover:border-[#053400]"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21s-7-4.35-9.5-8.5C1 9 2 5 6 5c2 0 3.5 1.5 4 2.5.5-1 2-2.5 4-2.5 4 0 5 4 3.5 7.5C19 16.65 12 21 12 21z"
              />
            </svg>
            {likeCount}
          </button>

          <button
            onClick={toggleBookmark}
            aria-pressed={bookmarked}
            className={`${inter.className} flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95 ${
              bookmarked
                ? "border-[#053400] bg-[#E4EDE6] text-[#2E5138]"
                : "border-[#DCD4C9] text-[#46382F] hover:border-[#053400]"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill={bookmarked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
              />
            </svg>
            {bookmarked ? "Saved" : "Save"}
          </button>

          <button
            onClick={shareArticle}
            className={`${inter.className} flex items-center gap-2 rounded-full border border-[#DCD4C9] px-4 py-2 text-sm font-medium text-[#46382F] transition hover:border-[#053400] active:scale-95`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.68 13.34a3 3 0 1 0 0-2.68m0 2.68 6.64 3.98m-6.64-6.66 6.64-3.98m0 0a3 3 0 1 0 5.32-2.82 3 3 0 0 0-5.32 2.82Zm0 10.64a3 3 0 1 0 5.32 2.82 3 3 0 0 0-5.32-2.82Z"
              />
            </svg>
            Share
          </button>

          <a
            href={whatsappShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on WhatsApp"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCD4C9] text-[#46382F] transition hover:border-[#053400] active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.4 1.26 4.83L2 22l5.35-1.28a9.9 9.9 0 0 0 4.69 1.18h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Zm5.79 14.11c-.24.68-1.4 1.31-1.93 1.36-.5.05-1.02.24-3.42-.71-2.9-1.15-4.74-4.05-4.88-4.24-.14-.19-1.16-1.55-1.16-2.95 0-1.4.73-2.09 1-2.38.24-.27.53-.34.71-.34h.5c.16 0 .38-.03.58.44l.79 1.9c.07.16.11.35.02.55-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.25.09 1.58.75 1.85.89.27.14.45.2.51.32.07.12.07.68-.17 1.36Z" />
            </svg>
          </a>
        </div>

        {/* ARTICLE CONTENT */}
        <div
          className={`${inter.className} prose prose-lg mt-12 max-w-none text-[#46382F]`}
          dangerouslySetInnerHTML={{
            __html: article.content,
          }}
        />

        {/* WRITER BIO */}
        {!isAnonymous && profile?.bio && (
          <div className="mt-16 border-t border-[#DCD4C9] pt-10">
            <div className="flex items-start gap-5">

              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || "Writer"}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#053400] text-white">
                  <span className={`${poppins.className} text-xl`}>
                    {profile.display_name
                      ?.charAt(0)
                      .toUpperCase() || "Q"}
                  </span>
                </div>
              )}

              <div>
                <p
                  className={`${inter.className} mb-1 text-xs font-medium uppercase tracking-[0.18em] text-[#42614A]`}
                >
                  Written by
                </p>

                <h2
                  className={`${poppins.className} text-xl font-medium text-[#46382F]`}
                >
                  {profile.display_name || "Qalam Writer"}
                </h2>

                <p
                  className={`${inter.className} mt-2 max-w-2xl text-sm leading-6 text-[#70655C]`}
                >
                  {profile.bio}
                </p>
              </div>

            </div>
          </div>
        )}

        {/* COMMENTS */}
        <div className="mt-16 border-t border-[#DCD4C9] pt-10">
          <h2
            className={`${poppins.className} text-2xl font-medium text-[#053400]`}
          >
            {comments.length === 0
              ? "Comments"
              : `${comments.length} ${
                  comments.length === 1 ? "Comment" : "Comments"
                }`}
          </h2>

          {/* FORM */}
          <form onSubmit={postComment} className="mt-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                currentUserId
                  ? "Share your thoughts..."
                  : "Sign in to join the conversation."
              }
              disabled={!currentUserId || postingComment}
              rows={3}
              className={`${inter.className} w-full resize-none rounded-lg border border-[#DCD4C9] bg-white px-4 py-3 text-sm text-[#46382F] outline-none focus:border-[#053400] disabled:opacity-60`}
            />

            <button
              type="submit"
              disabled={!currentUserId || postingComment || !commentText.trim()}
              className={`${inter.className} mt-3 rounded-full bg-[#053400] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#0B4D2B] active:scale-95 disabled:opacity-50`}
            >
              {postingComment ? "Posting..." : "Post Comment"}
            </button>
          </form>

          {/* LIST */}
          <div className="mt-10 space-y-6">
            {comments.map((comment) => {
              const author = getCommentAuthor(comment.user_id);
              const canDelete =
                comment.user_id === currentUserId ||
                isAdminEmail(currentUserEmail);

              return (
                <div key={comment.id} className="flex items-start gap-4">
                  {author?.avatar_url ? (
                    <img
                      src={author.avatar_url}
                      alt={author.display_name || "Writer"}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`${poppins.className} flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#053400] text-xs font-medium text-white`}
                    >
                      {(author?.display_name || "Q")[0].toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`${poppins.className} text-sm font-medium text-[#46382F]`}
                      >
                        {author?.display_name || "Qalam Writer"}
                      </p>

                      <span
                        className={`${inter.className} text-xs text-[#9A9188]`}
                      >
                        {new Date(comment.created_at).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short" }
                        )}
                      </span>
                    </div>

                    <p
                      className={`${inter.className} mt-1 text-sm leading-6 text-[#46382F]`}
                    >
                      {comment.content}
                    </p>

                    {canDelete && (
                      <button
                        onClick={() => setCommentToDelete(comment.id)}
                        className={`${inter.className} mt-1 text-xs text-red-600 transition hover:underline`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {comments.length === 0 && (
              <p className={`${inter.className} text-sm text-[#81766D]`}>
                No comments yet. Be the first to share your thoughts.
              </p>
            )}
          </div>
        </div>

      </article>

      <ConfirmDialog
        open={commentToDelete !== null}
        title="Delete this comment?"
        message="This can't be undone."
        confirmLabel="Delete"
        onCancel={() => setCommentToDelete(null)}
        onConfirm={() => {
          if (commentToDelete !== null) deleteComment(commentToDelete);
          setCommentToDelete(null);
        }}
      />
    </main>
  );
}