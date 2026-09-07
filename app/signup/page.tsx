"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { useToast } from "../../components/ToastProvider";
import { Button } from "../../components/ui/Button";

const headingFont = "font-[family-name:var(--font-heading)]";

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      showToast(error.message, "error");
      return;
    }

    if (!data.user) {
      setLoading(false);
      showToast("Account could not be created.", "error");
      return;
    }

    setLoading(false);

    if (data.session) {
      // Email confirmation is off, so signUp() already returned an
      // active session - no need to send them to login. A hard
      // navigation (not router.push) so the request definitely
      // carries the freshly-set auth cookie past the middleware
      // check on /complete-profile.
      window.location.href = "/complete-profile";
      return;
    }

    showToast(
      "Account created! Please check your email to verify your account.",
      "success"
    );

    router.push("/login");
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-cream px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-cream-card p-8">

        <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-brand-600">
          JOIN QALAM
        </p>

        <h1 className={`${headingFont} text-center text-3xl font-semibold text-brand-900`}>
          Create an Account
        </h1>

        <p className="mt-3 text-center text-sm leading-6 text-ink-600">
          Create your account and become part of the Qalam writing community.
        </p>

        <form onSubmit={handleSignup} className="mt-8 space-y-5">

          {/* EMAIL */}
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

          {/* PASSWORD */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-900">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-ink-900 outline-none focus:border-brand-900"
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-900">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-ink-900 outline-none focus:border-brand-900"
            />
          </div>

          <Button type="submit" shape="block" disabled={loading} className="w-full">
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

        </form>

        <div className="mt-8 border-t border-border pt-6 text-center">

          <p className="text-sm text-ink-400">
            Already have an account?
          </p>

          <Link
            href="/login"
            className="mt-2 inline-block text-sm font-medium text-brand-900 hover:underline"
          >
            Sign in →
          </Link>

        </div>

      </div>
    </main>
  );
}
