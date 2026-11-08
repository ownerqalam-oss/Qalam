import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "../../../lib/supabase/admin";
import { isAdminEmail } from "../../../lib/admin";
import { COMPETITION, hasCompetitionTag } from "../../../lib/competition";
import CopyEmails from "./CopyEmails";

// Admin only: every Change Within entry with the writer's account email and the
// contact they gave. Emails come from auth, so this has to run on the server.
export const dynamic = "force-dynamic";

const headingFont = "font-[family-name:var(--font-heading)]";
const bodyFont = "font-[family-name:var(--font-body)]";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft, not submitted",
  submitted: "Submitted",
  published: "Published",
  rejected: "Returned",
};

export default async function CompetitionEntriesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24">
        <p className={`${bodyFont} text-ink-600`}>This page is for Qalam admins. Log in with an admin account to see it.</p>
      </main>
    );
  }

  const admin = createAdminClient();
  const { data: drafts, error } = await admin
    .from("drafts")
    .select("id, title, status, created_at, submitted_at, user_id, is_anonymous, tags")
    .order("created_at", { ascending: true });

  const entries = (drafts ?? []).filter((d) => hasCompetitionTag(d.tags));
  const userIds = Array.from(new Set(entries.map((e) => e.user_id)));

  const [{ data: profiles }, { data: contacts }, users] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id, display_name").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
    entries.length
      ? admin.from("competition_contacts").select("draft_id, contact").in("draft_id", entries.map((e) => e.id))
      : Promise.resolve({ data: [] as { draft_id: number; contact: string }[] }),
    Promise.all(userIds.map((id) => admin.auth.admin.getUserById(id))),
  ]);

  const emailById = new Map(users.map((r) => [r.data.user?.id, r.data.user?.email ?? ""]));
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const contactById = new Map((contacts ?? []).map((c) => [String(c.draft_id), c.contact]));

  const rows = entries.map((e) => ({
    id: String(e.id),
    title: e.title || "Untitled",
    status: e.status as string,
    date: e.submitted_at ?? e.created_at,
    name: nameById.get(e.user_id) || "No name set",
    anonymous: e.is_anonymous,
    email: emailById.get(e.user_id) ?? "",
    contact: contactById.get(String(e.id)) ?? "",
  }));
  const submitted = rows.filter((r) => r.status !== "draft");
  const allEmails = Array.from(new Set(rows.map((r) => r.email).filter(Boolean)));

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <Link href="/admin" className={`${bodyFont} text-sm text-ink-600 hover:text-brand-900`}>
        Back to the review queue
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={`${headingFont} text-4xl font-medium text-brand-900`}>{COMPETITION.title} entries</h1>
          <p className={`${bodyFont} mt-2 text-sm text-ink-600`}>
            {submitted.length} submitted, {rows.length - submitted.length} still in draft. Entries close {COMPETITION.deadlineLabel}.
          </p>
        </div>
        <CopyEmails emails={allEmails} />
      </div>

      {error && (
        <p className={`${bodyFont} mt-6 text-sm text-danger-600`}>Couldn&rsquo;t load entries: {error.message}</p>
      )}

      {rows.length === 0 ? (
        <p className={`${bodyFont} mt-10 text-ink-600`}>No entries yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-white">
          <table className={`${bodyFont} w-full min-w-[820px] text-left text-sm`}>
            <thead className="bg-cream-card text-xs text-ink-600">
              <tr>
                <th className="px-4 py-3 font-medium">Poem</th>
                <th className="px-4 py-3 font-medium">Writer</th>
                <th className="px-4 py-3 font-medium">Account email</th>
                <th className="px-4 py-3 font-medium">Contact if they win</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <Link href={`/admin/review/${r.id}`} className="font-medium text-brand-900 hover:underline">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-900">
                    {r.name}
                    {r.anonymous && <span className="block text-xs text-ink-400">Publishing anonymously</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.email ? <a href={`mailto:${r.email}`} className="text-ink-900 hover:underline">{r.email}</a> : <span className="text-ink-400">None</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-900">{r.contact || <span className="text-ink-400">Not given</span>}</td>
                  <td className="px-4 py-3 text-ink-600">{STATUS_LABEL[r.status] ?? r.status}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-600">
                    {new Date(r.date).toLocaleDateString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
