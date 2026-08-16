"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../../lib/supabase/client";
import { estimateReadingTime } from "../../lib/readingTime";
import { getGenreColor } from "../../lib/genreColors";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

interface Article {
  id: string;
  title: string;
  content: string;
  type: string;
  user_id: string;
}

interface Writer {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

type SearchType = "all" | "writing" | "writers";

export default function ExplorePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);

  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("all");

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
      .select("id, title, content, type, user_id")
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
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <section className="mx-auto max-w-[1180px] px-8 py-16">

        {/* HEADER */}
        <div className="mb-10">
          <p
            className={`${inter.className} text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]`}
          >
            DISCOVER QALAM
          </p>

          <h1
            className={`${poppins.className} mt-4 text-5xl font-medium text-[#053400]`}
          >
            Explore
          </h1>

          <p
            className={`${inter.className} mt-4 max-w-2xl text-[16px] leading-7 text-[#70655C]`}
          >
            Discover writing, ideas and the people behind the words.
          </p>
        </div>

        {/* SEARCH */}
        <div className="border-y border-[#DCD4C9] py-6">
          <div className="flex flex-col gap-4 md:flex-row">

            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search writing or writers..."
                className={`${inter.className} w-full rounded-full border border-[#CFC5B8] bg-transparent px-5 py-3 text-sm outline-none transition focus:border-[#053400]`}
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className={`${inter.className} absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#81766D] hover:text-[#053400]`}
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex rounded-full border border-[#CFC5B8] p-1">

              <button
                onClick={() => setSearchType("all")}
                className={`${inter.className} rounded-full px-5 py-2 text-xs font-medium transition ${
                  searchType === "all"
                    ? "bg-[#053400] text-white"
                    : "text-[#70655C] hover:text-[#053400]"
                }`}
              >
                All
              </button>

              <button
                onClick={() => setSearchType("writing")}
                className={`${inter.className} rounded-full px-5 py-2 text-xs font-medium transition ${
                  searchType === "writing"
                    ? "bg-[#053400] text-white"
                    : "text-[#70655C] hover:text-[#053400]"
                }`}
              >
                Writing
              </button>

              <button
                onClick={() => setSearchType("writers")}
                className={`${inter.className} rounded-full px-5 py-2 text-xs font-medium transition ${
                  searchType === "writers"
                    ? "bg-[#053400] text-white"
                    : "text-[#70655C] hover:text-[#053400]"
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
                className="h-20 animate-pulse rounded-lg bg-[#EFE8DC]"
              />
            ))}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="border-b border-[#DCD4C9] py-10">
            <p
              className={`${inter.className} text-sm text-red-600`}
            >
              Something went wrong:
            </p>

            <p
              className={`${inter.className} mt-2 text-sm text-[#70655C]`}
            >
              {error}
            </p>
          </div>
        )}

        {/* CONTENT */}
        {!loading && !error && (
          <div className="mt-10">

            {/* WRITING */}
            {(searchType === "all" || searchType === "writing") && (
              <section className="mb-16">

                <div className="mb-6 flex items-center justify-between border-b border-[#DCD4C9] pb-5">
                  <h2
                    className={`${poppins.className} text-3xl font-medium`}
                  >
                    Writing
                  </h2>

                  <span
                    className={`${inter.className} text-sm text-[#81766D]`}
                  >
                    {filteredArticles.length}{" "}
                    {filteredArticles.length === 1
                      ? "piece"
                      : "pieces"}
                  </span>
                </div>

                {filteredArticles.length === 0 ? (
                  <p
                    className={`${inter.className} py-8 text-sm text-[#81766D]`}
                  >
                    {search
                      ? `No writing found for "${search}".`
                      : "No published writing yet."}
                  </p>
                ) : (
                  <div className="space-y-3">

                    {filteredArticles.map((article) => {
                      const writer = getWriter(article.user_id);
                      const genreColor = getGenreColor(article.type);

                      return (
                        <div
                          key={article.id}
                          className={`group flex items-start justify-between gap-8 rounded-xl border border-[#DCD4C9] border-t-4 ${genreColor.cardBorder} bg-[#FFFDF8] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
                        >

                          {/* ARTICLE */}
                          <Link
                            href={`/journal/${article.id}`}
                            className="min-w-0 flex-1"
                          >
                            <span
                              className={`${inter.className} inline-block rounded-full ${genreColor.badgeBg} px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] ${genreColor.badgeText}`}
                            >
                              {article.type === "story"
                                ? "Short Story"
                                : article.type}
                            </span>

                            <h3
                              className={`${poppins.className} mt-2 text-2xl font-medium text-[#46382F] transition group-hover:text-[#053400]`}
                            >
                              {article.title}
                            </h3>

                            <span
                              className={`${inter.className} mt-1 block text-xs text-[#9A9188]`}
                            >
                              {estimateReadingTime(article.content)} min read
                            </span>
                          </Link>

                          {/* WRITER */}
                          <div className="flex shrink-0 items-center gap-3 pt-1">

                            <Link
                              href={`/writers/${writer?.id}`}
                              className="shrink-0"
                            >
                              {writer?.avatar_url ? (
                                <img
                                  src={writer.avatar_url}
                                  alt={
                                    writer.display_name || "Writer"
                                  }
                                  className="h-10 w-10 rounded-full object-cover transition hover:opacity-80"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#053400] text-xs font-medium text-white">
                                  {(writer?.display_name || "W")[0].toUpperCase()}
                                </div>
                              )}
                            </Link>

                            <span
                              className={`${inter.className} text-sm text-[#81766D]`}
                            >
                              By{" "}
                              <Link
                                href={`/writers/${writer?.id}`}
                                className="text-[#42614A] hover:text-[#053400]"
                              >
                                {writer?.display_name || "Qalam Writer"}
                              </Link>
                            </span>

                          </div>

                          {/* ARROW */}
                          <Link
                            href={`/journal/${article.id}`}
                            className={`${inter.className} shrink-0 pt-2 text-lg text-[#81766D] transition hover:text-[#053400]`}
                          >
                            →
                          </Link>

                        </div>
                      );
                    })}

                  </div>
                )}

              </section>
            )}

            {/* WRITERS */}
            {(searchType === "all" || searchType === "writers") && (
              <section>

                <div className="mb-6 flex items-center justify-between border-b border-[#DCD4C9] pb-5">

                  <h2
                    className={`${poppins.className} text-3xl font-medium`}
                  >
                    Writers
                  </h2>

                  <Link
                    href="/writers"
                    className={`${inter.className} text-xs font-medium text-[#81766D] transition hover:text-[#053400]`}
                  >
                    VIEW ALL →
                  </Link>

                </div>

                {filteredWriters.length === 0 ? (
                  <p
                    className={`${inter.className} py-8 text-sm text-[#81766D]`}
                  >
                    {search
                      ? `No writers found for "${search}".`
                      : "No writers yet."}
                  </p>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                    {filteredWriters.map((writer) => (
                      <Link
                        key={writer.id}
                        href={`/writers/${writer.id}`}
                        className="group rounded-xl border border-[#DCD4C9] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#053400]/30 hover:shadow-md"
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
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#053400] text-lg font-medium text-white">
                              {(writer.display_name || "W")[0].toUpperCase()}
                            </div>
                          )}

                          <h3
                            className={`${poppins.className} text-lg font-medium transition group-hover:text-[#053400]`}
                          >
                            {writer.display_name || "Qalam Writer"}
                          </h3>

                        </div>

                        {writer.bio && (
                          <p
                            className={`${inter.className} mt-5 line-clamp-3 text-sm leading-6 text-[#70655C]`}
                          >
                            {writer.bio}
                          </p>
                        )}

                      </Link>
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
