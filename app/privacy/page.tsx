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

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>

        <p className={`${inter.className} mt-4 text-sm text-[#9A9188]`}>
          Last updated 20 August 2026
        </p>

        <p
          className={`${inter.className} mt-6 max-w-2xl text-[17px] leading-8 text-[#70655C]`}
        >
          This explains what Qalam collects, why, and what say you have over
          it. It&apos;s written in plain language on purpose — if anything here
          is unclear, email us and we&apos;ll clarify or fix it.
        </p>

        <Section title="What we collect">
          <p>
            <strong className="text-[#46382F]">Account information:</strong>{" "}
            your email address (for sign-in and account-related emails),
            and anything you choose to add to your profile — display name,
            bio, and a profile picture.
          </p>
          <p>
            <strong className="text-[#46382F]">Content you create:</strong>{" "}
            articles, poetry, stories, reflections, comments, likes,
            bookmarks, and who you follow. Drafts are visible only to you
            and admins reviewing them; published pieces are public unless
            marked anonymous.
          </p>
          <p>
            <strong className="text-[#46382F]">Anonymous publishing:</strong>{" "}
            marking a piece anonymous hides your name from other readers —
            it does not delete the link between you and that piece in our
            database. Admins can still see who wrote it, since someone has
            to be accountable for what&apos;s published. It is anonymous to the
            public, not to us.
          </p>
          <p>
            <strong className="text-[#46382F]">Usage data:</strong> we keep
            a simple view count per article. We don&apos;t track which specific
            person viewed what, and we don&apos;t use any third-party analytics
            or advertising trackers.
          </p>
        </Section>

        <Section title="Who else sees it">
          <p>
            We use a small number of service providers to run Qalam, and
            each only sees what it needs to do its job:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-[#46382F]">Supabase</strong> — hosts
              our database and handles sign-in.
            </li>
            <li>
              <strong className="text-[#46382F]">Resend</strong> — sends
              transactional email (submission confirmations, the daily
              digest). It sees your email address and nothing else about
              your account.
            </li>
            <li>
              <strong className="text-[#46382F]">Netlify</strong> — hosts
              the website itself.
            </li>
          </ul>
          <p>
            We don&apos;t sell your data to anyone, ever, for any reason.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Qalam uses one essential cookie to keep you signed in. That&apos;s
            it — no advertising cookies, no cross-site tracking.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can edit your profile at any time from your dashboard. If
            you&apos;d like your account and everything tied to it deleted,
            email us at{" "}
            <a
              href="mailto:owner.qalam@gmail.com"
              className="text-[#053400] hover:underline"
            >
              owner.qalam@gmail.com
            </a>{" "}
            and we&apos;ll take care of it. If you&apos;re in the EU or UK, this
            includes the rights to access, correct, delete, or export your
            data under GDPR.
          </p>
        </Section>

        <Section title="Daily digest emails">
          <p>
            If you have an account, you&apos;re subscribed to a daily email
            summarising new writing on Qalam by default — sent only on
            days something new is actually published. Every digest email
            has a one-click unsubscribe link.
          </p>
        </Section>

        <Section title="Children">
          <p>
            Qalam isn&apos;t directed at children, and we ask that you be at
            least 16 years old to create an account.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If this policy changes in any meaningful way, we&apos;ll update the
            date at the top of this page.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            Reach out at{" "}
            <a
              href="mailto:owner.qalam@gmail.com"
              className="text-[#053400] hover:underline"
            >
              owner.qalam@gmail.com
            </a>{" "}
            with anything at all about your data or this policy.
          </p>
        </Section>

      </section>
    </main>
  );
}
