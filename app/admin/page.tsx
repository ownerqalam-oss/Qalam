"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../../lib/supabase/client";
import { isAdminEmail } from "../../lib/admin";

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
}

export default function AdminPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);

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
    }
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

        <h1
          className={`${poppins.className} mt-3 mb-10 text-4xl font-medium text-[#053400]`}
        >
          Admin Dashboard
        </h1>

        <div className="space-y-4">
          {drafts.map((draft) => (
            <Link
              key={draft.id}
              href={`/admin/review/${draft.id}`}
              className="block rounded-xl border border-[#DCD4C9] bg-white p-6 transition hover:border-[#053400]"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`${inter.className} rounded-full bg-[#E9E2D8] px-3 py-1 text-xs uppercase tracking-wide text-[#42614A]`}
                >
                  {typeLabel(draft.type)}
                </span>

                <span
                  className={`${inter.className} rounded-full bg-[#F5E6C8] px-3 py-1 text-xs text-[#8A6A1E]`}
                >
                  Submitted
                </span>
              </div>

              <h2
                className={`${poppins.className} text-2xl font-medium text-[#46382F]`}
              >
                {draft.title || "Untitled"}
              </h2>

              <p className={`${inter.className} mt-2 text-sm text-[#81766D]`}>
                Click to review →
              </p>
            </Link>
          ))}

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
