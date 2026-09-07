"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";
import { useToast } from "../../components/ToastProvider";
import { Button } from "../../components/ui/Button";

const headingFont = "font-[family-name:var(--font-heading)]";

export default function LoginPage() {
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    // A hard navigation (not router.push) guarantees the auth
    // cookie is actually set before anything reads the session,
    // avoiding the login/signup redirect race.
    window.location.href = "/";
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-cream px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-cream-card p-8">

        <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-brand-600">
          WRITE FOR QALAM
        </p>

        <h1 className={`${headingFont} text-center text-3xl font-semibold text-brand-900`}>
          Welcome Back
        </h1>

        <p className="mt-3 text-center text-sm leading-6 text-ink-600">
          Sign in to continue your writing journey with Qalam.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">

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

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-ink-900">
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-xs font-medium text-brand-900 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-ink-900 outline-none focus:border-brand-900"
            />
          </div>

          <Button type="submit" shape="block" disabled={loading} className="w-full">
            {loading ? "Signing In..." : "Continue Writing"}
          </Button>

        </form>

        <div className="mt-8 border-t border-border pt-6 text-center">

          <p className="text-sm text-ink-400">
            Don't have an account?
          </p>

          <Link
            href="/signup"
            className="mt-2 inline-block text-sm font-medium text-brand-900 hover:underline"
          >
            Create an account →
          </Link>

        </div>

      </div>
    </main>
  );
}
