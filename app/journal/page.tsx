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
  tagline: string | null;
  content: string;
  type: string;
  tags: string[] | null;
  published_at: string;
  user_id: string;
  is_anonymous: boolean;
}

interface Writer {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function JournalPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    const { data, error } = await supabase
      .from("drafts")
      .select("*")
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

  function getWriter(userId: string) {
    return writers.find((writer) => writer.id === userId);
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

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <section className="mx-auto max-w-[1180px] px-6 py-16 md:px-8">

        {/* HEADER */}
        <div className="mb-12">
          <p
            className={`${inter.className} text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]`}
          >
            THE QALAM JOURNAL
          </p>

          <h1
            className={`${poppins.className} mt-4 text-5xl font-medium text-[#053400]`}
          >
            Journal
          </h1>

          <p
            className={`${inter.className} mt-4 max-w-2xl text-[16px] leading-7 text-[#70655C]`}
          >
            Discover thoughtful writing from the Qalam community.
          </p>
        </div>

        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-[#EFE8DC]"
              />
            ))}
          </div>
        )}

        {!loading &&
          types.map((type) => {
            const posts = articles.filter((a) => a.type === type);

            if (posts.length === 0) return null;

            const genreColor = getGenreColor(type);

            return (
              <section key={type} className="mb-16">
                <div className="mb-6 flex items-center justify-between border-b border-[#DCD4C9] pb-5">
                  <h2
                    className={`${poppins.className} text-3xl font-medium`}
                  >
                    {sectionTitle(type)}
                  </h2>
                </div>

                <div className="space-y-4">
                  {posts.map((post) => {
                    const writer = post.is_anonymous
                      ? null
                      : getWriter(post.user_id);

                    return (
                      <Link
                        key={post.id}
                        href={`/journal/${post.id}`}
                        className={`group block rounded-xl border border-[#DCD4C9] border-t-4 ${genreColor.cardBorder} bg-[#FFFDF8] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
                      >
                        <h3
                          className={`${poppins.className} text-2xl font-medium text-[#46382F] transition group-hover:text-[#053400]`}
                        >
                          {post.title}
                        </h3>

                        {post.tagline && (
                          <p
                            className={`${inter.className} mt-2 text-[15px] leading-6 text-[#70655C]`}
                          >
                            {post.tagline}
                          </p>
                        )}

                        {post.tags && post.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`${inter.className} rounded-full bg-[#E9E2D8] px-3 py-1 text-xs text-[#70655C]`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* BYLINE */}
                        <div className="mt-4 flex items-center gap-2.5">
                          {writer?.avatar_url ? (
                            <img
                              src={writer.avatar_url}
                              alt={writer.display_name || "Writer"}
                              className="h-7 w-7 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`${poppins.className} flex h-7 w-7 items-center justify-center rounded-full bg-[#053400] text-[11px] font-medium text-white`}
                            >
                              {(writer?.display_name || "Q")[0].toUpperCase()}
                            </div>
                          )}

                          <span
                            className={`${inter.className} text-[13px] text-[#70655C]`}
                          >
                            {writer?.display_name || "Qalam Writer"}
                            <span className="text-[#B8AF9F]"> · </span>
                            {post.published_at
                              ? new Date(
                                  post.published_at
                                ).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : ""}
                            <span className="text-[#B8AF9F]"> · </span>
                            {estimateReadingTime(post.content)} min read
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}

        {!loading && articles.length === 0 && (
          <div className="border border-[#DCD4C9] py-16 text-center">
            <p className={`${inter.className} text-sm text-[#81766D]`}>
              No published articles yet.
            </p>
          </div>
        )}

      </section>
    </main>
  );
}
