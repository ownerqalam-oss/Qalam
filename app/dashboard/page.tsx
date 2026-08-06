"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface Draft {
  id: string;
  title: string;
  created_at: string;
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
    const confirmed = window.confirm(
      "Delete this draft? This cannot be undone."
    );

    if (!confirmed) return;

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

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Dashboard</h1>

        <Link
          href="/editor"
          className="rounded-lg bg-black px-5 py-3 text-white"
        >
          New Draft
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="mb-6 text-2xl font-semibold">
          My Drafts
        </h2>

        <div className="space-y-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-center justify-between rounded-xl border p-5"
            >
              <Link
                href={`/editor?id=${draft.id}`}
                className="flex-1"
              >
                <h3 className="text-xl font-semibold">
                  {draft.title || "Untitled"}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {new Date(draft.created_at).toLocaleDateString()}
                </p>
              </Link>

              <button
                onClick={() => deleteDraft(draft.id)}
                className="rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          ))}

          {drafts.length === 0 && (
            <p className="text-gray-500">
              No drafts yet.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
