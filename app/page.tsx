"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase/client";
import { estimateReadingTime } from "../lib/readingTime";
import { getGenreColor } from "../lib/genreColors";
import InkFlourish from "../components/InkFlourish";
import CoverImage from "../components/CoverImage";
import { ButtonLink } from "../components/ui/Button";
import { Card, CardLink } from "../components/ui/Card";
import { prompts, getRandomPrompt } from "../lib/prompts";

const headingFont = "font-[family-name:var(--font-heading)]";
const bodyFont = "font-[family-name:var(--font-body)]";
const arabicFont = "font-[family-name:var(--font-arabic)]";

const GENRE_BORDER_CLASSES = [
  "",
  "border-l border-border",
  "border-t border-border md:border-t-0 md:border-l",
  "border-l border-t border-border md:border-t-0",
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
  cover_image_url: string | null;
  is_featured: boolean;
}

interface Writer {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function Home() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setPromptIndex(getRandomPrompt()), 0);
    return () => clearTimeout(id);
  }, []);

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
        const latest = data.slice(0, 6);
        setArticles(latest);

        const featured = data.filter((article) => article.is_featured).slice(0, 3);
        setFeaturedArticles(featured);

        const authorIds = Array.from(
          new Set(
            [...latest, ...featured]
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

  useEffect(() => {
    if (articles.length < 2 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((index) => (index + 1) % articles.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [articles.length, isPaused]);

  return (
    <main className="min-h-screen bg-cream text-ink-900">

      {/* HERO */}
      <section className="mx-auto w-full max-w-[1540px] px-6 md:px-10 lg:px-12">

        <div className="flex flex-col items-center border-b border-border py-10 md:grid md:min-h-[440px] md:grid-cols-2 md:py-0">

          {/* Illustration */}
          <div className="animate-fade-in-up order-2 flex flex-col items-center justify-center gap-6 py-8 md:order-1">
            <div
              dir="rtl"
              className={`${arabicFont} animate-verse flex max-w-[480px] flex-col items-center pt-3 text-[34px] font-bold leading-[2.1] drop-shadow-[0_2px_3px_rgba(5,52,0,0.18)] sm:max-w-[560px] sm:text-[46px] md:max-w-[640px] md:text-[56px]`}
            >
              <div className="relative w-fit">
                <div className="bg-gradient-to-br from-brand-900 to-[#0E5C33] bg-clip-text text-transparent">
                  ن ۚ وَالْقَلَمِ وَمَا يَسْطُرُونَ{" "}
                  <span className="align-middle text-[0.45em] text-gold-600">۝١</span>
                </div>
                <div
                  aria-hidden="true"
                  className="animate-ink-cover absolute inset-y-0 left-0 bg-cream"
                  style={{ animationDelay: "300ms" }}
                />
              </div>

              <div className="relative mt-2 w-fit">
                <div className="bg-gradient-to-br from-brand-900 to-[#0E5C33] bg-clip-text text-transparent">
                  مَا أَنتَ بِنِعْمَةِ رَبِّكَ بِمَجْنُونٍ{" "}
                  <span className="align-middle text-[0.45em] text-gold-600">۝٢</span>
                </div>
                <div
                  aria-hidden="true"
                  className="animate-ink-cover absolute inset-y-0 left-0 bg-cream"
                  style={{ animationDelay: "1.7s" }}
                />
              </div>
            </div>

            <InkFlourish className="w-[200px] sm:w-[260px]" animate />

            <div className="max-w-[360px] text-center">
              <p
                className={`${bodyFont} text-[13px] italic leading-6 text-ink-600 sm:text-sm`}
              >
                &ldquo;By the pen and what they inscribe, you are not, by the
                favor of your Lord, a madman.&rdquo;
              </p>

              <p
                className={`${bodyFont} mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-600 sm:text-xs`}
              >
                Surah Al-Qalam 68:1&ndash;2
              </p>
            </div>
          </div>

          {/* Hero copy */}
          <div className="order-1 text-center md:order-2 md:pl-10 md:text-left lg:pl-14">

            <p
              style={{ animationDelay: "80ms" }}
              className={`${bodyFont} animate-fade-in-up text-[11px] font-medium uppercase tracking-[0.45em] text-brand-600`}
            >
              REVIVING THE PEN
            </p>

            <h1
              style={{ animationDelay: "140ms" }}
              className={`${headingFont} animate-fade-in-up mt-5 text-[36px] font-medium leading-[1.08] tracking-[-1px] text-brand-900 sm:text-[46px] md:max-w-[620px] md:text-[58px] md:leading-[1.04] md:tracking-[-2.5px]`}
            >
              A place to write,
              <br />
              rooted in Allah
            </h1>

            <p
              style={{ animationDelay: "220ms" }}
              className={`${bodyFont} animate-fade-in-up mx-auto mt-7 max-w-[420px] text-[16px] leading-[1.55] text-[#62574F] md:mx-0 md:max-w-[570px] md:text-[17px]`}
            >
              A home for Muslim writers and readers, sharing articles, poetry,
              reflections and short stories written with sincerity.
            </p>

            <ButtonLink
              href="/editor"
              variant="primary"
              style={{ animationDelay: "300ms" }}
              className={`${bodyFont} animate-fade-in-up mt-7 gap-3 hover:-translate-y-0.5 hover:shadow-md`}
            >
              START WRITING NOW
              <span className="text-base">→</span>
            </ButtonLink>

            <Link
              href="/editor"
              style={{ animationDelay: "340ms" }}
              className={`${bodyFont} animate-fade-in-up mt-4 block text-[13px] italic leading-6 text-ink-600 transition hover:text-brand-900`}
            >
              Today&apos;s prompt: &ldquo;{prompts[promptIndex]}&rdquo;
            </Link>

          </div>
        </div>
      </section>


      {/* LATEST FROM JOURNAL — auto-rotating spotlight */}
      <section className="mx-auto w-full max-w-[1540px] px-6 md:px-10 lg:px-12">

        <div className="border-b border-border">

          {/* Heading */}
          <div className="flex items-center justify-between py-8">

            <div>
              <h2
                className={`${headingFont} text-[31px] font-medium text-ink-900`}
              >
                Latest from the journal
              </h2>

              <InkFlourish className="mt-2 w-[90px]" />
            </div>

            <Link
              href="/journal"
              className={`${bodyFont} text-[13px] font-medium text-ink-900 transition hover:text-brand-900`}
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
                  className="h-20 animate-pulse rounded-lg bg-skeleton"
                />
              ))}
            </div>

          ) : articles.length === 0 ? (

            <div className="py-10">
              <p
                className={`${bodyFont} text-[14px] text-ink-400`}
              >
                No Journal pieces published yet.
              </p>
            </div>

          ) : (

            <div
              className="py-6"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >

              {/* Track */}
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{
                    width: `${articles.length * 100}%`,
                    transform: `translateX(-${
                      (100 / articles.length) * activeIndex
                    }%)`,
                  }}
                >

                  {articles.map((article) => {
                    const writer = article.is_anonymous
                      ? null
                      : getWriter(article.user_id);

                    const genreColor = getGenreColor(article.type);

                    return (
                      <div
                        key={article.id}
                        className="shrink-0 px-1"
                        style={{ width: `${100 / articles.length}%` }}
                      >
                        <Card
                          role="link"
                          tabIndex={0}
                          onClick={() => router.push(`/journal/${article.id}`)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              router.push(`/journal/${article.id}`);
                            }
                          }}
                          className={`group block cursor-pointer border-t-4 ${genreColor.cardBorder} p-6 md:p-8`}
                        >

                          <div className="flex items-start gap-5 md:gap-8">

                            <CoverImage
                              src={article.cover_image_url}
                              type={article.type}
                              alt={article.title}
                              className="h-20 w-20 shrink-0 rounded-lg sm:h-24 sm:w-24"
                            />

                            <div className="min-w-0 flex-1">

                              <span
                                className={`${bodyFont} inline-block rounded-full ${genreColor.badgeBg} px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] ${genreColor.badgeText}`}
                              >
                                {article.type === "story"
                                  ? "Short Story"
                                  : article.type}
                              </span>

                              <h3
                                className={`${headingFont} mt-2 text-[22px] font-medium text-ink-900 transition group-hover:text-brand-900 md:text-[27px]`}
                              >
                                {article.title}
                              </h3>

                              {article.tagline && (
                                <p
                                  className={`${bodyFont} mt-2 text-[14px] leading-6 text-ink-600`}
                                >
                                  {article.tagline}
                                </p>
                              )}

                              {/* BYLINE */}
                              {writer ? (
                                <Link
                                  href={`/writers/${article.user_id}`}
                                  onClick={(event) => event.stopPropagation()}
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

                                  <span
                                    className={`${bodyFont} text-[13px] text-ink-600`}
                                  >
                                    {writer.display_name || "Qalam Writer"}
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
                                </Link>
                              ) : (
                                <div className="mt-4 flex items-center gap-2.5">
                                  <div
                                    className={`${headingFont} flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-[11px] font-medium text-white`}
                                  >
                                    Q
                                  </div>

                                  <span
                                    className={`${bodyFont} text-[13px] text-ink-600`}
                                  >
                                    Qalam Writer
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
                              )}

                            </div>

                          </div>

                        </Card>
                      </div>
                    );
                  })}

                </div>
              </div>

              {/* Dots */}
              {articles.length > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  {articles.map((article, index) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Show article ${index + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        index === activeIndex
                          ? "w-6 bg-brand-900"
                          : "w-2 bg-border hover:bg-gold-600"
                      }`}
                    />
                  ))}
                </div>
              )}

            </div>

          )}

        </div>
      </section>


      {/* FEATURED / EDITOR'S PICKS */}
      {featuredArticles.length > 0 && (
        <section className="mx-auto w-full max-w-[1540px] px-6 md:px-10 lg:px-12">
          <div className="border-b border-border py-10">
            <div className="flex items-center gap-2">
              <span className="text-gold-600">★</span>
              <h2
                className={`${headingFont} text-[26px] font-medium text-brand-900`}
              >
                Editor&apos;s Picks
              </h2>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {featuredArticles.map((article) => {
                const writer = article.is_anonymous ? null : getWriter(article.user_id);
                const genreColor = getGenreColor(article.type);

                return (
                  <CardLink
                    key={article.id}
                    href={`/journal/${article.id}`}
                    className={`border-t-4 ${genreColor.cardBorder} p-5`}
                  >
                    <CoverImage
                      src={article.cover_image_url}
                      type={article.type}
                      alt={article.title}
                      className="h-32 w-full rounded-lg"
                    />

                    <h3
                      className={`${headingFont} mt-3 text-lg font-medium text-ink-900 group-hover:text-brand-900`}
                    >
                      {article.title}
                    </h3>

                    <p className={`${bodyFont} mt-1 text-xs text-ink-400`}>
                      {writer?.display_name || "Qalam Writer"}
                    </p>
                  </CardLink>
                );
              })}
            </div>
          </div>
        </section>
      )}


      {/* GENRES */}
      <section className="mx-auto w-full max-w-[1540px] px-6 md:px-10 lg:px-12">

        <div className="grid grid-cols-2 border-b border-border md:grid-cols-4">

          {genres.map((genre, index) => {
            const genreColor = getGenreColor(genre.type);

            return (
            <a
              key={genre.title}
              href={`/journal?genre=${genre.title.toLowerCase()}`}
              className={`px-5 py-6 transition hover:bg-cream-card hover:shadow-sm md:px-8 md:py-8 ${GENRE_BORDER_CLASSES[index]}`}
            >

              <span
                className={`inline-block h-2 w-2 rounded-full ${genreColor.dot}`}
              />

              <h2
                className={`${headingFont} mt-2 text-[18px] font-medium text-ink-900 md:text-[25px]`}
              >
                {genre.title}
              </h2>

              <p
                className={`${bodyFont} mt-3 max-w-[300px] text-[13px] leading-[1.6] text-ink-600`}
              >
                {genre.description}
              </p>

            </a>
            );
          })}

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
              className={`${bodyFont} text-[13px] text-ink-400`}
            >
              They can silence your tongue,
              <br />
              but not your pen.
            </p>

          </div>

          <div
            className={`${bodyFont} flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-ink-400`}
          >
            <a href="/about" className="hover:text-brand-900">
              About
            </a>

            <a href="/journal" className="hover:text-brand-900">
              Journal
            </a>

            <a href="/writers" className="hover:text-brand-900">
              Writers
            </a>

            <Link href="/collections" className="hover:text-brand-900">
              Collections
            </Link>

            <Link href="/privacy" className="hover:text-brand-900">
              Privacy
            </Link>

            <Link href="/terms" className="hover:text-brand-900">
              Terms
            </Link>

            <a href="/contact" className="hover:text-brand-900">
              Contact
            </a>
          </div>

        </div>
      </footer>

    </main>
  );
}
