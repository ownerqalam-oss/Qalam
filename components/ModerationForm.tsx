"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moderateTarget, updateReportState } from "../app/admin/moderation-actions";
import { reportReasonLabels } from "../lib/validation/reports";

type Action = "remove" | "restore" | "suspend" | "reactivate";

export function ModerationForm({ targetType, targetId, action, reportId = null, defaultReason = "other" }: { targetType: "post" | "profile"; targetId: string; action: Action; reportId?: string | null; defaultReason?: keyof typeof reportReasonLabels }) {
  const router = useRouter();
  const [reason, setReason] = useState<keyof typeof reportReasonLabels>(defaultReason);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return <div className="space-y-2"><select aria-label="Moderation reason" value={reason} onChange={(event) => setReason(event.target.value as keyof typeof reportReasonLabels)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm">{Object.entries(reportReasonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input aria-label="Moderation note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Optional internal note" className="w-full rounded-lg border bg-white px-3 py-2 text-sm" /><button type="button" disabled={pending} onClick={() => startTransition(async () => { setError(""); const result = await moderateTarget({ targetType, targetId, action, reportId, reason, note }); if (!result.ok) setError(result.error); else router.refresh(); })} className={`w-full rounded-lg border px-4 py-2 text-sm disabled:opacity-60 ${action === "remove" || action === "suspend" ? "border-red-300 text-red-700" : "border-green-300 text-green-700"}`}>{pending ? "Working…" : action[0].toUpperCase() + action.slice(1)}</button>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div>;
}

export function ReportStateControls({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function update(status: "under_review" | "dismissed") { startTransition(async () => { setError(""); const result = await updateReportState({ reportId, status, note }); if (!result.ok) setError(result.error); else router.refresh(); }); }
  return <div className="space-y-2"><input aria-label="Report review note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Optional internal note" className="w-full rounded-lg border bg-white px-3 py-2 text-sm" /><div className="flex gap-2"><button type="button" disabled={pending} onClick={() => update("under_review")} className="flex-1 rounded-lg border px-3 py-2 text-sm">Review</button><button type="button" disabled={pending} onClick={() => update("dismissed")} className="flex-1 rounded-lg border px-3 py-2 text-sm">Dismiss</button></div>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div>;
}
