import type { Metadata } from "next";
import { pageMetadata } from "../../lib/seo";
import { COMPETITION } from "../../lib/competition";
import InkFlourish from "../../components/InkFlourish";
import EnterButton from "./EnterButton";
import CompetitionEntries from "./CompetitionEntries";

const headingFont = "font-[family-name:var(--font-heading)]";
const arabicFont = "font-[family-name:var(--font-arabic)]";

export const metadata: Metadata = pageMetadata({
  title: "Change Within: A Poetry Competition",
  description:
    "A poetry competition from Qalam and Ireland's Week for Change. Write a poem about change, in yourself, your community, or the world.",
  path: COMPETITION.path,
});

const STEPS = [
  {
    title: "Write your poem",
    body: "Tap “Enter the competition” and the editor opens ready for poetry. One poem per person, original work only.",
  },
  {
    title: "Submit it",
    body: "Every entry is reviewed before it goes live. You can enter under your name or anonymously.",
  },
  {
    title: "Vote for your favourites",
    body: "Like the entries you love. The most-liked poem wins People's Choice.",
  },
];

export default function WeekForChangePage() {
  return (
    <main className="min-h-screen bg-cream text-ink-900">
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center md:px-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-600">
          Qalam × Ireland&apos;s Week for Change
        </p>

        <h1 className={`${headingFont} mt-4 text-5xl font-medium text-brand-900 md:text-6xl`}>
          {COMPETITION.title}
        </h1>

        <p className="mt-2 text-sm font-medium uppercase tracking-[0.25em] text-gold-700">
          A poetry competition
        </p>

        <InkFlourish className="mx-auto mt-4 w-[90px]" />

        <p
          dir="rtl"
          lang="ar"
          className={`${arabicFont} mt-8 text-2xl leading-[2] text-brand-900 md:text-3xl`}
        >
          إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ
        </p>

        <p className="mt-3 text-[16px] italic leading-7 text-ink-600">
          &ldquo;Indeed, Allah will not change the condition of a people until
          they change what is within themselves.&rdquo;
        </p>

        <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-gold-700">
          Qur&apos;an 13:11
        </p>

        <p className={`${headingFont} mt-10 text-2xl text-brand-900`}>
          {COMPETITION.prompt}
        </p>

        <div className="mt-8">
          <EnterButton />
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 md:px-8">
        <div className="rounded-2xl bg-brand-900 px-8 py-8 text-cream md:px-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold-100">
            The prize
          </p>
          <p className={`${headingFont} mt-3 max-w-3xl text-xl leading-8 md:text-2xl`}>
            The winning poem, chosen by our judges, will be printed on the
            thank-you cards at the Week for Change annual dinner and featured
            on Qalam.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="border-t border-border pt-5">
              <p className="text-xs font-medium text-gold-700">0{index + 1}</p>
              <h2 className={`${headingFont} mt-2 text-lg font-medium text-brand-900`}>
                {step.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 py-16 md:px-8">
        <h2 className={`${headingFont} text-3xl font-medium text-brand-900`}>
          Entries
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          Sorted by likes. Open a poem and like it to vote for People&apos;s Choice.
        </p>

        <div className="mt-8">
          <CompetitionEntries />
        </div>
      </section>
    </main>
  );
}
