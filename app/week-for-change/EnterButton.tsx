"use client";

import Link from "next/link";
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
      <div className="flex flex-col items-center gap-2">
        <ButtonLink href="/signup">Sign up to enter</ButtonLink>
        <p className="text-sm text-ink-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-900 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  return <ButtonLink href={COMPETITION_EDITOR_URL}>Enter the competition</ButtonLink>;
}
