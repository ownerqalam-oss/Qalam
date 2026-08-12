"use client";

import { useState, useTransition } from "react";
import { followWriter, unfollowWriter } from "../app/social/actions";

export function FollowButton({ writerId, initialFollowing }: { writerId: string; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle() {
    const previous = following;
    setFollowing(!previous);
    setError("");
    startTransition(async () => {
      const result = previous ? await unfollowWriter(writerId) : await followWriter(writerId);
      if (!result.ok) {
        setFollowing(previous);
        setError(result.error);
      }
    });
  }

  return <div className="mt-5"><button type="button" onClick={toggle} disabled={pending} aria-pressed={following} className={`rounded-full border px-5 py-2 text-sm font-semibold transition disabled:opacity-60 ${following ? "border-[#053400] text-[#053400]" : "border-[#053400] bg-[#053400] text-white"}`}>{pending ? "Saving…" : following ? "Following" : "Follow"}</button>{error && <p className="mt-2 text-sm text-red-700" role="status">{error}</p>}</div>;
}
