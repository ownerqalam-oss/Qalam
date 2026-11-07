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
    <main className="min-h-screen bg-cream text-ink-900">
      <section className="mx-auto max-w-3xl px-6 py-16 md:px-8">

        <p className={`${bodyFont} text-[11px] font-medium uppercase tracking-[0.3em] text-brand-600`}>
          QALAM × IRELAND&apos;S WEEK FOR CHANGE
        </p>

        {winner ? (
          <>
            <p className={`${bodyFont} mt-4 text-sm font-medium text-gold-700`}>
              Winner of {COMPETITION.title}
            </p>

            <h1 className={`${headingFont} mt-2 text-5xl font-medium text-brand-900`}>
              {winner.poem.title}
            </h1>

            <p className={`${bodyFont} mt-3 text-[15px] text-ink-600`}>
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
              className={`${bodyFont} prose prose-lg mt-10 max-w-none text-ink-900 writing-body`}
              dangerouslySetInnerHTML={{ __html: winner.poem.content }}
            />

            <div className="mt-14 border-t border-border pt-6">
              <p className={`${bodyFont} text-[15px] leading-7 text-ink-600`}>
                Thank you for supporting Ireland&apos;s Week for Change. This
                poem was chosen from the entries to {COMPETITION.title}, a poetry
                competition on the theme of change.
              </p>

              <div className={`${bodyFont} mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-brand-900`}>
                <Link href={`/journal/${winner.poem.id}`} className="hover:underline">
                  Like or comment on this poem →
                </Link>
                <Link href={COMPETITION.path} className="hover:underline">
                  Read every entry →
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className={`${headingFont} mt-4 text-5xl font-medium text-brand-900`}>
              {COMPETITION.title}
            </h1>

            <InkFlourish className="mt-3 w-[90px]" />

            <p className={`${bodyFont} mt-4 max-w-2xl text-[16px] leading-7 text-ink-600`}>
              The winning poem will appear here soon, in shā&apos; Allāh. Thank
              you for supporting Ireland&apos;s Week for Change.
            </p>

            <Link
              href={COMPETITION.path}
              className={`${bodyFont} mt-6 inline-block text-sm font-medium text-brand-900 hover:underline`}
            >
              Read the competition entries →
            </Link>
          </>
        )}

      </section>
    </main>
  );
}
