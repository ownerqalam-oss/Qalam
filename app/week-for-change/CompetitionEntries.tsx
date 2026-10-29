"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";
import { COMPETITION } from "../../lib/competition";

const headingFont = "font-[family-name:var(--font-heading)]";

interface Entry {
  id: string;
  title: string;
  user_id: string;
  is_anonymous: boolean;
  likes: number;
}

interface EntriesResult {
  entries: Entry[];
  writerNames: Record<string, string>;
}

async function fetchEntries(): Promise<EntriesResult> {
  const { data: drafts, error } = await supabase
    .from("drafts")
    .select("id, title, user_id, is_anonymous, published_at")
    .eq("status", "published")
    .contains("tags", [COMPETITION.tag])
    .order("published_at", { ascending: true });

  if (error) console.error("Error loading competition entries:", error);

  if (!drafts || drafts.length === 0) {
    return { entries: [], writerNames: {} };
  }

  const { data: likeRows } = await supabase
    .from("likes")
    .select("draft_id")
    .in("draft_id", drafts.map((draft) => draft.id));

  const likeCounts: Record<string, number> = {};
  for (const row of likeRows ?? []) {
    likeCounts[row.draft_id] = (likeCounts[row.draft_id] ?? 0) + 1;
  }

  const authorIds = Array.from(
    new Set(drafts.filter((draft) => !draft.is_anonymous).map((draft) => draft.user_id))
  );

  const writerNames: Record<string, string> = {};

  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds);

    for (const profile of profiles ?? []) {
      writerNames[profile.id] = profile.display_name || "Qalam Writer";
    }
  }

  // Stable sort, so ties keep the earliest-published entry first.
  const entries = drafts
    .map((draft) => ({ ...draft, likes: likeCounts[draft.id] ?? 0 }))
    .sort((a, b) => b.likes - a.likes);

  return { entries, writerNames };
}

export default function CompetitionEntries() {
  const [result, setResult] = useState<EntriesResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchEntries().then((data) => {
      if (!cancelled) setResult(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const loading = result === null;
  const entries = result?.entries ?? [];
  const writerNames = result?.writerNames ?? {};

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[76px] animate-pulse rounded-xl bg-skeleton" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="border-y border-border py-12 text-center">
        <p className="text-ink-400">No entries published yet. Be the first.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry, index) => (
        <li key={entry.id}>
          <Link
            href={`/journal/${entry.id}`}
            className="group flex items-center gap-5 rounded-xl border border-border bg-cream-card px-6 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={`${headingFont} w-6 shrink-0 text-lg text-gold-700`}>
              {index + 1}
            </span>

            <div className="min-w-0 flex-1">
              <h3 className={`${headingFont} truncate text-lg font-medium text-ink-900 group-hover:text-brand-900`}>
                {entry.title || "Untitled"}
              </h3>
              <p className="mt-0.5 text-sm text-ink-600">
                {entry.is_anonymous
                  ? "Anonymous"
                  : writerNames[entry.user_id] ?? "Qalam Writer"}
              </p>
            </div>

            <span className="flex shrink-0 items-center gap-1.5 text-sm text-ink-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-danger-600" fill="currentColor" aria-hidden="true">
                <path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.3 4.5 6 4.5c2.1 0 3.4 1.1 4 2.2.6-1.1 1.9-2.2 4-2.2 3.7 0 5.6 3.9 4 7.2C19.5 16.4 12 21 12 21z" />
              </svg>
              {entry.likes}
              <span className="sr-only">{entry.likes === 1 ? "like" : "likes"}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
