"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import InkFlourish from "../../components/InkFlourish";
import { CardLink } from "../../components/ui/Card";

const headingFont = "font-[family-name:var(--font-heading)]";

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function WritersPage() {
  const [writers, setWriters] = useState<Profile[]>([]);
  const [pieceCounts, setPieceCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWriters();
  }, []);

  async function loadWriters() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, bio, avatar_url");

    if (error) {
      console.error("Error loading writers:", error);
      setLoading(false);
      return;
    }

    const { data: publishedDrafts } = await supabase
      .from("drafts")
      .select("user_id")
      .eq("status", "published")
      .eq("is_anonymous", false);

    const counts: Record<string, number> = {};

    if (publishedDrafts) {
      for (const draft of publishedDrafts) {
        counts[draft.user_id] = (counts[draft.user_id] ?? 0) + 1;
      }

      setPieceCounts(counts);
    }

    if (data) {
      /*
       * Most-published-first, so active writers surface ahead of
       * whoever's name happens to start with A. Ties fall back to
       * name so the order stays stable.
       */
      const sorted = [...data].sort((a, b) => {
        const countDiff = (counts[b.id] ?? 0) - (counts[a.id] ?? 0);
        if (countDiff !== 0) return countDiff;
        return (a.display_name ?? "").localeCompare(b.display_name ?? "");
      });

      setWriters(sorted);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-cream text-ink-900">
      <section className="mx-auto max-w-[1180px] px-8 py-16">

        {/* HEADER */}
        <div className="mb-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-600">
            THE QALAM COMMUNITY
          </p>

          <h1 className={`${headingFont} mt-4 text-5xl font-medium text-brand-900`}>
            Writers
          </h1>

          <InkFlourish className="mt-3 w-[90px]" />

          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-ink-600">
            Meet the writers behind the words. Discover their perspectives,
            stories and reflections shared through Qalam.
          </p>
        </div>

        {/* WRITERS */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[132px] animate-pulse border border-border bg-skeleton"
              />
            ))}
          </div>
        ) : writers.length === 0 ? (
          <div className="border-y border-border py-12">
            <p className="text-ink-400">
              No writers yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {writers.map((writer) => (
              <CardLink
                key={writer.id}
                href={`/writers/${writer.id}`}
                className="p-6 hover:border-brand-900/30"
              >
                <div className="flex items-center gap-4">

                  {/* PROFILE PICTURE */}
                  {writer.avatar_url ? (
                    <img
                      src={writer.avatar_url}
                      alt={writer.display_name || "Writer"}
                      className="h-14 w-14 rounded-full object-cover transition group-hover:opacity-90"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-900 text-lg font-medium text-white">
                      {(writer.display_name || "W")[0].toUpperCase()}
                    </div>
                  )}

                  {/* NAME */}
                  <div>
                    <h2 className={`${headingFont} text-xl font-medium text-ink-900 transition group-hover:text-brand-900`}>
                      {writer.display_name || "Qalam Writer"}
                    </h2>

                    <p className="mt-1 text-xs text-ink-600">
                      Written {pieceCounts[writer.id] ?? 0}{" "}
                      {pieceCounts[writer.id] === 1 ? "piece" : "pieces"}
                    </p>
                  </div>

                </div>

                {/* BIO */}
                {writer.bio && (
                  <p className="mt-5 text-sm leading-6 text-ink-600">
                    {writer.bio}
                  </p>
                )}
              </CardLink>
            ))}
          </div>
        )}

      </section>
    </main>
  );
}
