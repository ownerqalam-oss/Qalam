"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import { useToast } from "../../components/ToastProvider";

export default function ResetPasswordPage() {
  const { showToast } = useToast();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast("Passwords don't match.", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    showToast("Password updated. Welcome back.", "success");

    window.location.href = "/dashboard";
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-[#F7F1E8] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#DCD4C9] bg-[#F7F1E8] p-8">

        <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]">
          WRITE FOR QALAM
        </p>

        <h1 className="text-center text-3xl font-semibold text-[#053400]">
          Set a New Password
        </h1>

        {!ready ? (
          <p className="mt-6 text-center text-sm leading-6 text-[#70655C]">
            This link is invalid or has expired. Request a new one from the{" "}
            <a href="/forgot-password" className="font-medium text-[#053400] hover:underline">
              password reset page
            </a>
            .
          </p>
        ) : (
          <>
            <p className="mt-3 text-center text-sm leading-6 text-[#70655C]">
              Choose a new password for your account.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#46382F]">
                  New Password
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

              <div>
                <label className="mb-2 block text-sm font-medium text-[#46382F]">
                  Confirm New Password
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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#053400] py-3 font-medium text-white transition hover:bg-[#0B4D2B] disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}

      </div>
    </main>
  );
}
