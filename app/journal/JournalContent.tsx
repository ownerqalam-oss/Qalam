"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { estimateReadingTime } from "../../lib/readingTime";
import { getGenreColor } from "../../lib/genreColors";
import InkFlourish from "../../components/InkFlourish";
import CoverImage from "../../components/CoverImage";
import { ButtonLink } from "../../components/ui/Button";

const headingFont = "font-[family-name:var(--font-heading)]";
const bodyFont = "font-[family-name:var(--font-body)]";

interface Article {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[] | null;
  published_at: string;
  user_id: string;
  is_anonymous: boolean;
  cover_image_url: string | null;
  likes: { count: number }[];
}

interface Writer {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

type Tab = "latest" | "following";
type SortMode = "newest" | "top";

function likeCount(article: Article) {
  return article.likes?.[0]?.count ?? 0;
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.099 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

export default function JournalContent() {
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  const [articles, setArticles] = useState<Article[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followingLoaded, setFollowingLoaded] = useState(false);

  const [tab, setTab] = useState<Tab>("latest");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  useEffect(() => {
    loadArticles();
    loadFollowing();
  }, []);

  async function loadArticles() {
    const { data, error } = await supabase
      .from("drafts")
      .select("*, likes(count)")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (!error && data) {
      setArticles(data);

      const authorIds = Array.from(
        new Set(
          data
            .filter((article) => !article.is_anonymous)
            .map((article) => article.user_id)
        )
      );

      if (authorIds.length > 0) {
        const { data: writerData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", authorIds);

        if (writerData) {
          setWriters(writerData);
        }
      }
    }

    setLoading(false);
  }

  async function loadFollowing() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFollowingLoaded(true);
      return;
    }

    setCurrentUserId(user.id);

    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (data) {
      setFollowingIds(data.map((row) => row.following_id));
    }

    setFollowingLoaded(true);
  }

  function getWriter(userId: string) {
    return writers.find((writer) => writer.id === userId);
  }

  function sortArticles(list: Article[]) {
    return [...list].sort((a, b) => {
      if (sortMode === "top") {
        const diff = likeCount(b) - likeCount(a);
        if (diff !== 0) return diff;
      }

      return (
        new Date(b.published_at).getTime() -
        new Date(a.published_at).getTime()
      );
    });
  }

  function sectionTitle(type: string) {
    switch (type) {
      case "story":
        return "Short Stories";
      case "poetry":
        return "Poetry";
      case "reflection":
        return "Reflections";
      default:
        return "Articles";
    }
  }

  const types = ["article", "story", "poetry", "reflection"];

  const visibleArticles = activeTag
    ? articles.filter((article) =>
        article.tags?.some(
          (tag) => tag.toLowerCase() === activeTag.toLowerCase()
        )
      )
    : articles;

  const followingArticles = sortArticles(
    visibleArticles.filter(
      (article) =>
        !article.is_anonymous && followingIds.includes(article.user_id)
    )
  );

  function renderCard(post: Article, index: number) {
    const writer = post.is_anonymous ? null : getWriter(post.user_id);
    const genreColor = getGenreColor(post.type);

    return (
      <div
        key={post.id}
        style={{ animationDelay: `${index * 70}ms` }}
        className={`animate-fade-in-up group block rounded-xl border border-border border-t-4 ${genreColor.cardBorder} bg-cream-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
      >
        <div className="flex items-start gap-5">

          <Link href={`/journal/${post.id}`} className="shrink-0">
            <CoverImage
              src={post.cover_image_url}
              type={post.type}
              alt={post.title}
              className="h-20 w-20 rounded-lg sm:h-24 sm:w-24"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <Link href={`/journal/${post.id}`}>
              <span
                className={`${bodyFont} inline-block rounded-full ${genreColor.badgeBg} px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] ${genreColor.badgeText}`}
              >
                {post.type === "story" ? "Short Story" : post.type}
              </span>

              <h3
                className={`${headingFont} mt-2 text-2xl font-medium text-ink-900 transition group-hover:text-brand-900`}
              >
                {post.title}
              </h3>
            </Link>

            {/* BYLINE */}
            {writer ? (
              <Link
                href={`/writers/${post.user_id}`}
                className="mt-4 flex w-fit items-center gap-2.5 hover:underline"
              >
                {writer.avatar_url ? (
                  <img
                    src={writer.avatar_url}
                    alt={writer.display_name || "Writer"}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`${headingFont} flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-[11px] font-medium text-white`}
                  >
                    {(writer.display_name || "Q")[0].toUpperCase()}
                  </div>
                )}

                <span className={`${bodyFont} text-[13px] text-ink-600`}>
                  {writer.display_name || "Qalam Writer"}
                  <span className="text-gold-600"> · </span>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })
                    : ""}
                  <span className="text-gold-600"> · </span>
                  {estimateReadingTime(post.content)} min read
                  <span className="text-gold-600"> · </span>
                  <span className="inline-flex items-center gap-1 align-middle">
                    <HeartIcon className="h-3 w-3" />
                    {likeCount(post)}
                  </span>
                </span>
              </Link>
            ) : (
              <div className="mt-4 flex items-center gap-2.5">
                <div
                  className={`${headingFont} flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-[11px] font-medium text-white`}
                >
                  Q
                </div>

                <span className={`${bodyFont} text-[13px] text-ink-600`}>
                  Qalam Writer
                  <span className="text-gold-600"> · </span>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })
                    : ""}
                  <span className="text-gold-600"> · </span>
                  {estimateReadingTime(post.content)} min read
                  <span className="text-gold-600"> · </span>
                  <span className="inline-flex items-center gap-1 align-middle">
                    <HeartIcon className="h-3 w-3" />
                    {likeCount(post)}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 pl-[100px]">
            {post.tags.map((tag) => (
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
  }

  return (
    <main className="min-h-screen bg-cream text-ink-900">
      <section className="mx-auto max-w-[1180px] px-6 py-16 md:px-8">

        {/* HEADER */}
        <div className="mb-10">
          <p
            className={`${bodyFont} text-[11px] font-medium uppercase tracking-[0.3em] text-brand-600`}
          >
            THE QALAM JOURNAL
          </p>

          <h1
            className={`${headingFont} mt-4 text-5xl font-medium text-brand-900`}
          >
            Journal
          </h1>

          <InkFlourish className="mt-3 w-[90px]" />

          <p
            className={`${bodyFont} mt-4 max-w-2xl text-[16px] leading-7 text-ink-600`}
          >
            Discover thoughtful writing from the Qalam community.
          </p>

          {activeTag && (
            <div className="mt-6 flex items-center gap-3">
              <span
                className={`${bodyFont} rounded-full bg-brand-900 px-4 py-1.5 text-xs font-medium text-white`}
              >
                #{activeTag}
              </span>

              <Link
                href="/journal"
                className={`${bodyFont} text-xs font-medium text-ink-400 hover:text-brand-900`}
              >
                Clear filter ×
              </Link>
            </div>
          )}
        </div>

        {/* TABS + SORT */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex rounded-full border border-border p-1">
            <button
              onClick={() => setTab("latest")}
              className={`${bodyFont} rounded-full px-5 py-2 text-xs font-medium transition ${
                tab === "latest"
                  ? "bg-brand-900 text-white"
                  : "text-ink-600 hover:text-brand-900"
              }`}
            >
              Latest
            </button>

            <button
              onClick={() => setTab("following")}
              className={`${bodyFont} rounded-full px-5 py-2 text-xs font-medium transition ${
                tab === "following"
                  ? "bg-brand-900 text-white"
                  : "text-ink-600 hover:text-brand-900"
              }`}
            >
              Following
            </button>
          </div>

          <div className="flex rounded-full border border-border p-1">
            <button
              onClick={() => setSortMode("newest")}
              className={`${bodyFont} rounded-full px-4 py-1.5 text-xs font-medium transition ${
                sortMode === "newest"
                  ? "bg-brand-900 text-white"
                  : "text-ink-600 hover:text-brand-900"
              }`}
            >
              Newest
            </button>

            <button
              onClick={() => setSortMode("top")}
              className={`${bodyFont} rounded-full px-4 py-1.5 text-xs font-medium transition ${
                sortMode === "top"
                  ? "bg-brand-900 text-white"
                  : "text-ink-600 hover:text-brand-900"
              }`}
            >
              Top
            </button>
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-skeleton"
              />
            ))}
          </div>
        )}

        {/* LATEST */}
        {!loading && tab === "latest" &&
          types.map((type) => {
            const posts = sortArticles(
              visibleArticles.filter((a) => a.type === type)
            );

            if (posts.length === 0) return null;

            return (
              <section key={type} className="mb-16">
                <div className="mb-6 flex items-center justify-between border-b border-border pb-5">
                  <h2 className={`${headingFont} text-3xl font-medium`}>
                    {sectionTitle(type)}
                  </h2>
                </div>

                <div className="space-y-4">
                  {posts.map((post, index) => renderCard(post, index))}
                </div>
              </section>
            );
          })}

        {!loading && tab === "latest" && visibleArticles.length === 0 && (
          <div className="border border-border py-16 text-center">
            <p className={`${bodyFont} text-sm text-ink-400`}>
              {activeTag
                ? `No published pieces tagged #${activeTag}.`
                : "No published articles yet."}
            </p>
          </div>
        )}

        {/* FOLLOWING */}
        {!loading && tab === "following" && (
          !followingLoaded || !currentUserId ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <p className={`${bodyFont} text-sm text-ink-600`}>
                Sign in to see writing from the people you follow.
              </p>

              <ButtonLink href="/login" className={`${bodyFont} mt-4`}>
                Log in
              </ButtonLink>
            </div>
          ) : followingIds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <p className={`${bodyFont} text-sm text-ink-600`}>
                You&apos;re not following anyone yet.
              </p>

              <ButtonLink href="/writers" className={`${bodyFont} mt-4`}>
                Find writers to follow
              </ButtonLink>
            </div>
          ) : followingArticles.length === 0 ? (
            <div className="border border-border py-16 text-center">
              <p className={`${bodyFont} text-sm text-ink-400`}>
                No published pieces yet from writers you follow.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {followingArticles.map((post, index) => renderCard(post, index))}
            </div>
          )
        )}

      </section>
    </main>
  );
}
