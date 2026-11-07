import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { createPublicClient } from "../../../lib/supabase/public";
import { noIndex } from "../../../lib/seo";
import { COMPETITION } from "../../../lib/competition";
import InkFlourish from "../../../components/InkFlourish";

const headingFont = "font-[family-name:var(--font-heading)]";
const bodyFont = "font-[family-name:var(--font-body)]";

// Printed as a QR code, so it must never 404 and must pick up edits to
// the poem without a redeploy. Deliberately unlisted: no nav link, not in
// the sitemap, and kept out of search results.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `${COMPETITION.title}: The Winning Poem`,
  description: `The winning poem of ${COMPETITION.title}, a poetry competition from Qalam and Ireland's Week for Change.`,
  ...noIndex,
};

// Night sky after the Week for Change dinner's "Legacies Amongst Stars"
// theme: two tiled star layers of different sizes so the repeat doesn't
// read as a grid, plus a gold and a Qalam-green glow.
function stars(points: [number, number, number][], colour: string) {
  return points.map(
    ([x, y, size]) =>
      `radial-gradient(${size}px ${size}px at ${x}px ${y}px, ${colour}, transparent)`
  );
}

const smallStars = stars(
  [
    [30, 50, 1.5], [120, 20, 1], [205, 95, 1.5], [255, 210, 1],
    [80, 165, 1], [160, 245, 1.5], [18, 262, 1], [235, 30, 1],
  ],
  "rgba(247, 241, 232, 0.85)"
);

const brightStars = stars(
  [[60, 300, 2.5], [300, 120, 2], [225, 385, 2]],
  "rgba(232, 200, 120, 0.9)"
);

const NIGHT_SKY: CSSProperties = {
  backgroundColor: "#081630",
  backgroundImage: [
    "radial-gradient(ellipse 70% 45% at 78% 0%, rgba(217, 180, 90, 0.18), transparent 70%)",
    "radial-gradient(ellipse 60% 40% at 0% 100%, rgba(46, 125, 79, 0.22), transparent 70%)",
    ...smallStars,
    ...brightStars,
  ].join(", "),
  backgroundSize: [
    "auto",
    "auto",
    ...smallStars.map(() => "280px 280px"),
    ...brightStars.map(() => "410px 410px"),
  ].join(", "),
};

interface WinningPoem {
  id: string;
  title: string;
  content: string;
  user_id: string;
  is_anonymous: boolean;
}

async function loadWinner() {
  if (!COMPETITION.winnerId) return null;

  const supabase = createPublicClient();

  const { data: poem } = await supabase
    .from("drafts")
    .select("id, title, content, user_id, is_anonymous")
    .eq("id", COMPETITION.winnerId)
    .eq("status", "published")
    .maybeSingle<WinningPoem>();

  if (!poem) return null;

  if (poem.is_anonymous) return { poem, writerName: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", poem.user_id)
    .maybeSingle<{ display_name: string | null }>();

  return { poem, writerName: profile?.display_name || "Qalam Writer" };
}

export default async function WinningPoemPage() {
  const winner = await loadWinner();

  return (
    <main className="min-h-screen text-cream" style={NIGHT_SKY}>
      <section className="mx-auto max-w-2xl px-5 pt-16 pb-20 md:px-8">

        <header className="text-center">
          <p className={`${bodyFont} text-[11px] font-medium uppercase tracking-[0.3em] text-[#E8C878]`}>
            Week for Change Grand Dinner
          </p>

          <p className={`${headingFont} mt-2 text-lg italic text-cream/80`}>
            Legacies Amongst Stars
          </p>

          <h1 className={`${headingFont} mt-8 text-5xl font-medium text-cream md:text-6xl`}>
            {COMPETITION.title}
          </h1>

          <p className={`${bodyFont} mt-3 text-[11px] font-medium uppercase tracking-[0.3em] text-cream/70`}>
            A poetry competition by Qalam
          </p>

          <InkFlourish className="mx-auto mt-4 w-[110px] text-[#E8C878]" />
        </header>

        <article className="mt-12 rounded-2xl bg-cream px-7 py-10 text-ink-900 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:px-12 md:py-14">
          {winner ? (
            <>
              <p className={`${bodyFont} text-[11px] font-medium uppercase tracking-[0.3em] text-gold-700`}>
                The winning poem
              </p>

              <h2 className={`${headingFont} mt-3 text-4xl font-medium text-brand-900`}>
                {winner.poem.title}
              </h2>

              <p className={`${bodyFont} mt-2 text-[15px] text-ink-600`}>
                {winner.writerName ? (
                  <>
                    by{" "}
                    <Link
                      href={`/writers/${winner.poem.user_id}`}
                      className="font-medium text-ink-900 hover:underline"
                    >
                      {winner.writerName}
                    </Link>
                  </>
                ) : (
                  "by an anonymous writer"
                )}
              </p>

              <InkFlourish className="mt-3 w-[90px]" />

              <div
                className={`${bodyFont} prose prose-lg mt-8 max-w-none text-ink-900 writing-body`}
                dangerouslySetInnerHTML={{ __html: winner.poem.content }}
              />
            </>
          ) : (
            <div className="py-6 text-center">
              <p className={`${headingFont} text-2xl font-medium text-brand-900`}>
                The winning poem will appear here soon
              </p>
              <p className={`${bodyFont} mt-3 text-[15px] leading-7 text-ink-600`}>
                in shā&apos; Allāh. Thank you for supporting Ireland&apos;s Week
                for Change.
              </p>
            </div>
          )}
        </article>

        <footer className={`${bodyFont} mt-10 text-center text-sm leading-7 text-cream/75`}>
          {winner && (
            <p className="mb-4">
              Thank you for supporting Ireland&apos;s Week for Change. Chosen
              from the entries to {COMPETITION.title}, written on the theme of
              change.
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-medium text-[#E8C878]">
            {winner && (
              <Link href={`/journal/${winner.poem.id}`} className="hover:underline">
                Like or comment on this poem →
              </Link>
            )}
            <Link href={COMPETITION.path} className="hover:underline">
              Read every entry →
            </Link>
            <Link href="/" className="hover:underline">
              Discover Qalam →
            </Link>
          </div>
        </footer>

      </section>
    </main>
  );
}
