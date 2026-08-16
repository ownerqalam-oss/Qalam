"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function WritersPage() {
  const [writers, setWriters] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWriters();
  }, []);

  async function loadWriters() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, bio, avatar_url")
      .order("display_name", { ascending: true });

    if (error) {
      console.error("Error loading writers:", error);
      setLoading(false);
      return;
    }

    if (data) {
      setWriters(data);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <section className="mx-auto max-w-[1180px] px-8 py-16">

        {/* HEADER */}
        <div className="mb-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]">
            THE QALAM COMMUNITY
          </p>

          <h1 className="mt-4 text-5xl font-medium text-[#053400]">
            Writers
          </h1>

          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#70655C]">
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
                className="h-[132px] animate-pulse border border-[#DCD4C9] bg-[#EFE8DC]"
              />
            ))}
          </div>
        ) : writers.length === 0 ? (
          <div className="border-y border-[#DCD4C9] py-12">
            <p className="text-[#81766D]">
              No writers yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {writers.map((writer) => (
              <Link
                key={writer.id}
                href={`/writers/${writer.id}`}
                className="group block rounded-xl border border-[#DCD4C9] bg-[#E9E2D8] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#053400]/30 hover:shadow-md"
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
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#053400] text-lg font-medium text-white">
                      {(writer.display_name || "W")[0].toUpperCase()}
                    </div>
                  )}

                  {/* NAME */}
                  <h2 className="text-xl font-medium text-[#46382F] transition group-hover:text-[#053400]">
                    {writer.display_name || "Qalam Writer"}
                  </h2>

                </div>

                {/* BIO */}
                {writer.bio && (
                  <p className="mt-5 text-sm leading-6 text-[#70655C]">
                    {writer.bio}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

      </section>
    </main>
  );
}
