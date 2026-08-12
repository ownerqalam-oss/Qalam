"use client";

import { useActionState } from "react";
import { setPassword, type AuthActionState } from "../auth/actions";
import { SubmitButton } from "../../components/SubmitButton";

const initialState: AuthActionState = {};

export default function SetPasswordPage() {
  const [state, action] = useActionState(setPassword, initialState);
  return <main className="mx-auto max-w-md px-5 py-16 sm:px-6"><h1 className="text-4xl font-bold">Set your password</h1><p className="mt-3 text-gray-600">Choose a password to finish accepting your Qalam invitation.</p><form action={action} className="mt-8 space-y-5"><div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className="w-full rounded-lg border px-4 py-3" /></div><div><label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required className="w-full rounded-lg border px-4 py-3" /></div>{state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}<SubmitButton idle="Set password" pending="Saving…" /></form></main>;
}
