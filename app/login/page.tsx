"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login, loginAsTestWriter, type AuthActionState } from "../auth/actions";
import { SubmitButton } from "../../components/SubmitButton";

const initialState: AuthActionState = {};

function LoginContent() {
  const [state, action] = useActionState(login, initialState);
  const message = useSearchParams().get("message");
  const notice = message === "session-expired"
    ? "Your session expired. Sign in again to continue."
    : message === "invalid-link"
      ? "That invitation link is invalid or expired. Ask for a new invite."
      : null;
  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-12 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-2 text-center text-sm uppercase tracking-[0.25em] text-gray-500">Write for Qalam</p>
        <h1 className="text-center text-3xl font-bold">Welcome Back</h1>
        <p className="mt-3 text-center text-gray-600">Qalam is invite-only. Sign in to continue writing.</p>
        {notice && <p role="status" className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{notice}</p>}
        <form action={action} className="mt-8 space-y-5">
          <div><label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label><input id="email" name="email" type="email" autoComplete="email" required className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black" /></div>
          <div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black" /></div>
          {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
          <SubmitButton idle="Continue Writing" pending="Signing in…" />
        </form>
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-6 border-t pt-6">
            <form action={loginAsTestWriter}>
              <button type="submit" className="w-full rounded-lg border border-dashed border-amber-500 bg-amber-50 py-3 text-sm font-medium text-amber-900 hover:bg-amber-100">
                Continue as test writer
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-gray-500">Development only · protected UI access · database writes disabled</p>
          </div>
        )}
        <div className="mt-8 border-t pt-6 text-center"><p className="text-sm text-gray-500">Don&apos;t have an invite yet?</p><p className="mt-2 text-sm text-gray-600">Enjoy reading the Journal while we gradually open Qalam to new contributors.</p></div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="px-6 py-20 text-center text-gray-500">Loading sign in…</main>}><LoginContent /></Suspense>;
}
