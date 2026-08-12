"use client";

import { useActionState } from "react";
import { inviteWriter, type InvitationActionState } from "../app/admin/invitations/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: InvitationActionState = {};

export function InvitationForm() {
  const [state, action] = useActionState(inviteWriter, initialState);
  return <form action={action} className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-start"><div className="flex-1"><label htmlFor="invite-email" className="sr-only">Writer email</label><input id="invite-email" name="email" type="email" required placeholder="writer@example.com" className="w-full rounded-lg border px-4 py-3" />{state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}{state.success && <p role="status" className="mt-2 text-sm text-green-700">{state.success}</p>}</div><div className="sm:w-36"><SubmitButton idle="Send invite" pending="Sending…" /></div></form>;
}
