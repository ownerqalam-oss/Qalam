import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Cormorant_Garamond, Pinyon_Script } from "next/font/google";
import { createPublicClient } from "../../../lib/supabase/public";
import { noIndex } from "../../../lib/seo";
import { COMPETITION } from "../../../lib/competition";
import InkFlourish from "../../../components/InkFlourish";
import StarrySky from "./StarrySky";

// The dinner's own lettering, used only for this page's header.
const script = Pinyon_Script({ weight: "400", subsets: ["latin"] });
const serif = Cormorant_Garamond({
  weight: ["500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

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
    <main className="relative isolate min-h-screen overflow-hidden bg-[#00142A] text-[#F3EBDD]">
      <StarrySky />

      <section className="mx-auto max-w-2xl px-5 pt-16 pb-20 md:px-8">

        <header className="text-center [text-shadow:0_2px_18px_rgba(0,20,42,0.9)]">
          <p className={`${serif.className} text-xs font-semibold uppercase tracking-[0.18em] text-[#E8C878] sm:text-sm sm:tracking-[0.3em]`}>
            Week for Change Grand Dinner
          </p>

          <h1 className={`${script.className} mt-6 text-7xl leading-[1.1] text-[#FBF6EC] md:text-8xl`}>
            Change Within
          </h1>

          <p className={`${serif.className} mt-3 text-xl italic text-[#F3EBDD]/90`}>
            {winner ? "the winning poem" : "a poetry competition by Qalam"}
          </p>

          <p className={`${serif.className} mt-1 text-base text-[#E8C878]/90`}>
            Legacies amongst Stars
          </p>
        </header>

        <article className="mt-12 rounded-2xl border border-[#E8C878]/40 bg-[#00142A]/80 px-7 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-sm md:px-12 md:py-12">
          <Image
            src="/logo2.png"
            alt="Qalam"
            width={120}
            height={50}
            className="h-auto w-[96px] brightness-0 invert opacity-90"
          />

          {winner ? (
            <>
              <h2 className={`${headingFont} mt-8 text-4xl font-medium text-[#FBF6EC]`}>
                {winner.poem.title}
              </h2>

              <p className={`${bodyFont} mt-2 text-[15px] text-[#F3EBDD]/75`}>
                {winner.writerName ? (
                  <>
                    by{" "}
                    <Link
                      href={`/writers/${winner.poem.user_id}`}
                      className="font-medium text-[#FBF6EC] hover:underline"
                    >
                      {winner.writerName}
                    </Link>
                  </>
                ) : (
                  "by an anonymous writer"
                )}
              </p>

              <InkFlourish className="mt-3 w-[90px] text-[#E8C878]" />

              <div
                className={`${bodyFont} prose prose-lg prose-invert mt-8 max-w-none writing-body [--tw-prose-invert-body:#F3EBDD] [--tw-prose-invert-bold:#FFFFFF]`}
                dangerouslySetInnerHTML={{ __html: winner.poem.content }}
              />
            </>
          ) : (
            <div className="py-4">
              <p className={`${headingFont} mt-8 text-2xl font-medium text-[#FBF6EC]`}>
                The winning poem will appear here soon
              </p>
              <InkFlourish className="mt-3 w-[90px] text-[#E8C878]" />
              <p className={`${bodyFont} mt-4 text-[15px] leading-7 text-[#F3EBDD]/80`}>
                in shā&apos; Allāh. Thank you for supporting Ireland&apos;s Week
                for Change.
              </p>
            </div>
          )}
        </article>

        <footer className={`${serif.className} mt-10 text-center text-lg leading-8 text-[#F3EBDD]/85 [text-shadow:0_2px_12px_rgba(0,20,42,0.9)]`}>
          {winner && (
            <p className="mb-4 italic">
              Chosen from the entries to {COMPETITION.title}, written on the
              theme of change. Thank you for supporting Ireland&apos;s Week for
              Change.
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 font-semibold text-[#E8C878]">
            {winner && (
              <Link href={`/journal/${winner.poem.id}`} className="hover:underline">
                Like this poem
              </Link>
            )}
            <Link href={COMPETITION.path} className="hover:underline">
              Read every entry
            </Link>
            <Link href="/" className="hover:underline">
              Discover Qalam
            </Link>
          </div>
        </footer>

      </section>
    </main>
  );
}
