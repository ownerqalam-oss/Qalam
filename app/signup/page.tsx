"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";

const INVITE_CODE = "QALAM2026";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (inviteCode.trim().toUpperCase() !== INVITE_CODE) {
      alert("Invalid invitation code.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    if (!data.user) {
      setLoading(false);
      alert("Account could not be created.");
      return;
    }

    setLoading(false);

    alert(
      "Account created successfully! Please check your email to verify your account."
    );

    router.push("/login");
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-[#F7F1E8] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#DCD4C9] bg-[#F7F1E8] p-8">

        <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]">
          JOIN QALAM
        </p>

        <h1 className="text-center text-3xl font-semibold text-[#053400]">
          Create an Account
        </h1>

        <p className="mt-3 text-center text-sm leading-6 text-[#70655C]">
          Create your account and become part of the Qalam writing community.
        </p>

        <form onSubmit={handleSignup} className="mt-8 space-y-5">

          {/* EMAIL */}
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

          {/* PASSWORD */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#46382F]">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-[#DCD4C9] bg-white px-4 py-3 text-[#46382F] outline-none focus:border-[#053400]"
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#46382F]">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-[#DCD4C9] bg-white px-4 py-3 text-[#46382F] outline-none focus:border-[#053400]"
            />
          </div>

          {/* INVITE */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#46382F]">
              Invitation Code
            </label>

            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter your invitation code"
              required
              className="w-full rounded-lg border border-[#DCD4C9] bg-white px-4 py-3 uppercase text-[#46382F] outline-none focus:border-[#053400]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#053400] py-3 font-medium text-white transition hover:bg-[#0B4D2B] disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        <div className="mt-8 border-t border-[#DCD4C9] pt-6 text-center">

          <p className="text-sm text-[#81766D]">
            Already have an account?
          </p>

          <Link
            href="/login"
            className="mt-2 inline-block text-sm font-medium text-[#053400] hover:underline"
          >
            Sign in →
          </Link>

        </div>

      </div>
    </main>
  );
}
