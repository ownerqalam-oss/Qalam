"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Draft {
  id: string;
  title: string;
  status: string;
  created_at: string;
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

  async function approve(id: string) {
    const { error } = await supabase
      .from("drafts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadDrafts();
  }

  async function reject(id: string) {
    const { error } = await supabase
      .from("drafts")
      .update({
        status: "draft",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadDrafts();
  }

  return (
    <main className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="mb-10 text-4xl font-bold">
        Admin Dashboard
      </h1>

      <div className="space-y-6">
        {drafts.map((draft) => (
          <div
            key={draft.id}
            className="flex items-center justify-between rounded-xl border p-6"
          >
            <div>
              <h2 className="text-xl font-semibold">
                {draft.title || "Untitled"}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Submitted for review
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => approve(draft.id)}
                className="rounded-lg bg-green-600 px-5 py-2 text-white"
              >
                Approve
              </button>

              <button
                onClick={() => reject(draft.id)}
                className="rounded-lg bg-red-600 px-5 py-2 text-white"
              >
                Reject
              </button>
            </div>
          </div>
        ))}

        {drafts.length === 0 && (
          <p className="text-gray-500">
            No submitted articles.
          </p>
        )}
      </div>
    </main>
  );
}
