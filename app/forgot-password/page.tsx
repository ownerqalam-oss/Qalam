"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";
import { useToast } from "../../components/ToastProvider";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setSent(true);
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-[#F7F1E8] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#DCD4C9] bg-[#F7F1E8] p-8">

        <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]">
          WRITE FOR QALAM
        </p>

        <h1 className="text-center text-3xl font-semibold text-[#053400]">
          Reset Your Password
        </h1>

        {sent ? (
          <p className="mt-6 text-center text-sm leading-6 text-[#70655C]">
            If an account exists for <span className="font-medium text-[#46382F]">{email}</span>,
            we've sent a link to reset your password. Check your inbox.
          </p>
        ) : (
          <>
            <p className="mt-3 text-center text-sm leading-6 text-[#70655C]">
              Enter your email and we'll send you a link to get back in.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#46382F]">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-[#DCD4C9] bg-white px-4 py-3 text-[#46382F] outline-none focus:border-[#053400]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#053400] py-3 font-medium text-white transition hover:bg-[#0B4D2B] disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        )}

        <div className="mt-8 border-t border-[#DCD4C9] pt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-[#053400] hover:underline"
          >
            ← Back to Login
          </Link>
        </div>

      </div>
    </main>
  );
}
