"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
  e.preventDefault();

  console.log("Login clicked");

  setLoading(true);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("Data:", data);
  console.log("Error:", error);

  setLoading(false);

  if (error) {
    alert(error.message);
    return;
  }

  console.log("Success!");

  router.push("/dashboard");
}
  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-center text-sm uppercase tracking-[0.25em] text-gray-500">
          Write for Qalam
        </p>

        <h1 className="text-center text-3xl font-bold">
          Welcome Back
        </h1>

        <p className="mt-3 text-center text-gray-600">
          Qalam is currently invite-only for writers. Sign in to continue
          writing.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Password
            </label>

            <input
                type="password"
            value={password}
             onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
             className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-black py-3 font-medium text-white transition hover:opacity-90"
          >
            {loading ? "Signing In..." : "Continue Writing"}
          </button>
        </form>

        <div className="mt-8 border-t pt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't have an invite yet?
          </p>

          <p className="mt-2 text-sm text-gray-600">
            Enjoy reading the Journal while we gradually open Qalam to new
            contributors.
          </p>
        </div>
      </div>
    </main>
  );
}

