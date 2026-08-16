"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../lib/supabase/client";

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
    description:
      "Thoughtful writing on faith, society, culture and the questions that shape how we see the world.",
  },
  {
    title: "Poetry",
    description:
      "Poetry exploring faith, love, longing, identity and the quiet moments of life.",
  },
  {
    title: "Short Stories",
    description:
      "Stories rooted in the human experience, exploring life, faith, struggle and imagination.",
  },
  {
    title: "Reflections",
    description:
      "Personal reflections on faith, life, growth and the experiences that bring us closer to Allah.",
  },
];

interface Article {
  id: string;
  title: string;
  tagline: string | null;
  type: string;
  published_at: string | null;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    async function loadLatestArticles() {
      const { data, error } = await supabase
        .from("drafts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Error loading homepage articles:", error);
        return;
      }

      if (data) {
        setArticles(data.slice(0, 3));
      }
    }

    loadLatestArticles();
  }, []);

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
              className={`${inter.className} mt-7 inline-flex items-center gap-3 rounded-full bg-[#053400] px-6 py-3 text-[12px] font-medium text-white transition hover:bg-[#0B4D2B]`}
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

          {genres.map((genre, index) => (
            <a
              key={genre.title}
              href={`/journal?genre=${genre.title.toLowerCase()}`}
              className={`px-5 py-6 transition hover:bg-[#F1EAE0] md:px-8 md:py-8 ${GENRE_BORDER_CLASSES[index]}`}
            >

              <h2
                className={`${poppins.className} text-[18px] font-medium text-[#46382F] md:text-[25px]`}
              >
                {genre.title}
              </h2>

              <p
                className={`${inter.className} mt-3 max-w-[300px] text-[13px] leading-[1.6] text-[#70655C]`}
              >
                {genre.description}
              </p>

            </a>
          ))}

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
          {articles.length === 0 ? (

            <div className="py-10">
              <p
                className={`${inter.className} text-[14px] text-[#81766D]`}
              >
                No published writing yet.
              </p>
            </div>

          ) : (

            <div className="divide-y divide-[#DCD4C9]">

              {articles.map((article) => (

                <Link
                  key={article.id}
                  href={`/journal/${article.id}`}
                  className="group block py-8 transition"
                >

                  <div className="flex items-start justify-between gap-10">

                    <div className="max-w-4xl">

                      <p
                        className={`${inter.className} text-[11px] font-medium uppercase tracking-[0.2em] text-[#42614A]`}
                      >
                        {article.type === "story"
                          ? "SHORT STORY"
                          : article.type.toUpperCase()}
                      </p>

                      <h3
                        className={`${poppins.className} mt-2 text-[27px] font-medium text-[#46382F] transition group-hover:text-[#053400]`}
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

                    </div>

                    <span
                      className={`${inter.className} hidden shrink-0 pt-5 text-[13px] text-[#81766D] md:block`}
                    >
                      {article.published_at
                        ? new Date(
                            article.published_at
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </span>

                  </div>

                </Link>

              ))}

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
