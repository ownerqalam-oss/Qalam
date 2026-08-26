"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";

export default function FeedbackButton() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"feedback" | "bug">("feedback");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!session) return null;

  function close() {
    setOpen(false);
    setMessage("");
    setType("feedback");
  }

  async function submit() {
    if (!message.trim()) {
      showToast("Please enter a message.", "error");
      return;
    }

    setSending(true);

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message.trim(),
        type,
        pageUrl:
          typeof window !== "undefined" ? window.location.href : pathname,
      }),
    });

    setSending(false);

    if (!response.ok) {
      const { error } = await response.json().catch(() => ({ error: null }));
      showToast(error || "Something went wrong. Please try again.", "error");
      return;
    }

    showToast("Thanks! Your message has been sent.", "success");
    close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-[#053400] px-5 py-3 text-xs font-medium text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#0B4D2B] hover:shadow-xl active:scale-95"
      >
        Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#DCD4C9] bg-[#F7F1E8] p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-medium text-[#053400]">
              Send feedback
            </h2>

            <p className="mt-1 text-sm text-[#70655C]">
              Found a bug, or have an idea? Let us know.
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setType("feedback")}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  type === "feedback"
                    ? "border-[#053400] bg-[#E4EDE6] text-[#2E5138]"
                    : "border-[#DCD4C9] text-[#46382F]"
                }`}
              >
                Feedback
              </button>

              <button
                type="button"
                onClick={() => setType("bug")}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  type === "bug"
                    ? "border-[#053400] bg-[#E4EDE6] text-[#2E5138]"
                    : "border-[#DCD4C9] text-[#46382F]"
                }`}
              >
                Report an issue
              </button>
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                type === "bug"
                  ? "What happened, and what page were you on?"
                  : "What's on your mind?"
              }
              rows={5}
              className="mt-4 w-full resize-none rounded-lg border border-[#DCD4C9] bg-white px-4 py-3 text-sm text-[#46382F] outline-none focus:border-[#053400]"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={close}
                className="rounded-full border border-[#DCD4C9] px-4 py-2 text-sm font-medium text-[#46382F] transition hover:border-[#053400]"
              >
                Cancel
              </button>

              <button
                onClick={submit}
                disabled={sending}
                className="rounded-full bg-[#053400] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#0B4D2B] disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
