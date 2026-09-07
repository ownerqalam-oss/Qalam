"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { estimateReadingTime } from "../../lib/readingTime";
import { getGenreColor } from "../../lib/genreColors";
import InkFlourish from "../../components/InkFlourish";
import CoverImage from "../../components/CoverImage";
import AyahLoader from "../../components/AyahLoader";
import { Card, CardLink } from "../../components/ui/Card";

const headingFont = "font-[family-name:var(--font-heading)]";
const bodyFont = "font-[family-name:var(--font-body)]";

interface Article {
  id: string;
  title: string;
  content: string;
  type: string;
  user_id: string;
  cover_image_url: string | null;
  is_anonymous: boolean;
  published_at: string | null;
  likes: { count: number }[];
}

type SortMode = "newest" | "top";

function likeCount(article: Article) {
  return article.likes?.[0]?.count ?? 0;
}

interface Writer {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

type SearchType = "all" | "journal" | "writers";

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-cream">
          <AyahLoader />
        </main>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();

  const [articles, setArticles] = useState<Article[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadExplore();
  }, []);

  async function loadExplore() {
    setLoading(true);
    setError("");

    // Load published writing
    const {
      data: articleData,
      error: articleError,
    } = await supabase
      .from("drafts")
      .select(
        "id, title, content, type, user_id, cover_image_url, is_anonymous, published_at, likes(count)"
      )
      .eq("status", "published");

    if (articleError) {
      console.error("ARTICLE ERROR:", articleError);
      console.error("MESSAGE:", articleError.message);
      console.error("CODE:", articleError.code);
      console.error("DETAILS:", articleError.details);

      setError(articleError.message);
      setLoading(false);
      return;
    }

    // Load writers
    const {
      data: writerData,
      error: writerError,
    } = await supabase
      .from("profiles")
      .select("id, display_name, bio, avatar_url")
      .order("display_name", { ascending: true });

    if (writerError) {
      console.error("WRITER ERROR:", writerError);
      console.error("MESSAGE:", writerError.message);

      setError(writerError.message);
      setLoading(false);
      return;
    }

    if (articleData) {
      setArticles(articleData);
    }

    if (writerData) {
      setWriters(writerData);
    }

    setLoading(false);
  }

  function getWriterName(userId: string) {
    const writer = writers.find((writer) => writer.id === userId);

    return writer?.display_name || "Qalam Writer";
  }

  function getWriter(userId: string) {
    return writers.find((writer) => writer.id === userId);
  }

  const searchTerm = search.trim().toLowerCase();

  const filteredArticles = articles.filter((article) => {
    if (!searchTerm) return true;

    const titleMatch = article.title
      ?.toLowerCase()
      .includes(searchTerm);

    const typeMatch = article.type
      ?.toLowerCase()
      .includes(searchTerm);

    const writerMatch = getWriterName(article.user_id)
      .toLowerCase()
      .includes(searchTerm);

    return titleMatch || typeMatch || writerMatch;
  });

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortMode === "top") {
      const diff = likeCount(b) - likeCount(a);
      if (diff !== 0) return diff;
    }

    const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
    const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
    return bTime - aTime;
  });

  const filteredWriters = writers.filter((writer) => {
    if (!searchTerm) return true;

    const nameMatch = writer.display_name
      ?.toLowerCase()
      .includes(searchTerm);

    const bioMatch = writer.bio
      ?.toLowerCase()
      .includes(searchTerm);

    return nameMatch || bioMatch;
  });

  return (
    <main className="min-h-screen bg-cream text-ink-900">
      <section className="mx-auto max-w-[1180px] px-8 py-16">

        {/* HEADER */}
        <div className="mb-10">
          <p
            className={`${bodyFont} text-[11px] font-medium uppercase tracking-[0.3em] text-brand-600`}
          >
            DISCOVER QALAM
          </p>

          <h1
            className={`${headingFont} mt-4 text-5xl font-medium text-brand-900`}
          >
            Explore
          </h1>

          <InkFlourish className="mt-3 w-[90px]" />

          <p
            className={`${bodyFont} mt-4 max-w-2xl text-[16px] leading-7 text-ink-600`}
          >
            Discover the Journal, ideas and the people behind the words.
          </p>
        </div>

        {/* SEARCH */}
        <div className="border-y border-border py-6">
          <div className="flex flex-col gap-4 md:flex-row">

            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Journal or writers..."
                className={`${bodyFont} w-full rounded-full border border-border bg-transparent px-5 py-3 text-sm outline-none transition focus:border-brand-900`}
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className={`${bodyFont} absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-400 hover:text-brand-900`}
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex rounded-full border border-border p-1">

              <button
                onClick={() => setSearchType("all")}
                className={`${bodyFont} rounded-full px-5 py-2 text-xs font-medium transition ${
                  searchType === "all"
                    ? "bg-brand-900 text-white"
                    : "text-ink-600 hover:text-brand-900"
                }`}
              >
                All
              </button>

              <button
                onClick={() => setSearchType("journal")}
                className={`${bodyFont} rounded-full px-5 py-2 text-xs font-medium transition ${
                  searchType === "journal"
                    ? "bg-brand-900 text-white"
                    : "text-ink-600 hover:text-brand-900"
                }`}
              >
                Journal
              </button>

              <button
                onClick={() => setSearchType("writers")}
                className={`${bodyFont} rounded-full px-5 py-2 text-xs font-medium transition ${
                  searchType === "writers"
                    ? "bg-brand-900 text-white"
                    : "text-ink-600 hover:text-brand-900"
                }`}
              >
                Writers
              </button>

            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="space-y-4 py-10">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg bg-skeleton"
              />
            ))}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="border-b border-border py-10">
            <p
              className={`${bodyFont} text-sm text-red-600`}
            >
              Something went wrong:
            </p>

            <p
              className={`${bodyFont} mt-2 text-sm text-ink-600`}
            >
              {error}
            </p>
          </div>
        )}

        {/* CONTENT */}
        {!loading && !error && (
          <div className="mt-10">

            {/* JOURNAL */}
            {(searchType === "all" || searchType === "journal") && (
              <section className="mb-16">

                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
                  <h2
                    className={`${headingFont} text-3xl font-medium`}
                  >
                    Journal
                  </h2>

                  <div className="flex items-center gap-4">
                    <span
                      className={`${bodyFont} text-sm text-ink-400`}
                    >
                      {filteredArticles.length}{" "}
                      {filteredArticles.length === 1
                        ? "piece"
                        : "pieces"}
                    </span>

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
                </div>

                {filteredArticles.length === 0 ? (
                  <p
                    className={`${bodyFont} py-8 text-sm text-ink-400`}
                  >
                    {search
                      ? `No Journal pieces found for "${search}".`
                      : "No Journal pieces published yet."}
                  </p>
                ) : (
                  <div className="space-y-3">

                    {sortedArticles.map((article, index) => {
                      const writer = article.is_anonymous
                        ? null
                        : getWriter(article.user_id);
                      const genreColor = getGenreColor(article.type);

                      return (
                        <Card
                          key={article.id}
                          style={{ animationDelay: `${index * 70}ms` }}
                          className={`animate-fade-in-up group flex items-start gap-5 border-t-4 ${genreColor.cardBorder} p-6 md:gap-8`}
                        >

                          <CoverImage
                            src={article.cover_image_url}
                            type={article.type}
                            alt={article.title}
                            className="h-20 w-20 shrink-0 rounded-lg sm:h-24 sm:w-24"
                          />

                          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                            {/* ARTICLE */}
                            <Link
                              href={`/journal/${article.id}`}
                              className="min-w-0 flex-1"
                            >
                              <span
                                className={`${bodyFont} inline-block rounded-full ${genreColor.badgeBg} px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] ${genreColor.badgeText}`}
                              >
                                {article.type === "story"
                                  ? "Short Story"
                                  : article.type}
                              </span>

                              <h3
                                className={`${headingFont} mt-2 text-2xl font-medium text-ink-900 transition group-hover:text-brand-900`}
                              >
                                {article.title}
                              </h3>

                              <span
                                className={`${bodyFont} mt-1 flex items-center gap-1.5 text-xs text-ink-600`}
                              >
                                {estimateReadingTime(article.content)} min read

                                <span className="text-gold-600">·</span>

                                <span className="inline-flex items-center gap-1">
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-3 w-3"
                                    fill="currentColor"
                                  >
                                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.099 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                  </svg>
                                  {likeCount(article)}
                                </span>
                              </span>
                            </Link>

                            <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-end">

                              {/* WRITER */}
                              <div className="flex items-center gap-3">

                                {writer ? (
                                  <>
                                    <Link
                                      href={`/writers/${writer.id}`}
                                      className="shrink-0"
                                    >
                                      {writer.avatar_url ? (
                                        <img
                                          src={writer.avatar_url}
                                          alt={writer.display_name || "Writer"}
                                          className="h-10 w-10 rounded-full object-cover transition hover:opacity-80"
                                        />
                                      ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-xs font-medium text-white">
                                          {(writer.display_name || "W")[0].toUpperCase()}
                                        </div>
                                      )}
                                    </Link>

                                    <span
                                      className={`${bodyFont} text-sm text-ink-400`}
                                    >
                                      By{" "}
                                      <Link
                                        href={`/writers/${writer.id}`}
                                        className="text-brand-600 hover:text-brand-900"
                                      >
                                        {writer.display_name || "Qalam Writer"}
                                      </Link>
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-medium text-white">
                                      Q
                                    </div>

                                    <span
                                      className={`${bodyFont} text-sm text-ink-400`}
                                    >
                                      By Anonymous
                                    </span>
                                  </>
                                )}

                              </div>

                              {/* ARROW */}
                              <Link
                                href={`/journal/${article.id}`}
                                className={`${bodyFont} shrink-0 text-lg text-ink-400 transition hover:text-brand-900`}
                              >
                                →
                              </Link>

                            </div>

                          </div>

                        </Card>
                      );
                    })}

                  </div>
                )}

              </section>
            )}

            {/* WRITERS */}
            {(searchType === "all" || searchType === "writers") && (
              <section>

                <div className="mb-6 flex items-center justify-between border-b border-border pb-5">

                  <h2
                    className={`${headingFont} text-3xl font-medium`}
                  >
                    Writers
                  </h2>

                  <Link
                    href="/writers"
                    className={`${bodyFont} text-xs font-medium text-ink-400 transition hover:text-brand-900`}
                  >
                    VIEW ALL →
                  </Link>

                </div>

                {filteredWriters.length === 0 ? (
                  <p
                    className={`${bodyFont} py-8 text-sm text-ink-400`}
                  >
                    {search
                      ? `No writers found for "${search}".`
                      : "No writers yet."}
                  </p>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                    {filteredWriters.map((writer) => (
                      <CardLink
                        key={writer.id}
                        href={`/writers/${writer.id}`}
                        className="p-6 hover:border-brand-900/30"
                      >

                        <div className="flex items-center gap-4">

                          {writer.avatar_url ? (
                            <img
                              src={writer.avatar_url}
                              alt={
                                writer.display_name || "Writer"
                              }
                              className="h-14 w-14 rounded-full object-cover transition group-hover:opacity-90"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-900 text-lg font-medium text-white">
                              {(writer.display_name || "W")[0].toUpperCase()}
                            </div>
                          )}

                          <h3
                            className={`${headingFont} text-lg font-medium transition group-hover:text-brand-900`}
                          >
                            {writer.display_name || "Qalam Writer"}
                          </h3>

                        </div>

                        {writer.bio && (
                          <p
                            className={`${bodyFont} mt-5 line-clamp-3 text-sm leading-6 text-ink-600`}
                          >
                            {writer.bio}
                          </p>
                        )}

                      </CardLink>
                    ))}

                  </div>
                )}

              </section>
            )}

          </div>
        )}

      </section>
    </main>
  );
}
