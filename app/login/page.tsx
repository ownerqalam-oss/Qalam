"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  
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
      alert(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-[#F7F1E8] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#DCD4C9] bg-[#F7F1E8] p-8">

        <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]">
          WRITE FOR QALAM
        </p>

        <h1 className="text-center text-3xl font-semibold text-[#053400]">
          Welcome Back
        </h1>

        <p className="mt-3 text-center text-sm leading-6 text-[#70655C]">
          Sign in to continue your writing journey with Qalam.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">

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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#053400] py-3 font-medium text-white transition hover:bg-[#0B4D2B] disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Continue Writing"}
          </button>

        </form>

        <div className="mt-8 border-t border-[#DCD4C9] pt-6 text-center">

          <p className="text-sm text-[#81766D]">
            Don't have an account?
          </p>

          <Link
            href="/signup"
            className="mt-2 inline-block text-sm font-medium text-[#053400] hover:underline"
          >
            Create an account →
          </Link>

        </div>

      </div>
    </main>
  );
}
