"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface Draft {
  id: string;
  title: string;
  created_at: string;
  status: string;
  type: string;
}

export default function DashboardPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("drafts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setDrafts(data);
  }

  async function deleteDraft(id: string) {
    if (!window.confirm("Delete this draft?")) return;

    const { error } = await supabase
      .from("drafts")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setDrafts((current) => current.filter((draft) => draft.id !== id));
  }

  function typeEmoji(type: string) {
    switch (type) {
      case "reflection":
        return "✍️ Reflection";
      case "poetry":
        return "📜 Poetry";
      default:
        return "📖 Article";
        case "story":
      return "📚 Short Story";
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Dashboard</h1>

       <Link
  href="/new"
  className="rounded-lg bg-black px-5 py-3 text-white"
>
  New Draft
</Link>
      </div>

      <div className="mt-10 space-y-4">
        {drafts.map((draft) => (
          <div
            key={draft.id}
            className="flex items-center justify-between rounded-xl border p-5"
          >
            <Link
              href={`/editor?id=${draft.id}`}
              className="flex-1"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                  {typeEmoji(draft.type)}
                </span>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs capitalize text-blue-700">
                  {draft.status}
                </span>
              </div>

              <h3 className="text-xl font-semibold">
                {draft.title || "Untitled"}
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {new Date(draft.created_at).toLocaleDateString()}
              </p>
            </Link>

            <button
              onClick={() => deleteDraft(draft.id)}
              disabled={draft.status === "submitted"}
              className="rounded-lg border border-red-300 px-4 py-2 text-red-600 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
