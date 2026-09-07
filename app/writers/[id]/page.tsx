"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useToast } from "../../../components/ToastProvider";
import { estimateReadingTime } from "../../../lib/readingTime";
import { getGenreColor } from "../../../lib/genreColors";
import InkFlourish from "../../../components/InkFlourish";
import CoverImage from "../../../components/CoverImage";
import { Button, ButtonLink } from "../../../components/ui/Button";

const headingFont = "font-[family-name:var(--font-heading)]";
const bodyFont = "font-[family-name:var(--font-body)]";

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
  type: string;
  tags: string[] | null;
  published_at: string | null;
  is_anonymous: boolean;
  cover_image_url: string | null;
}

export default function WriterPage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvatar, setShowAvatar] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (id) {
      loadWriter();
      loadFollowState();
    }
  }, [id]);

  async function loadFollowState() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", id);

    setFollowerCount(count ?? 0);

    if (!user) return;

    setCurrentUserId(user.id);

    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", id)
      .maybeSingle();

    setIsFollowing(!!followRow);
  }

  async function toggleFollow() {
    if (!currentUserId) {
      showToast("Sign in to follow this writer.", "error");
      return;
    }

    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount((count) => count - 1);

      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", id);

      if (error) {
        setIsFollowing(true);
        setFollowerCount((count) => count + 1);
        showToast(error.message, "error");
      }
    } else {
      setIsFollowing(true);
      setFollowerCount((count) => count + 1);

      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, following_id: id });

      if (error) {
        setIsFollowing(false);
        setFollowerCount((count) => count - 1);
        showToast(error.message, "error");
      }
    }
  }

  async function loadWriter() {
    setLoading(true);

    /*
     * Get the currently logged-in user.
     *
     * This lets us determine whether the person viewing
     * this page is the actual owner of the profile.
     */
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    /*
     * Load writer profile
     */
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, bio, avatar_url")
      .eq("id", id)
      .single();

    if (profileError || !profileData) {
      console.error("Error loading writer:", profileError);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    /*
     * Check whether this is the user's own profile.
     */
    const isOwnProfile = currentUser?.id === id;

    /*
     * Load published articles.
     *
     * OWN PROFILE:
     * Show all their published pieces, including anonymous ones.
     *
     * SOMEONE ELSE'S PROFILE:
     * Only show non-anonymous published pieces.
     */
    let articleQuery = supabase
      .from("drafts")
      .select(
        "id, title, content, type, tags, published_at, is_anonymous, cover_image_url"
      )
      .eq("user_id", id)
      .eq("status", "published");

    if (!isOwnProfile) {
      articleQuery = articleQuery.eq("is_anonymous", false);
    }

    const { data: articleData, error: articleError } =
      await articleQuery.order("published_at", {
        ascending: false,
      });

    if (articleError) {
      console.error("ARTICLE ERROR MESSAGE:", articleError.message);
      console.error("ARTICLE ERROR CODE:", articleError.code);
      console.error("ARTICLE ERROR DETAILS:", articleError.details);
      console.error("ARTICLE ERROR HINT:", articleError.hint);
    }

    if (articleData) {
      setArticles(articleData);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream px-8 py-20 text-ink-900">
        Loading...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-cream px-8 py-20 text-ink-900">
        <div className="mx-auto max-w-4xl">
          <h1 className={`${headingFont} text-4xl`}>
            Writer not found
          </h1>

          <ButtonLink href="/writers" variant="secondary" className={`${bodyFont} mt-6`}>
            ← Back to Writers
          </ButtonLink>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream text-ink-900">
      <div className="mx-auto max-w-[1180px] px-8 py-16">

        {/* BACK */}
        <ButtonLink href="/writers" variant="secondary" className={bodyFont}>
          ← Back to Writers
        </ButtonLink>

        {/* PROFILE */}
        <section className="mt-8 rounded-2xl border border-border bg-cream-card p-8">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">

            {/* PROFILE PICTURE */}
            {profile.avatar_url ? (
              <button
                type="button"
                onClick={() => setShowAvatar(true)}
                className="cursor-zoom-in shrink-0 rounded-full focus:outline-none"
                aria-label="View profile picture"
              >
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || "Writer"}
                  className="h-24 w-24 rounded-full object-cover shadow-sm transition hover:opacity-90"
                />
              </button>
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-brand-900 text-white shadow-sm">
                <span className={`${headingFont} text-3xl`}>
                  {profile.display_name?.charAt(0).toUpperCase() || "Q"}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p
                className={`${bodyFont} text-[11px] font-medium uppercase tracking-[0.3em] text-brand-600`}
              >
                Qalam Writer
              </p>

              <h1
                className={`${headingFont} mt-2 text-4xl font-medium text-brand-900 md:text-5xl`}
              >
                {profile.display_name || "Qalam Writer"}
              </h1>

              <InkFlourish className="mx-auto mt-3 w-[70px] sm:mx-0" />

              <p className={`${bodyFont} mt-4 text-sm text-ink-400`}>
                {followerCount} {followerCount === 1 ? "follower" : "followers"}
                <span className="text-gold-600"> · </span>
                Written {articles.length}{" "}
                {articles.length === 1 ? "piece" : "pieces"}
              </p>
            </div>

            {currentUserId !== id && (
              <Button
                onClick={toggleFollow}
                aria-pressed={isFollowing}
                variant={isFollowing ? "secondary" : "primary"}
                className={`${bodyFont} shrink-0`}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>

          {profile.bio && (
            <p
              className={`${bodyFont} mt-7 max-w-2xl text-[15px] leading-7 text-ink-600`}
            >
              {profile.bio}
            </p>
          )}
        </section>

        {/* WRITING */}
        <section className="mt-14">

          <div className="mb-6 flex items-end justify-between border-b border-border pb-5">
            <div>
              <h2
                className={`${headingFont} text-3xl font-medium text-brand-900`}
              >
                Journal
              </h2>

              <InkFlourish className="mt-2 w-[70px]" />
            </div>

            <span
              className={`${bodyFont} text-sm text-ink-400`}
            >
              {articles.length}{" "}
              {articles.length === 1 ? "piece" : "pieces"}
            </span>
          </div>

          {articles.length === 0 ? (
            <p
              className={`${bodyFont} py-10 text-sm text-ink-400`}
            >
              No Journal pieces published yet.
            </p>
          ) : (
            <div className="space-y-4">
              {articles.map((article, index) => {
                const genreColor = getGenreColor(article.type);

                return (
                  <div
                    key={article.id}
                    style={{ animationDelay: `${index * 70}ms` }}
                    className={`animate-fade-in-up group rounded-xl border border-border border-t-4 ${genreColor.cardBorder} bg-cream-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
                  >
                    <div className="flex items-start gap-5">

                      <Link href={`/journal/${article.id}`} className="shrink-0">
                        <CoverImage
                          src={article.cover_image_url}
                          type={article.type}
                          alt={article.title}
                          className="h-20 w-20 rounded-lg sm:h-24 sm:w-24"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`${bodyFont} inline-block rounded-full ${genreColor.badgeBg} px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] ${genreColor.badgeText}`}
                        >
                          {article.type === "story"
                            ? "Short Story"
                            : article.type}
                        </span>

                        <Link href={`/journal/${article.id}`}>
                          <h3
                            className={`${headingFont} mt-2 text-2xl font-medium text-ink-900 transition group-hover:text-brand-900`}
                          >
                            {article.title}
                          </h3>
                        </Link>

                        <div className="mt-4 flex items-center gap-2.5">
                          {!article.is_anonymous && profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={profile.display_name || "Writer"}
                              className="h-7 w-7 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`${headingFont} flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-[11px] font-medium text-white`}
                            >
                              {article.is_anonymous
                                ? "Q"
                                : (profile.display_name || "Q")[0].toUpperCase()}
                            </div>
                          )}

                          <span
                            className={`${bodyFont} text-[13px] text-ink-600`}
                          >
                            {article.is_anonymous
                              ? "Anonymous"
                              : profile.display_name || "Qalam Writer"}
                            <span className="text-gold-600"> · </span>
                            {article.published_at
                              ? new Date(
                                  article.published_at
                                ).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : ""}
                            <span className="text-gold-600"> · </span>
                            {estimateReadingTime(article.content)} min read
                          </span>
                        </div>

                        {article.is_anonymous && (
                          <p
                            className={`${bodyFont} mt-2 text-xs text-ink-400`}
                          >
                            Published anonymously · visible only to you here
                          </p>
                        )}
                      </div>
                    </div>

                    {article.tags && article.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 pl-[100px]">
                        {article.tags.map((tag) => (
                          <Link
                            key={tag}
                            href={`/journal?tag=${encodeURIComponent(tag)}`}
                            onClick={(event) => event.stopPropagation()}
                            className={`${bodyFont} rounded-full bg-border px-3 py-1 text-xs text-ink-900 transition hover:bg-brand-900 hover:text-white`}
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </section>
      </div>

      {/* PROFILE PICTURE LIGHTBOX */}
      {showAvatar && profile.avatar_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6"
          onClick={() => setShowAvatar(false)}
        >
          {/* CLOSE BUTTON */}
          <button
            type="button"
            onClick={() => setShowAvatar(false)}
            className="absolute right-6 top-6 text-4xl font-light text-white transition hover:opacity-70"
            aria-label="Close profile picture"
          >
            ×
          </button>

          {/* LARGE IMAGE */}
          <img
            src={profile.avatar_url}
            alt={profile.display_name || "Writer"}
            className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
