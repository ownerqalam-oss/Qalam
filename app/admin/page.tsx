"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../../lib/supabase/client";
import { isAdminEmail } from "../../lib/admin";
import { getGenreColor } from "../../lib/genreColors";
import InkFlourish from "../../components/InkFlourish";
import CoverImage from "../../components/CoverImage";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

interface Draft {
  id: string;
  title: string;
  type: string;
  created_at: string;
  submitted_at: string | null;
  user_id: string;
  is_anonymous: boolean;
  cover_image_url: string | null;
}

interface Writer {
  id: string;
  display_name: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isAdminEmail(user?.email)) {
      router.push("/dashboard");
      return;
    }

    const { data, error } = await supabase
      .from("drafts")
      .select("*")
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true });

    if (!error && data) {
      setDrafts(data);

      const authorIds = Array.from(new Set(data.map((draft) => draft.user_id)));

      if (authorIds.length > 0) {
        const { data: writerData } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", authorIds);

        if (writerData) {
          setWriters(writerData);
        }
      }
    }
  }

  function getWriter(userId: string) {
    return writers.find((writer) => writer.id === userId);
  }

  function typeLabel(type: string) {
    switch (type) {
      case "story":
        return "Short Story";
      case "poetry":
        return "Poetry";
      case "reflection":
        return "Reflection";
      default:
        return "Article";
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <div className="mx-auto max-w-5xl px-6 py-12 md:px-8">

        <p
          className={`${inter.className} text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]`}
        >
          REVIEW QUEUE
        </p>

        <div className="flex items-center justify-between">
          <h1
            className={`${poppins.className} mt-3 text-4xl font-medium text-[#053400]`}
          >
            Admin Dashboard
          </h1>

          <Link
            href="/admin/collections"
            className={`${inter.className} text-sm font-medium text-[#053400] hover:underline`}
          >
            Manage Collections →
          </Link>
        </div>

        <InkFlourish className="mb-10 mt-2 w-[90px]" />

        <div className="space-y-4">
          {drafts.map((draft, index) => {
            const genreColor = getGenreColor(draft.type);
            const writer = getWriter(draft.user_id);

            return (
            <Link
              key={draft.id}
              href={`/admin/review/${draft.id}`}
              style={{ animationDelay: `${index * 70}ms` }}
              className={`animate-fade-in-up flex items-start gap-5 rounded-xl border border-[#DCD4C9] border-t-4 ${genreColor.cardBorder} bg-[#E9E2D8] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
            >
              <CoverImage
                src={draft.cover_image_url}
                type={draft.type}
                alt={draft.title}
                className="h-20 w-20 shrink-0 rounded-lg"
              />

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`${inter.className} rounded-full ${genreColor.badgeBg} px-3 py-1 text-xs uppercase tracking-wide ${genreColor.badgeText}`}
                  >
                    {typeLabel(draft.type)}
                  </span>

                  <span
                    className={`${inter.className} rounded-full bg-[#F5E6C8] px-3 py-1 text-xs text-[#8A6A1E]`}
                  >
                    Submitted
                  </span>

                  {draft.is_anonymous && (
                    <span
                      className={`${inter.className} rounded-full bg-[#E4EDE6] px-3 py-1 text-xs text-[#2E5138]`}
                    >
                      Anonymous to readers
                    </span>
                  )}
                </div>

                <h2
                  className={`${poppins.className} text-2xl font-medium text-[#46382F]`}
                >
                  {draft.title || "Untitled"}
                </h2>

                <p className={`${inter.className} mt-1 text-sm text-[#81766D]`}>
                  {writer?.display_name || "Qalam Writer"}
                </p>

                <p className={`${inter.className} mt-2 text-sm text-[#81766D]`}>
                  Click to review →
                </p>
              </div>
            </Link>
            );
          })}

          {drafts.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#DCD4C9] p-10 text-center">
              <p className={`${inter.className} text-[#70655C]`}>
                No submitted articles.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
