"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePost, unpublishPost } from "../app/posts/actions";

export function DashboardPostActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function unpublish() {
    setError("");
    startTransition(async () => {
      const result = await unpublishPost(id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Delete this draft permanently?")) return;
    setError("");
    startTransition(async () => {
      const result = await deletePost(id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return <div className="sm:text-right"><div className="flex flex-wrap gap-2 sm:justify-end">{status === "published" && <><Link href={`/journal/${id}`} className="rounded-lg border px-4 py-2 text-sm">View</Link><button type="button" onClick={unpublish} disabled={pending} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-60">{pending ? "Working…" : "Unpublish"}</button></>}{status === "draft" && <button type="button" onClick={remove} disabled={pending} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 disabled:opacity-60">{pending ? "Working…" : "Delete"}</button>}</div>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}
