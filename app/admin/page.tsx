"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";

interface Draft {
  id: string;
  title: string;
  type: string;
  created_at: string;
  submitted_at: string | null;
}

export default function AdminPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
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
        return "📚 Short Story";
      case "poetry":
        return "📜 Poetry";
      case "reflection":
        return "✍️ Reflection";
      default:
        return "📖 Article";
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="mb-10 text-4xl font-bold">
        Admin Dashboard
      </h1>

      <div className="space-y-6">
        {drafts.map((draft) => (
          <Link
            key={draft.id}
            href={`/admin/review/${draft.id}`}
            className="block rounded-xl border p-6 transition hover:border-black hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                    {typeLabel(draft.type)}
                  </span>

                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs">
                    Submitted
                  </span>
                </div>

                <h2 className="text-2xl font-semibold">
                  {draft.title || "Untitled"}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Click to review →
                </p>
              </div>
            </div>
          </Link>
        ))}

        {drafts.length === 0 && (
          <div className="rounded-xl border p-8 text-center text-gray-500">
            No submitted articles.
          </div>
        )}
      </div>
    </main>
  );
}
