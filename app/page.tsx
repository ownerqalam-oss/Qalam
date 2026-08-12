"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";

const genres = [
  { title: "Articles", type: "article", description: "Thoughtful writing on faith, society, culture, and the questions that shape how we see the world." },
  { title: "Poetry", type: "poetry", description: "Poetry exploring faith, love, longing, identity, and the quiet moments of life." },
  { title: "Short Stories", type: "story", description: "Stories rooted in the human experience, exploring life, faith, struggle, and imagination." },
  { title: "Reflections", type: "reflection", description: "Personal reflections on faith, life, growth, and the experiences that bring us closer to Allah." },
];

export default function Home() {
  const { authenticated } = useAuth();

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <section className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="grid min-h-[470px] items-center gap-10 border-b border-[#DCD4C9] py-12 md:grid-cols-2 md:py-0">
          <div className="order-2 flex min-h-64 items-center justify-center overflow-hidden rounded-[2rem] border border-[#CFC5B8] bg-[#EFE5D8] md:order-1 md:min-h-80">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-[#B9AD9D] sm:h-52 sm:w-52">
              <span aria-hidden="true" className="font-serif text-7xl text-[#42614A] sm:text-8xl">ق</span>
              <span className="sr-only">A decorative letter representing the written word</span>
            </div>
          </div>

          <div className="order-1 md:order-2 md:pl-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#42614A] sm:tracking-[0.45em]">Reviving the pen</p>
            <h1 className="mt-5 max-w-[570px] text-4xl font-medium leading-[1.08] tracking-[-1px] text-[#053400] sm:text-5xl lg:text-[56px] lg:tracking-[-2px]">
              A place to write,<br />rooted in Allah
            </h1>
            <p className="mt-7 max-w-[520px] text-base leading-[1.65] text-[#62574F]">
              A home for Muslim writers and readers, sharing articles, poetry, reflections, and short stories written with sincerity.
            </p>
            <Link href={authenticated ? "/new" : "/login"} className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#053400] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#0B4D2B]">
              Start writing now <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 sm:px-8" aria-labelledby="genres-heading">
        <h2 id="genres-heading" className="sr-only">Browse by writing type</h2>
        <div className="grid border-b border-[#DCD4C9] sm:grid-cols-2 lg:grid-cols-4">
          {genres.map((genre, index) => (
            <Link key={genre.type} href={`/journal?type=${genre.type}`} className={`border-t border-[#DCD4C9] px-5 py-7 transition hover:bg-[#F1EAE0] sm:px-7 lg:border-t-0 ${index % 2 ? "sm:border-l" : ""} ${index > 0 ? "lg:border-l" : ""}`}>
              <h3 className="text-2xl font-medium">{genre.title}</h3>
              <p className="mt-3 text-[13px] leading-[1.6] text-[#70655C]">{genre.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="border-b border-[#DCD4C9]">
          <div className="flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-medium">Latest from the journal</h2>
            <Link href="/journal" className="text-[13px] font-medium transition hover:text-[#053400]">View all →</Link>
          </div>
          <div className="border-t border-[#DCD4C9] py-8">
            <p className="text-sm text-[#81766D]">No published writing yet.</p>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-8 py-12 md:flex-row md:items-center">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Image src="/logo2.png" alt="Qalam" width={120} height={50} className="h-auto w-[110px]" />
            <p className="text-[13px] text-[#81766D]">They can slice your tongue, but not your pen.</p>
          </div>
          <div className="flex gap-7 text-[13px] text-[#81766D]">
            <Link href="/about" className="hover:text-[#053400]">About</Link>
            <Link href="/journal" className="hover:text-[#053400]">Journal</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
