"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../../../../lib/supabase/client";
import { isAdminEmail } from "../../../../lib/admin";
import { useToast } from "../../../../components/ToastProvider";
import AyahLoader from "../../../../components/AyahLoader";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

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
  const { showToast } = useToast();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadDraft();
  }, []);

  async function loadDraft() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isAdminEmail(user?.email)) {
      router.push("/dashboard");
      return;
    }

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

    const { error } = await supabase.rpc("publish_draft", {
      draft_id: draft.id,
    });

    if (error) {
      showToast(error.message, "error");
      return;
    }

    showToast("Article published!", "success");
    router.push("/admin");
  }

  async function reject() {
    if (!draft) return;

    if (!rejectReason.trim()) {
      showToast("Please explain why this is being rejected.", "error");
      return;
    }

    const { error } = await supabase.rpc("reject_draft", {
      draft_id: draft.id,
      reason: rejectReason.trim(),
    });

    if (error) {
      showToast(error.message, "error");
      return;
    }

    showToast("Sent back to the writer with feedback.", "success");
    router.push("/admin");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F1E8]">
        <AyahLoader />
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
        <div className={`${inter.className} mx-auto max-w-4xl px-6 py-20`}>
          Draft not found.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-8">
        <Link
          href="/admin"
          className={`${inter.className} mb-8 inline-block text-sm text-[#81766D] transition hover:text-[#053400]`}
        >
          ← Back to Admin
        </Link>

        <div className="mb-6 flex items-center gap-2">
          <span
            className={`${inter.className} rounded-full bg-[#E9E2D8] px-3 py-1 text-xs uppercase tracking-wide capitalize text-[#42614A]`}
          >
            {draft.type}
          </span>

          <span
            className={`${inter.className} rounded-full bg-[#F5E6C8] px-3 py-1 text-xs text-[#8A6A1E]`}
          >
            {draft.status}
          </span>
        </div>

        <h1
          className={`${poppins.className} mb-4 text-5xl font-medium text-[#053400]`}
        >
          {draft.title}
        </h1>

        {draft.tagline && (
          <p className={`${inter.className} mb-6 text-xl text-[#70655C]`}>
            {draft.tagline}
          </p>
        )}

        {draft.tags && draft.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {draft.tags.map((tag) => (
              <span
                key={tag}
                className={`${inter.className} rounded-full bg-[#E9E2D8] px-3 py-1 text-sm text-[#70655C]`}
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
            className={`${inter.className} rounded-full bg-[#053400] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#0B4D2B]`}
          >
            Publish
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
          <label
            className={`${inter.className} mb-2 block text-sm font-medium text-red-900`}
          >
            Reject with feedback
          </label>

          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain what needs to change before this can be published..."
            rows={4}
            className={`${inter.className} w-full resize-none rounded-lg border border-red-300 bg-white px-4 py-3 text-sm text-[#46382F] outline-none focus:border-red-500`}
          />

          <button
            onClick={reject}
            className={`${inter.className} mt-4 rounded-full border border-red-300 px-6 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100`}
          >
            Reject & Send Feedback
          </button>
        </div>
      </div>
    </main>
  );
}
