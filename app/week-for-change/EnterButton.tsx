"use client";

import { useAuth } from "../../components/AuthProvider";
import { ButtonLink } from "../../components/ui/Button";
import { COMPETITION_EDITOR_URL } from "../../lib/competition";

export default function EnterButton() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="h-10" />;
  }

  if (!session) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href="/signup">Sign up to enter</ButtonLink>
        <ButtonLink href="/login" variant="secondary">
          Log in
        </ButtonLink>
      </div>
    );
  }

  return <ButtonLink href={COMPETITION_EDITOR_URL}>Write your poem</ButtonLink>;
}
