"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import RichTextEditor from "../../components/RichTextEditor";

export default function EditorPage() {
  const searchParams = useSearchParams();

  const [draftId, setDraftId] = useState<string | null>(
    searchParams.get("id")
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Saved");

  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadDraft() {
      if (!draftId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("drafts")
        .select("*")
        .eq("id", draftId)
        .single();

      if (data) {
        setTitle(data.title ?? "");
        setContent(data.content ?? "");
      }

      setLoading(false);
    }

    loadDraft();
  }, [draftId]);

  async function saveDraft() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setStatus("Saving...");

    if (draftId) {
      const { error } = await supabase
        .from("drafts")
        .update({
          title,
          content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId);

      if (!error) {
        setStatus("Saved");
      }

      return;
    }

    const { data, error } = await supabase
      .from("drafts")
      .insert({
        user_id: user.id,
        title,
        content,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setDraftId(data.id);
    window.history.replaceState({}, "", `/editor?id=${data.id}`);

    setStatus("Saved");
  }

  useEffect(() => {
    if (loading) return;

    if (!title.trim() && !content.trim()) return;

    setStatus("Typing...");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [title, content]);

  return (
    <main className="mx-auto max-w-4xl px-8 py-12">
      <div className="mb-10 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Dashboard
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{status}</span>

          <button
            onClick={saveDraft}
            className="rounded-lg bg-black px-5 py-2 text-white"
          >
            Save Now
          </button>
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        className="mb-10 w-full border-none bg-transparent text-6xl font-bold outline-none placeholder:text-gray-300"
      />

      <RichTextEditor value={content} onChange={setContent} />
    </main>
  );
}
