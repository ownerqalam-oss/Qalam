"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client";

interface Draft {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  tagline: string | null;
  tags: string[] | null;
  created_at: string;
}

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDraft();
  }, []);

  async function loadDraft() {
    const { data, error } = await supabase
      .from("drafts")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setDraft(data);
    }

    setLoading(false);
  }

  async function publish() {
    if (!draft) return;

    const { error } = await supabase
      .from("drafts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", draft.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Article published!");
    router.push("/admin");
  }

  async function reject() {
    if (!draft) return;

    const { error } = await supabase
      .from("drafts")
      .update({
        status: "draft",
      })
      .eq("id", draft.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Returned to draft.");
    router.push("/admin");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20">
        Loading...
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20">
        Draft not found.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/admin"
        className="mb-8 inline-block text-gray-500 hover:text-black"
      >
        ← Back to Admin
      </Link>

      <div className="mb-6 flex items-center gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm capitalize">
          {draft.type}
        </span>

        <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm">
          {draft.status}
        </span>
      </div>

      <h1 className="mb-4 text-5xl font-bold">
        {draft.title}
      </h1>

      {draft.tagline && (
        <p className="mb-6 text-xl text-gray-600">
          {draft.tagline}
        </p>
      )}

      {draft.tags && draft.tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {draft.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <article
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{
          __html: draft.content,
        }}
      />

      <div className="mt-12 flex gap-4">
        <button
          onClick={publish}
          className="rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700"
        >
          Publish
        </button>

        <button
          onClick={reject}
          className="rounded-lg border border-red-300 px-6 py-3 text-red-600 hover:bg-red-50"
        >
          Return to Draft
        </button>
      </div>
    </main>
  );
}
