"use client";

import { useState, useTransition } from "react";
import { savePostForLater, unsavePostForLater } from "../app/social/actions";
import { useAuth } from "./AuthProvider";

export function SaveButton({ postId, initialSaved }: { postId: string; initialSaved: boolean }) {
  const { authenticated, loading } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (loading || !authenticated) return null;

  function toggle() {
    const previous = saved;
    setSaved(!previous);
    setError("");
    startTransition(async () => {
      const result = previous ? await unsavePostForLater(postId) : await savePostForLater(postId);
      if (!result.ok) {
        setSaved(previous);
        setError(result.error);
      }
    });
  }

  return <div className="shrink-0 text-right"><button type="button" onClick={toggle} disabled={pending} aria-pressed={saved} aria-label={saved ? "Remove from saved posts" : "Save post"} className="rounded-full border px-3 py-1.5 text-sm font-medium hover:bg-[#F1EAE0] disabled:opacity-60">{saved ? "Saved" : "Save"}</button>{error && <p className="mt-1 max-w-48 text-xs text-red-700" role="status">{error}</p>}</div>;
}
