"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return <button type="submit" disabled={status.pending} className="w-full rounded-lg bg-black py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60">{status.pending ? pending : idle}</button>;
}
