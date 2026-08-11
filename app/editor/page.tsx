"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import RichTextEditor from "../../components/RichTextEditor";

export default function EditorPage() {
  const searchParams = useSearchParams();

  const initialId = searchParams.get("id");
  const initialType = searchParams.get("type") ?? "article";

  const [draftId, setDraftId] = useState<string | null>(initialId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState(initialType);
  const [tags, setTags] = useState("");

  const [status, setStatus] = useState("Saved");
  const [draftStatus, setDraftStatus] = useState("draft");

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
        setType(data.type ?? "article");
        setTags(data.tags?.join(", ") ?? "");
        setDraftStatus(data.status ?? "draft");
      }

      setLoading(false);
    }

    loadDraft();
  }, [draftId]);

  async function saveDraft() {
    if (draftStatus === "submitted") return;

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
            type,
         tags: tags
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean),
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId);

      if (!error) setStatus("Saved");

      return;
    }

    const { data, error } = await supabase
      .from("drafts")
      .insert({
        user_id: user.id,
        title,
        content,
        type,
        tags: tags
            .split(",")
            .map(tag => tag.trim())
            .filter(Boolean),
        })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setDraftId(data.id);

    window.history.replaceState(
      {},
      "",
      `/editor?id=${data.id}`
    );

    setStatus("Saved");
  }

  async function submitForReview() {
    if (!draftId) {
      alert("Please save your draft first.");
      return;
    }

    const { error } = await supabase
      .from("drafts")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", draftId);

    if (error) {
      alert(error.message);
      return;
    }

    setDraftStatus("submitted");
    alert("Submitted for review!");
  }

  useEffect(() => {
    if (loading) return;

    if (draftStatus === "submitted") return;

    if (!title.trim() && !content.trim()) return;

    setStatus("Typing...");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [title, content, , tags]);

  return (
    <main className="mx-auto max-w-4xl px-8 py-12">
      <div className="mb-10 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize">
            {draftStatus}
          </span>

          <span className="text-sm text-gray-500">
            {status}
          </span>

          <button
            onClick={saveDraft}
            disabled={draftStatus === "submitted"}
            className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50"
          >
            Save
          </button>

          <button
            onClick={submitForReview}
            disabled={!draftId || draftStatus === "submitted"}
            className="rounded-lg bg-green-600 px-5 py-2 text-white disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>

      <select
        value={type}
        disabled={draftStatus === "submitted"}
        onChange={(e) => setType(e.target.value)}
        className="mb-6 rounded-lg border px-4 py-2"
      >
        <option value="article">📖 Article</option>
        <option value="reflection">✍️ Reflection</option>
        <option value="poetry">📜 Poetry</option>
        <option value="story">📚 Short Story</option>
      </select>
        <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        disabled={draftStatus === "submitted"}
        placeholder="Tags (e.g. History, Palestine, Seerah)"
        className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-black"
        />
      <input
        value={title}
        disabled={draftStatus === "submitted"}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        className="mb-10 w-full border-none bg-transparent text-6xl font-bold outline-none"
      />

      {draftStatus === "submitted" ? (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-6 text-yellow-800">
          This article has been submitted for review and can no longer be edited.
        </div>
      ) : (
        <RichTextEditor
          value={content}
          onChange={setContent}
        />
      )}
    </main>
  );
}
