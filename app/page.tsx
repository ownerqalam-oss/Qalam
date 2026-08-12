"use client";

import Image from "next/image";
import { Poppins, Inter } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

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

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">




      {/* HERO */}
      <section className="mx-auto max-w-[1180px] px-8">

        <div className="grid min-h-[470px] grid-cols-2 items-center border-b border-[#DCD4C9]">

          {/* Illustration */}
          <div className="flex items-center justify-center">
            <Image
              src="/qalam-hero.png"
              alt="Quill and inkpot"
              width={620}
              height={500}
              priority
              className="w-[500px] h-auto"
            />
          </div>

          {/* Hero copy */}
          <div className="pl-8">

            <p
              className={`${inter.className} text-[11px] font-medium uppercase tracking-[0.45em] text-[#42614A]`}
            >
              REVIVING THE PEN
            </p>

            <h1
              className={`${poppins.className} mt-5 max-w-[570px] text-[56px] font-medium leading-[1.08] tracking-[-2px] text-[#053400]`}
            >
              A place to write,
              <br />
              rooted in Allah
            </h1>

            <p
              className={`${inter.className} mt-7 max-w-[520px] text-[16px] leading-[1.65] text-[#62574F]`}
            >
              A home for Muslim writers and readers, sharing articles,
              poetry, reflections and short stories written with sincerity.
            </p>

            <a
              href="/write"
              className={`${inter.className} mt-8 inline-flex items-center gap-3 rounded-full bg-[#053400] px-6 py-3 text-[12px] font-medium text-white transition hover:bg-[#0B4D2B]`}
            >
              START WRITING NOW
              <span className="text-base">→</span>
            </a>

          </div>
        </div>
      </section>


      {/* GENRES */}
      <section className="mx-auto max-w-[1180px] px-8">

        <div className="grid grid-cols-4 border-b border-[#DCD4C9]">

          {genres.map((genre, index) => (
            <a
              key={genre.title}
              href={`/journal?genre=${genre.title.toLowerCase()}`}
              className={`px-7 py-8 transition hover:bg-[#F1EAE0] ${
                index !== 0
                  ? "border-l border-[#DCD4C9]"
                  : ""
              }`}
            >

              <h2
                className={`${poppins.className} text-[24px] font-medium text-[#46382F]`}
              >
                {genre.title}
              </h2>

              <p
                className={`${inter.className} mt-3 text-[13px] leading-[1.6] text-[#70655C]`}
              >
                {genre.description}
              </p>

            </a>
          ))}

        </div>
      </section>


      {/* LATEST FROM JOURNAL */}
      <section className="mx-auto max-w-[1180px] px-8">

        <div className="border-b border-[#DCD4C9]">

          <div className="flex items-center justify-between py-8">

            <h2
              className={`${poppins.className} text-[30px] font-medium text-[#46382F]`}
            >
              Latest from the journal
            </h2>

            <a
              href="/journal"
              className={`${inter.className} text-[13px] font-medium text-[#46382F] transition hover:text-[#053400]`}
            >
              VIEW ALL →
            </a>

          </div>


          {/* Article list */}
          <div className="divide-y divide-[#DCD4C9]">

            {/* 
              Your existing published articles will go here.
              We are deliberately not inventing article content.
            */}

            <div className="py-8">
              <p
                className={`${inter.className} text-[14px] text-[#81766D]`}
              >
                No published writing yet.
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="mx-auto max-w-[1180px] px-8">

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
              They can silce your toungue,
 but not your pen
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
