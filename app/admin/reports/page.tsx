import Link from "next/link";
import { ModerationForm, ReportStateControls } from "../../../components/ModerationForm";
import { createClient } from "../../../lib/supabase/server";
import { reportReasonLabels } from "../../../lib/validation/reports";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const requested = (await searchParams).status;
  const status = ["open", "under_review", "dismissed", "actioned"].includes(requested ?? "") ? requested! : "open";
  const supabase = await createClient();
  const { data: reports, error } = await supabase.from("reports").select("id, target_type, post_id, profile_id, reason, details, status, created_at").eq("status", status).order("created_at", { ascending: false }).limit(100);
  const postIds = (reports ?? []).flatMap((report) => report.post_id ? [report.post_id] : []);
  const profileIds = (reports ?? []).flatMap((report) => report.profile_id ? [report.profile_id] : []);
  const [{ data: posts }, { data: profiles }] = await Promise.all([
    postIds.length ? supabase.from("posts").select("id, title, status").in("id", postIds) : Promise.resolve({ data: [] }),
    profileIds.length ? supabase.from("profiles").select("id, username, display_name, suspended_at").in("id", profileIds) : Promise.resolve({ data: [] }),
  ]);
  const postMap = new Map((posts ?? []).map((post) => [post.id, post]));
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><p className="text-sm font-medium uppercase tracking-[0.25em] text-[#42614A]">Administration</p><h1 className="mt-3 text-4xl font-bold">Reports</h1><nav className="mt-6 flex flex-wrap gap-2" aria-label="Report status">{["open", "under_review", "dismissed", "actioned"].map((value) => <Link key={value} href={`/admin/reports?status=${value}`} className={`rounded-full border px-4 py-2 text-sm capitalize ${status === value ? "bg-[#053400] text-white" : ""}`}>{value.replace("_", " ")}</Link>)}</nav>{error && <p className="mt-8 rounded-lg bg-red-50 p-3 text-red-700">Reports could not be loaded.</p>}<div className="mt-8 space-y-5">{reports?.map((report) => { const post = report.post_id ? postMap.get(report.post_id) : null; const profile = report.profile_id ? profileMap.get(report.profile_id) : null; const targetId = report.post_id ?? report.profile_id!; const targetLabel = post?.title || profile?.display_name || profile?.username || "Unavailable target"; const inactive = post?.status === "removed" || Boolean(profile?.suspended_at); return <article key={report.id} className="rounded-xl border p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-[#42614A]">{report.target_type} report · {reportReasonLabels[report.reason as keyof typeof reportReasonLabels]}</p><h2 className="mt-2 text-xl font-semibold">{targetLabel}</h2><p className="mt-1 text-sm text-gray-500">Submitted {new Date(report.created_at).toLocaleString()}</p>{report.details && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm">{report.details}</p>}</div><span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize">{report.status.replace("_", " ")}</span></div>{["open", "under_review"].includes(report.status) && <div className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2"><ReportStateControls reportId={report.id} /><ModerationForm targetType={report.target_type as "post" | "profile"} targetId={targetId} action={report.target_type === "post" ? inactive ? "restore" : "remove" : inactive ? "reactivate" : "suspend"} reportId={report.id} defaultReason={report.reason as keyof typeof reportReasonLabels} /></div>}</article>; })}{!reports?.length && !error && <p className="rounded-xl border p-8 text-center text-gray-500">No {status.replace("_", " ")} reports.</p>}</div></main>;
}
