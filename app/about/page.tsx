import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { pageMetadata } from "../../lib/seo";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Qalam is a home for Muslim writers and readers - a space for young Muslims to write from the heart, and for readers to find writing rooted in faith.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <section className="mx-auto max-w-3xl px-6 py-20 md:px-8">

        <p
          className={`${inter.className} text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]`}
        >
          ABOUT QALAM
        </p>

        <h1
          className={`${poppins.className} mt-4 text-5xl font-medium text-[#053400]`}
        >
          Reviving the pen
        </h1>

        <p
          className={`${inter.className} mt-6 max-w-2xl text-[17px] leading-8 text-[#70655C]`}
        >
          Qalam is a home for Muslim writers and readers, sharing articles,
          poetry, reflections and short stories written with sincerity. A
          space for young Muslims to write from the heart, and for readers
          to find writing rooted in faith.
        </p>

      </section>
    </main>
  );
}
