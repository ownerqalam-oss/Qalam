"use client";

import { useState, useTransition } from "react";
import { submitReport } from "../app/reports/actions";
import { reportReasonLabels } from "../lib/validation/reports";
import { useAuth } from "./AuthProvider";

export function ReportButton({ targetType, targetId, label = "Report" }: { targetType: "post" | "profile"; targetId: string; label?: string }) {
  const { authenticated, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<keyof typeof reportReasonLabels>("spam");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  if (loading || !authenticated) return null;

  function submit() {
    setMessage("");
    startTransition(async () => {
      const result = await submitReport({ targetType, targetId, reason, details });
      if (!result.ok) return setMessage(result.error);
      setMessage("Report submitted. Thank you.");
      setDetails("");
      setTimeout(() => setOpen(false), 1000);
    });
  }

  return <div className="relative"><button type="button" onClick={() => { setOpen((value) => !value); setMessage(""); }} className="text-sm text-gray-500 hover:text-red-700">{label}</button>{open && <div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-[#FFFDF9] p-4 text-left shadow-lg"><label className="block text-sm font-medium">Reason<select value={reason} onChange={(event) => setReason(event.target.value as keyof typeof reportReasonLabels)} className="mt-1 block w-full rounded-lg border bg-white px-3 py-2">{Object.entries(reportReasonLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label><label className="mt-3 block text-sm font-medium">Details {reason !== "other" && <span className="font-normal text-gray-500">(optional)</span>}<textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1000} rows={4} className="mt-1 block w-full rounded-lg border bg-white px-3 py-2" /></label>{message && <p role="status" className={`mt-3 text-sm ${message.startsWith("Report submitted") ? "text-green-700" : "text-red-700"}`}>{message}</p>}<div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-2 text-sm">Cancel</button><button type="button" onClick={submit} disabled={pending} className="rounded-lg bg-[#053400] px-3 py-2 text-sm text-white disabled:opacity-60">{pending ? "Submitting…" : "Submit report"}</button></div></div>}</div>;
}
