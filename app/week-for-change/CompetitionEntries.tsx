"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";
import { COMPETITION } from "../../lib/competition";
import { estimateReadingTime } from "../../lib/readingTime";
import { getGenreColor } from "../../lib/genreColors";
import CoverImage from "../../components/CoverImage";

const headingFont = "font-[family-name:var(--font-heading)]";
const bodyFont = "font-[family-name:var(--font-body)]";

interface Entry {
  id: string;
  title: string;
  content: string;
  type: string;
  cover_image_url: string | null;
  user_id: string;
  is_anonymous: boolean;
  published_at: string | null;
  likes: number;
}

interface Writer {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface EntriesResult {
  entries: Entry[];
  writers: Record<string, Writer>;
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.099 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

async function fetchEntries(): Promise<EntriesResult> {
  const { data: drafts, error } = await supabase
    .from("drafts")
    .select("id, title, content, type, cover_image_url, user_id, is_anonymous, published_at")
    .eq("status", "published")
    .contains("tags", [COMPETITION.tag])
    .order("published_at", { ascending: true });

  if (error) console.error("Error loading competition entries:", error);

  if (!drafts || drafts.length === 0) {
    return { entries: [], writers: {} };
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

  const writers: Record<string, Writer> = {};

  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds);

    for (const profile of profiles ?? []) {
      writers[profile.id] = profile;
    }
  }

  // Stable sort, so ties keep the earliest-published entry first.
  const entries = drafts
    .map((draft) => ({ ...draft, likes: likeCounts[draft.id] ?? 0 }))
    .sort((a, b) => b.likes - a.likes);

  return { entries, writers };
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

  if (!result) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-skeleton" />
        ))}
      </div>
    );
  }

  if (result.entries.length === 0) {
    return (
      <div className="border border-border py-16 text-center">
        <p className={`${bodyFont} text-sm text-ink-400`}>
          No entries yet. Be the first to write one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {result.entries.map((entry, index) => {
        const writer = entry.is_anonymous ? null : result.writers[entry.user_id];
        const genreColor = getGenreColor(entry.type);

        return (
          <Link
            key={entry.id}
            href={`/journal/${entry.id}`}
            style={{ animationDelay: `${index * 70}ms` }}
            className={`animate-fade-in-up group flex items-start gap-5 rounded-xl border border-border border-t-4 ${genreColor.cardBorder} bg-cream-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <CoverImage
              src={entry.cover_image_url}
              type={entry.type}
              alt={entry.title}
              className="h-20 w-20 shrink-0 rounded-lg sm:h-24 sm:w-24"
            />

            <div className="min-w-0 flex-1">
              <span
                className={`${bodyFont} inline-block rounded-full ${genreColor.badgeBg} px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] ${genreColor.badgeText}`}
              >
                {entry.type === "story" ? "Short Story" : entry.type}
              </span>

              <h3
                className={`${headingFont} mt-2 text-2xl font-medium text-ink-900 transition group-hover:text-brand-900`}
              >
                {entry.title}
              </h3>

              <div className="mt-4 flex items-center gap-2.5">
                {writer?.avatar_url ? (
                  <img
                    src={writer.avatar_url}
                    alt={writer.display_name || "Writer"}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`${headingFont} flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-[11px] font-medium text-white`}
                  >
                    {(writer?.display_name || "Q")[0].toUpperCase()}
                  </div>
                )}

                <span className={`${bodyFont} text-[13px] text-ink-600`}>
                  {writer?.display_name || "Qalam Writer"}
                  <span className="text-gold-600"> · </span>
                  {estimateReadingTime(entry.content)} min read
                  <span className="text-gold-600"> · </span>
                  <span className="inline-flex items-center gap-1 align-middle">
                    <HeartIcon className="h-3 w-3" />
                    {entry.likes}
                  </span>
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
