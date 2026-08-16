import Link from "next/link";
import { Poppins, Inter } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const OPTIONS = [
  { type: "article", label: "Article", description: "Essays and long-form writing." },
  { type: "reflection", label: "Reflection", description: "Personal reflections on faith and life." },
  { type: "poetry", label: "Poetry", description: "Verse, free or structured." },
  { type: "story", label: "Short Story", description: "Fiction rooted in the human experience." },
];

export default function NewPage() {
  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <section className="mx-auto max-w-xl px-6 py-20 md:px-8">

        <p
          className={`${inter.className} text-center text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]`}
        >
          NEW PIECE
        </p>

        <h1
          className={`${poppins.className} mt-4 text-center text-4xl font-medium text-[#053400]`}
        >
          What are you writing?
        </h1>

        <div className="mt-10 space-y-3">
          {OPTIONS.map((option) => (
            <Link
              key={option.type}
              href={`/editor?type=${option.type}`}
              className="group block rounded-xl border border-[#DCD4C9] bg-[#E9E2D8] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#053400]/30 hover:shadow-md"
            >
              <h2
                className={`${poppins.className} text-xl font-medium text-[#46382F] transition group-hover:text-[#053400]`}
              >
                {option.label}
              </h2>

              <p
                className={`${inter.className} mt-1 text-sm text-[#70655C]`}
              >
                {option.description}
              </p>
            </Link>
          ))}
        </div>

      </section>
    </main>
  );
}
