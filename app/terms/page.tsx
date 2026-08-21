import { Poppins, Inter } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2
        className={`${poppins.className} text-2xl font-medium text-[#053400]`}
      >
        {title}
      </h2>
      <div
        className={`${inter.className} mt-3 space-y-3 text-[15px] leading-7 text-[#70655C]`}
      >
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <section className="mx-auto max-w-3xl px-6 py-20 md:px-8">

        <p
          className={`${inter.className} text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]`}
        >
          QALAM
        </p>

        <h1
          className={`${poppins.className} mt-4 text-5xl font-medium text-[#053400]`}
        >
          Terms of Service
        </h1>

        <p className={`${inter.className} mt-4 text-sm text-[#9A9188]`}>
          Last updated 20 August 2026
        </p>

        <p
          className={`${inter.className} mt-6 max-w-2xl text-[17px] leading-8 text-[#70655C]`}
        >
          By using Qalam you agree to these terms. We&apos;ve tried to keep them
          short and honest rather than padded with boilerplate.
        </p>

        <Section title="What Qalam is">
          <p>
            Qalam is a home for Muslim writers and readers to share
            articles, poetry, reflections, and short stories. Anyone with
            an account can write; every piece is reviewed by an admin
            before it&apos;s published.
          </p>
        </Section>

        <Section title="Your content, your rights">
          <p>
            You keep full ownership of everything you write. By publishing
            on Qalam, you give us permission to host and display it on the
            site, and to share short excerpts — a title, a quote, a cover
            image — on Qalam&apos;s own social media and promotional
            channels, to help other pieces find readers. Anonymous pieces
            stay credited as Anonymous when shared this way, never to you
            by name. If you&apos;d rather a specific piece not be shared
            off-site, just email us and we won&apos;t.
          </p>
          <p>
            You&apos;re responsible for making sure what you submit is
            actually yours to share, or that you have the right to share
            it.
          </p>
        </Section>

        <Section title="What's not allowed">
          <ul className="list-disc space-y-2 pl-5">
            <li>Plagiarised work, or work you don&apos;t have the right to publish.</li>
            <li>Content that&apos;s hateful, harassing, or deliberately misleading.</li>
            <li>Anything that misrepresents Islamic teaching in a knowingly deceptive way.</li>
            <li>Spamming — flooding comments, creating fake accounts, or abusing the reporting/review process.</li>
          </ul>
          <p>
            Admins can reject a submission, remove published content, or
            suspend an account that breaks these rules. We&apos;ll always try
            to give a reason via the feedback shown on your dashboard.
          </p>
        </Section>

        <Section title="Anonymous publishing">
          <p>
            You can publish without your name shown publicly. This hides
            your identity from other users, not from Qalam&apos;s admins — see
            the Privacy Policy for details. Anonymity is a courtesy for
            sensitive writing, not a shield for content that breaks these
            terms.
          </p>
        </Section>

        <Section title="Accounts">
          <p>
            You&apos;re responsible for keeping your account secure. If you
            believe someone else has access to it, email us right away.
            You can request deletion of your account and data at any time.
          </p>
        </Section>

        <Section title="No warranty">
          <p>
            Qalam is provided as-is. We do our best to keep it reliable
            and available, but we can&apos;t guarantee it&apos;ll always be
            error-free or uninterrupted.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update these terms as Qalam grows. If we make a
            meaningful change, we&apos;ll update the date at the top of this
            page.
          </p>
        </Section>

        <Section title="Governing law">
          <p>
            These terms are governed by the laws of Ireland.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms — reach out at{" "}
            <a
              href="mailto:owner.qalam@gmail.com"
              className="text-[#053400] hover:underline"
            >
              owner.qalam@gmail.com
            </a>
            .
          </p>
        </Section>

      </section>
    </main>
  );
}
