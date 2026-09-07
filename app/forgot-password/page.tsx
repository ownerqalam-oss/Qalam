"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";
import { useToast } from "../../components/ToastProvider";
import { Button } from "../../components/ui/Button";

const headingFont = "font-[family-name:var(--font-heading)]";

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
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-cream px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-cream-card p-8">

        <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-brand-600">
          WRITE FOR QALAM
        </p>

        <h1 className={`${headingFont} text-center text-3xl font-semibold text-brand-900`}>
          Reset Your Password
        </h1>

        {sent ? (
          <p className="mt-6 text-center text-sm leading-6 text-ink-600">
            If an account exists for <span className="font-medium text-ink-900">{email}</span>,
            we've sent a link to reset your password. Check your inbox.
          </p>
        ) : (
          <>
            <p className="mt-3 text-center text-sm leading-6 text-ink-600">
              Enter your email and we'll send you a link to get back in.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-900">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-border bg-white px-4 py-3 text-ink-900 outline-none focus:border-brand-900"
                />
              </div>

              <Button type="submit" shape="block" disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        )}

        <div className="mt-8 border-t border-border pt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-brand-900 hover:underline"
          >
            ← Back to Login
          </Link>
        </div>

      </div>
    </main>
  );
}
