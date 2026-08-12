import { createClient } from "../../../lib/supabase/server";
import { reportReasonLabels } from "../../../lib/validation/reports";

const actionLabels: Record<string, string> = { remove_post: "Removed post", restore_post: "Restored post", suspend_profile: "Suspended profile", reactivate_profile: "Reactivated profile", dismiss_report: "Dismissed report", start_review: "Started report review" };

export default async function ModerationLogPage() {
  const supabase = await createClient();
  const { data: actions, error } = await supabase.from("moderation_actions").select("id, administrator_id, report_id, target_type, post_id, profile_id, action, reason, note, created_at").order("created_at", { ascending: false }).limit(200);
  const adminIds = [...new Set((actions ?? []).map((action) => action.administrator_id))];
  const postIds = [...new Set((actions ?? []).flatMap((action) => action.post_id ? [action.post_id] : []))];
  const profileIds = [...new Set((actions ?? []).flatMap((action) => action.profile_id ? [action.profile_id] : []))];
  const [{ data: admins }, { data: posts }, { data: profiles }] = await Promise.all([
    adminIds.length ? supabase.from("profiles").select("id, username, display_name").in("id", adminIds) : Promise.resolve({ data: [] }),
    postIds.length ? supabase.from("posts").select("id, title").in("id", postIds) : Promise.resolve({ data: [] }),
    profileIds.length ? supabase.from("profiles").select("id, username, display_name").in("id", profileIds) : Promise.resolve({ data: [] }),
  ]);
  const adminMap = new Map((admins ?? []).map((profile) => [profile.id, profile.display_name ?? profile.username ?? profile.id]));
  const postMap = new Map((posts ?? []).map((post) => [post.id, post.title || "Untitled post"]));
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name ?? profile.username ?? "Unavailable profile"]));
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><p className="text-sm font-medium uppercase tracking-[0.25em] text-[#42614A]">Administration</p><h1 className="mt-3 text-4xl font-bold">Moderation Log</h1><p className="mt-3 text-gray-600">Immutable records of report decisions and moderation changes.</p>{error && <p className="mt-8 rounded-lg bg-red-50 p-3 text-red-700">The moderation log could not be loaded.</p>}<ol className="mt-10 space-y-4">{actions?.map((action) => { const target = action.post_id ? postMap.get(action.post_id) : action.profile_id ? profileMap.get(action.profile_id) : "Report"; return <li key={action.id} className="rounded-xl border p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{actionLabels[action.action] ?? action.action}: {target ?? "Unavailable target"}</h2><p className="mt-1 text-sm text-gray-500">By {adminMap.get(action.administrator_id) ?? action.administrator_id} · {new Date(action.created_at).toLocaleString()}</p></div><span className="rounded-full bg-gray-100 px-3 py-1 text-xs">{reportReasonLabels[action.reason as keyof typeof reportReasonLabels] ?? action.reason}</span></div>{action.note && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm">{action.note}</p>}{action.report_id && <p className="mt-3 text-xs text-gray-500">Report {action.report_id}</p>}</li>; })}{!actions?.length && !error && <li className="rounded-xl border p-8 text-center text-gray-500">No moderation actions yet.</li>}</ol></main>;
}
