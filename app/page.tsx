"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ayahs } from "../lib/ayahs";
import { Amiri } from "next/font/google";

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic"],
});

export default function Home() {
  const [currentAyah, setCurrentAyah] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentAyah((prev) => (prev + 1) % ayahs.length);
  }, 7000);

  return () => clearInterval(interval);
}, []);
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto flex min-h-[75vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
        <Image
          src="/logo2.png"
          alt="Qalam Logo"
          width={420}
          height={150}
          priority
          className="mb-8"
        />

        <p className="text-xs font-medium uppercase tracking-[0.45em] text-gray-500">
          REVIVING THE PEN
        </p>

        <h1 className="mt-6 text-4xl font-semibold text-[#053400] md:text-5xl">
          A place to write.
          <br />
          Rooted in Allah.
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-8 text-gray-600">
          A home for Muslim writers and readers, sharing articles, poetry,
          reflections and short stories written with sincerity.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <a
            href="/journal"
            className="rounded-full bg-[#053400] px-8 py-3 text-white transition hover:bg-[#0B4D2B]"
          >
            Read the Journal
          </a>

          <a
            href="/login"
            className="rounded-full border border-[#053400] px-8 py-3 text-[#053400] transition hover:bg-[#053400] hover:text-white"
          >
            Write
          </a>
        </div>
      </section>

      {/* Surah Al-Qalam */}
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p
            className={`${amiri.className} text-5xl leading-loose text-[#053400] transition-all duration-700 md:text-6xl`}
            dir="rtl"
          >
            {ayahs[currentAyah].arabic}
          </p>

          <p className="mx-auto mt-8 max-w-2xl text-lg italic text-gray-700 transition-all duration-700">
            {ayahs[currentAyah].english}
          </p>

          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-gray-500 transition-all duration-700">
            {ayahs[currentAyah].reference}
          </p>
        </section>


      {/* Editor's Choice */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-4xl font-bold">
          Editor's Choice
        </h2>

        <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-[#053400]">
            Featured
          </p>

          <h3 className="mt-3 text-3xl font-semibold">
            Coming Soon
          </h3>

          <p className="mt-4 max-w-2xl text-gray-600">
            Soon you'll find carefully selected writing chosen by the Qalam
            editorial team.
          </p>
        </div>
      </section>

      {/* Latest Writing */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-4xl font-bold">
          Latest Writing
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            "Articles",
            "Reflections",
            "Poetry",
            "Short Stories",
          ].map((category) => (
            <div
              key={category}
              className="rounded-2xl border border-gray-200 p-8 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-2xl font-semibold">{category}</h3>

              <p className="mt-3 text-gray-500">
                Discover thoughtful writing from our community.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Become a Writer */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-4xl font-bold">
          Become a Writer
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
          Qalam is currently invite-only for writers. If you've been invited,
          continue your writing journey. Otherwise, enjoy the journal and
          follow our journey as we grow.
        </p>

        <a
          href="/login"
          className="mt-10 inline-block rounded-full bg-[#053400] px-8 py-3 text-white transition hover:bg-[#0B4D2B]"
        >
          Write for Qalam
        </a>
      </section>
    </main>
  );
}
