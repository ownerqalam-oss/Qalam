"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import RichTextEditor from "../../components/RichTextEditor";
import { publishPost, savePost, unpublishPost } from "../posts/actions";
import { supabase } from "../../lib/supabase/client";
import { writingTypeSchema } from "../../lib/validation/posts";

type SaveState = "unsaved" | "saving" | "saved" | "failed" | "conflict";
type Snapshot = { id: string | null; title: string; tagline: string; contentHtml: string; type: string; tags: string[]; expectedUpdatedAt: string | null };

function EditorContent() {
  const searchParams = useSearchParams();
  const initialPostId = searchParams.get("id");
  const [postId, setPostId] = useState<string | null>(initialPostId);
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [type, setType] = useState(writingTypeSchema.catch("article").parse(searchParams.get("type")));
  const [tags, setTags] = useState("");
  const [postStatus, setPostStatus] = useState("draft");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const updatedAtRef = useRef<string | null>(null);
  const postIdRef = useRef(postId);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const snapshotRef = useRef<Snapshot>({ id: postId, title, tagline, contentHtml, type, tags: [], expectedUpdatedAt: null });

  useEffect(() => {
    postIdRef.current = postId;
    snapshotRef.current = {
      id: postId,
      title,
      tagline,
      contentHtml,
      type,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      expectedUpdatedAt: updatedAtRef.current,
    };
  }, [contentHtml, postId, tagline, tags, title, type]);

  useEffect(() => {
    async function loadPost() {
      if (!initialPostId) { setLoading(false); return; }
      const { data, error } = await supabase.from("posts").select("*").eq("id", initialPostId).single();
      if (error || !data) { setMessage("This post is unavailable."); setLoading(false); return; }
      setTitle(data.title);
      setTagline(data.tagline ?? "");
      setContentHtml(data.content_html);
      setType(writingTypeSchema.catch("article").parse(data.type));
      setTags(data.tags?.join(", ") ?? "");
      setPostStatus(data.status);
      updatedAtRef.current = data.updated_at;
      setLoading(false);
    }
    void loadPost();
  }, [initialPostId]);

  const persistChanges = useCallback(() => {
    if (savePromiseRef.current) return savePromiseRef.current;
    const operation = (async () => {
      while (savedRevisionRef.current < revisionRef.current) {
        const revision = revisionRef.current;
        const snapshot = { ...snapshotRef.current, id: postIdRef.current, expectedUpdatedAt: updatedAtRef.current };
        setSaveState("saving");
        const result = await savePost(snapshot);
        if (!result.ok) {
          setSaveState(result.conflict ? "conflict" : "failed");
          setMessage(result.error);
          return false;
        }
        if (!postIdRef.current) {
          postIdRef.current = result.post.id;
          setPostId(result.post.id);
          window.history.replaceState({}, "", `/editor?id=${result.post.id}`);
        }
        updatedAtRef.current = result.post.updatedAt;
        savedRevisionRef.current = revision;
      }
      setSaveState("saved");
      setMessage(null);
      return true;
    })();
    savePromiseRef.current = operation.finally(() => { savePromiseRef.current = null; });
    return savePromiseRef.current;
  }, []);

  useEffect(() => {
    if (loading || postStatus !== "draft" || revisionRef.current === savedRevisionRef.current) return;
    const timeout = setTimeout(() => { void persistChanges(); }, 1500);
    return () => clearTimeout(timeout);
  }, [contentHtml, loading, persistChanges, postStatus, tagline, tags, title, type]);

  function markChanged() {
    revisionRef.current += 1;
    setSaveState("unsaved");
    setMessage(null);
  }

  async function handlePublish() {
    if (!(await persistChanges()) || !postIdRef.current) return;
    const result = await publishPost(postIdRef.current);
    if (result.error) return setMessage(result.error);
    setPostStatus("published");
    setSaveState("saved");
    setMessage("Published successfully.");
  }

  async function handleUnpublish() {
    if (!postIdRef.current) return;
    const result = await unpublishPost(postIdRef.current);
    if (result.error) return setMessage(result.error);
    setPostStatus("draft");
    setMessage("Moved back to drafts.");
  }

  const editable = postStatus === "draft";
  const saveLabels: Record<SaveState, string> = { unsaved: "Unsaved", saving: "Saving…", saved: "Saved", failed: "Save failed", conflict: "Reload required" };

  if (loading) return <main className="mx-auto max-w-4xl px-8 py-12 text-gray-500">Loading editor…</main>;
  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-black">← Dashboard</Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize">{postStatus}</span>
          <span aria-live="polite" className={`text-sm ${saveState === "failed" || saveState === "conflict" ? "text-red-700" : "text-gray-500"}`}>{saveLabels[saveState]}</span>
          {editable ? <><button onClick={() => void persistChanges()} disabled={saveState === "saving" || saveState === "conflict"} className="rounded-lg border px-5 py-2 disabled:opacity-50">Save</button><button onClick={() => void handlePublish()} disabled={saveState === "saving" || saveState === "conflict"} className="rounded-lg bg-green-700 px-5 py-2 text-white disabled:opacity-50">Publish</button></> : postStatus === "published" ? <button onClick={() => void handleUnpublish()} className="rounded-lg border px-5 py-2">Unpublish to edit</button> : null}
        </div>
      </div>
      {message && <p role="status" className="mb-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <select value={type} disabled={!editable} onChange={(event) => { setType(writingTypeSchema.parse(event.target.value)); markChanged(); }} className="rounded-lg border px-4 py-2"><option value="article">Article</option><option value="reflection">Reflection</option><option value="poetry">Poetry</option><option value="story">Short Story</option></select>
        <input value={tags} onChange={(event) => { setTags(event.target.value); markChanged(); }} disabled={!editable} placeholder="Tags (e.g. History, Palestine, Seerah)" className="w-full rounded-lg border px-4 py-2" />
      </div>
      <input value={title} disabled={!editable} onChange={(event) => { setTitle(event.target.value); markChanged(); }} placeholder="Untitled" maxLength={200} className="mt-8 w-full border-none bg-transparent text-4xl font-bold outline-none sm:text-6xl" />
      <input value={tagline} disabled={!editable} onChange={(event) => { setTagline(event.target.value); markChanged(); }} placeholder="A short introduction (optional)" maxLength={300} className="mb-10 mt-4 w-full border-none bg-transparent text-xl text-gray-600 outline-none" />
      {editable ? <RichTextEditor value={contentHtml} onChange={(value) => { setContentHtml(value); markChanged(); }} /> : <div className="rounded-2xl border bg-gray-50 p-8 text-center"><p className="text-gray-600">Published posts are read-only. Unpublish this post to edit it.</p>{postId && <Link href={`/journal/${postId}`} className="mt-4 inline-block font-medium text-[#053400] hover:underline">View published post</Link>}</div>}
    </main>
  );
}

export default function EditorPage() {
  return <Suspense fallback={<main className="mx-auto max-w-4xl px-8 py-12 text-gray-500">Loading editor…</main>}><EditorContent /></Suspense>;
}
