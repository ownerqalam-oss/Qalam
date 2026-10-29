"use client";

import { useAuth } from "../../components/AuthProvider";
import { ButtonLink } from "../../components/ui/Button";
import {
  COMPETITION,
  COMPETITION_EDITOR_URL,
  isCompetitionClosed,
} from "../../lib/competition";

const bodyFont = "font-[family-name:var(--font-body)]";

// Rendered after auth loads (never on the server), so the deadline is
// checked at view time rather than frozen into the static page.
export default function EnterButton() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="h-10" />;
  }

  if (isCompetitionClosed()) {
    return (
      <p className={`${bodyFont} text-sm font-medium text-ink-900`}>
        Entries closed on {COMPETITION.deadlineLabel}. Thank you to everyone who entered.
      </p>
    );
  }

  return (
    <div>
      {session ? (
        <ButtonLink href={COMPETITION_EDITOR_URL}>Write your poem</ButtonLink>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href="/signup">Sign up to enter</ButtonLink>
          <ButtonLink href="/login" variant="secondary">
            Log in
          </ButtonLink>
        </div>
      )}

      <p className={`${bodyFont} mt-3 text-[13px] text-ink-600`}>
        Entries close at 11:59pm on {COMPETITION.deadlineLabel}.
      </p>
    </div>
  );
}
