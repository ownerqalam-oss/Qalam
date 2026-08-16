"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../lib/supabase/client";
import { estimateReadingTime } from "../lib/readingTime";
import { getGenreColor } from "../lib/genreColors";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const GENRE_BORDER_CLASSES = [
  "",
  "border-l border-[#DCD4C9]",
  "border-t border-[#DCD4C9] md:border-t-0 md:border-l",
  "border-l border-t border-[#DCD4C9] md:border-t-0",
];

const genres = [
  {
    title: "Articles",
    type: "article",
    description:
      "Thoughtful writing on faith, society, culture and the questions that shape how we see the world.",
  },
  {
    title: "Poetry",
    type: "poetry",
    description:
      "Poetry exploring faith, love, longing, identity and the quiet moments of life.",
  },
  {
    title: "Short Stories",
    type: "story",
    description:
      "Stories rooted in the human experience, exploring life, faith, struggle and imagination.",
  },
  {
    title: "Reflections",
    type: "reflection",
    description:
      "Personal reflections on faith, life, growth and the experiences that bring us closer to Allah.",
  },
];

interface Article {
  id: string;
  title: string;
  tagline: string | null;
  content: string;
  type: string;
  published_at: string | null;
  user_id: string;
  is_anonymous: boolean;
}

interface Writer {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    async function loadLatestArticles() {
      const { data, error } = await supabase
        .from("drafts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Error loading homepage articles:", error);
        setLoadingArticles(false);
        return;
      }

      if (data) {
        const latest = data.slice(0, 3);
        setArticles(latest);

        const authorIds = Array.from(
          new Set(
            latest
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

      setLoadingArticles(false);
    }

    loadLatestArticles();
  }, []);

  function getWriter(userId: string) {
    return writers.find((writer) => writer.id === userId);
  }

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">

      {/* HERO */}
      <section className="mx-auto w-full max-w-[1540px] px-6 md:px-10 lg:px-12">

        <div className="flex flex-col items-center border-b border-[#DCD4C9] py-10 md:grid md:min-h-[440px] md:grid-cols-2 md:py-0">

          {/* Illustration */}
          <div className="order-2 flex items-center justify-center md:order-1">
            <Image
              src="/qalam-hero.png"
              alt="Quill and inkpot"
              width={700}
              height={560}
              priority
              className="h-auto w-[280px] max-w-full sm:w-[380px] md:w-[620px]"
            />
          </div>

          {/* Hero copy */}
          <div className="order-1 text-center md:order-2 md:pl-10 md:text-left lg:pl-14">

            <p
              className={`${inter.className} text-[11px] font-medium uppercase tracking-[0.45em] text-[#42614A]`}
            >
              REVIVING THE PEN
            </p>

            <h1
              className={`${poppins.className} mt-5 text-[36px] font-medium leading-[1.08] tracking-[-1px] text-[#053400] sm:text-[46px] md:max-w-[620px] md:text-[58px] md:leading-[1.04] md:tracking-[-2.5px]`}
            >
              A place to write,
              <br />
              rooted in Allah
            </h1>

            <p
              className={`${inter.className} mx-auto mt-7 max-w-[420px] text-[16px] leading-[1.55] text-[#62574F] md:mx-0 md:max-w-[570px] md:text-[17px]`}
            >
              A home for Muslim writers and readers, sharing articles, poetry,
              reflections and short stories written with sincerity.
            </p>

            <a
              href="/write"
              className={`${inter.className} mt-7 inline-flex items-center gap-3 rounded-full bg-[#053400] px-6 py-3 text-[12px] font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0B4D2B] hover:shadow-md`}
            >
              START WRITING NOW
              <span className="text-base">→</span>
            </a>

          </div>
        </div>
      </section>


      {/* GENRES */}
      <section className="mx-auto w-full max-w-[1540px] px-6 md:px-10 lg:px-12">

        <div className="grid grid-cols-2 border-b border-[#DCD4C9] md:grid-cols-4">

          {genres.map((genre, index) => {
            const genreColor = getGenreColor(genre.type);

            return (
            <a
              key={genre.title}
              href={`/journal?genre=${genre.title.toLowerCase()}`}
              className={`px-5 py-6 transition hover:bg-white hover:shadow-sm md:px-8 md:py-8 ${GENRE_BORDER_CLASSES[index]}`}
            >

              <span
                className={`inline-block h-2 w-2 rounded-full ${genreColor.dot}`}
              />

              <h2
                className={`${poppins.className} mt-2 text-[18px] font-medium text-[#46382F] md:text-[25px]`}
              >
                {genre.title}
              </h2>

              <p
                className={`${inter.className} mt-3 max-w-[300px] text-[13px] leading-[1.6] text-[#70655C]`}
              >
                {genre.description}
              </p>

            </a>
            );
          })}

        </div>
      </section>


      {/* LATEST FROM JOURNAL */}
      <section className="mx-auto w-full max-w-[1540px] px-6 md:px-10 lg:px-12">

        <div className="border-b border-[#DCD4C9]">

          {/* Heading */}
          <div className="flex items-center justify-between py-8">

            <h2
              className={`${poppins.className} text-[31px] font-medium text-[#46382F]`}
            >
              Latest from the journal
            </h2>

            <Link
              href="/journal"
              className={`${inter.className} text-[13px] font-medium text-[#46382F] transition hover:text-[#053400]`}
            >
              VIEW ALL →
            </Link>

          </div>


          {/* Articles */}
          {loadingArticles ? (

            <div className="space-y-4 py-4">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-[#EFE8DC]"
                />
              ))}
            </div>

          ) : articles.length === 0 ? (

            <div className="py-10">
              <p
                className={`${inter.className} text-[14px] text-[#81766D]`}
              >
                No published writing yet.
              </p>
            </div>

          ) : (

            <div className="space-y-4 py-6">

              {articles.map((article) => {
                const writer = article.is_anonymous
                  ? null
                  : getWriter(article.user_id);

                const genreColor = getGenreColor(article.type);

                return (
                  <Link
                    key={article.id}
                    href={`/journal/${article.id}`}
                    className={`group block rounded-xl border border-[#DCD4C9] border-t-4 ${genreColor.cardBorder} bg-[#FFFDF8] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-8`}
                  >

                    <div className="flex items-start justify-between gap-10">

                      <div className="max-w-4xl">

                        <span
                          className={`${inter.className} inline-block rounded-full ${genreColor.badgeBg} px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] ${genreColor.badgeText}`}
                        >
                          {article.type === "story"
                            ? "Short Story"
                            : article.type}
                        </span>

                        <h3
                          className={`${poppins.className} mt-2 text-[22px] font-medium text-[#46382F] transition group-hover:text-[#053400] md:text-[27px]`}
                        >
                          {article.title}
                        </h3>

                        {article.tagline && (
                          <p
                            className={`${inter.className} mt-2 text-[14px] leading-6 text-[#70655C]`}
                          >
                            {article.tagline}
                          </p>
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
                            {article.published_at
                              ? new Date(
                                  article.published_at
                                ).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : ""}
                            <span className="text-[#B8AF9F]"> · </span>
                            {estimateReadingTime(article.content)} min read
                          </span>
                        </div>

                      </div>

                    </div>

                  </Link>
                );
              })}

            </div>

          )}

        </div>
      </section>


      {/* FOOTER */}
      <footer className="mx-auto w-full max-w-[1540px] px-6 md:px-10 lg:px-12">

        <div className="flex flex-col justify-between gap-8 py-14 md:flex-row md:items-center">

          <div className="flex items-center gap-6">

            <Image
              src="/logo2.png"
              alt="Qalam"
              width={120}
              height={50}
              className="w-[110px] h-auto"
            />

            <p
              className={`${inter.className} text-[13px] text-[#81766D]`}
            >
              They can silence your tongue,
              <br />
              but not your pen.
            </p>

          </div>

          <div
            className={`${inter.className} flex gap-7 text-[13px] text-[#81766D]`}
          >
            <a href="/about" className="hover:text-[#053400]">
              About
            </a>

            <a href="/journal" className="hover:text-[#053400]">
              Journal
            </a>

            <a href="/writers" className="hover:text-[#053400]">
              Writers
            </a>

            <a href="/contact" className="hover:text-[#053400]">
              Contact
            </a>
          </div>

        </div>
      </footer>

    </main>
  );
}
