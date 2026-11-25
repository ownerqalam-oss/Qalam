import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../lib/seo";
import { COMPETITION, isWinnerRevealed } from "../../lib/competition";
import InkFlourish from "../../components/InkFlourish";
import EnterButton from "./EnterButton";
import CompetitionEntries from "./CompetitionEntries";

const headingFont = "font-[family-name:var(--font-heading)]";
const bodyFont = "font-[family-name:var(--font-body)]";
const arabicFont = "font-[family-name:var(--font-arabic)]";

export const metadata: Metadata = pageMetadata({
  title: "Change Within: A Poetry Competition",
  description:
    "A poetry competition from Qalam and Ireland's Week for Change. Write a poem about change, in yourself, your community, or the world.",
  path: COMPETITION.path,
});

// Regenerated every few minutes so the winner tab appears on its own once
// COMPETITION.winnerRevealsAt has passed.
export const revalidate = 300;

export default function WeekForChangePage() {
  const winnerRevealed = isWinnerRevealed();

  return (
    <main className="min-h-screen bg-cream text-ink-900">
      <section className="mx-auto max-w-[1180px] px-6 py-16 md:px-8">

        {/* HEADER */}
        <div className="mb-10 grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className={`${bodyFont} text-[11px] font-medium uppercase tracking-[0.3em] text-brand-600`}>
              QALAM × IRELAND&apos;S WEEK FOR CHANGE
            </p>

            <h1 className={`${headingFont} mt-4 text-5xl font-medium text-brand-900`}>
              {COMPETITION.title}
            </h1>

            <InkFlourish className="mt-3 w-[90px]" />

            <p className={`${bodyFont} mt-4 max-w-2xl text-[16px] leading-7 text-ink-600`}>
              A poetry competition with Ireland&apos;s Week for Change. Write a
              poem about change: in yourself, your community, or the world.
            </p>

            <p className={`${bodyFont} mt-3 max-w-2xl text-[16px] leading-7 text-ink-600`}>
              The winning poem, chosen by our judges, will feature on the
              thank-you cards at the Week for Change annual dinner and on
              Qalam.
            </p>

            <div className="mt-6">
              <EnterButton />
            </div>
          </div>

          <div className="max-w-[400px] text-center">
            <p
              dir="rtl"
              lang="ar"
              className={`${arabicFont} text-[26px] font-bold leading-[2] text-brand-900`}
            >
              إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ
            </p>

            <p className={`${bodyFont} mt-3 text-[13px] italic leading-6 text-ink-600 sm:text-sm`}>
              &ldquo;Indeed, Allah will not change the condition of a people
              until they change what is within themselves.&rdquo;
            </p>

            <p className={`${bodyFont} mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-600 sm:text-xs`}>
              Surah Ar-Ra&apos;d 13:11
            </p>
          </div>
        </div>

        {winnerRevealed && (
          <Link
            href={COMPETITION.winnerPath}
            className={`${bodyFont} mb-8 flex items-center justify-between gap-4 rounded-xl border border-gold-600/50 bg-white px-5 py-4 text-[15px] text-brand-900 transition hover:border-gold-600 hover:shadow-sm`}
          >
            <span>
              <span className="font-medium">The winner is revealed.</span>{" "}
              <span className="text-ink-600">Read the winning poem.</span>
            </span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        )}

        {/* TABS */}
        <nav
          aria-label="Competition sections"
          className={`${bodyFont} mb-6 flex gap-7 border-b border-border`}
        >
          <span
            aria-current="page"
            className="-mb-px border-b-2 border-brand-900 pb-3 text-[15px] font-medium text-brand-900"
          >
            Entries
          </span>
          {winnerRevealed && (
            <Link
              href={COMPETITION.winnerPath}
              className="-mb-px border-b-2 border-transparent pb-3 text-[15px] font-medium text-ink-600 transition hover:text-brand-900"
            >
              The winner
            </Link>
          )}
        </nav>

        <CompetitionEntries />

      </section>
    </main>
  );
}
