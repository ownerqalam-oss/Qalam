import Link from "next/link";
import { DashboardPostActions } from "../../components/DashboardPostActions";
import { requireOnboardedUser } from "../../lib/auth";
import { createClient } from "../../lib/supabase/server";
import { dashboardAnalyticsSchema, type DashboardAnalytics } from "../../lib/validation/analytics";

interface Post { id: string; title: string; updated_at: string; published_at: string | null; status: string; type: string }
const typeLabels: Record<string, string> = { article: "Article", reflection: "Reflection", poetry: "Poetry", story: "Short Story" };
const emptyAnalytics: DashboardAnalytics = { summary: { publishedPosts: 0, totalViews: 0, totalSaves: 0, currentFollowers: 0 }, postMetrics: {}, followerGrowth: [] };

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  if ("isDevelopmentBypass" in user) return <Dashboard posts={[]} analytics={emptyAnalytics} notice="Analytics are unavailable for the local test writer." />;

  const supabase = await createClient();
  const [{ data: posts, error: postsError }, { data: rawAnalytics, error: analyticsError }] = await Promise.all([
    supabase.from("posts").select("id, title, updated_at, published_at, status, type").eq("author_id", user.id).order("updated_at", { ascending: false }),
    supabase.rpc("get_author_dashboard_analytics"),
  ]);
  const parsedAnalytics = dashboardAnalyticsSchema.safeParse(rawAnalytics);
  const notice = postsError ? "Your posts could not be loaded." : analyticsError || !parsedAnalytics.success ? "Analytics are unavailable. Apply the Phase 5 migration and check the server configuration." : null;
  return <Dashboard posts={(posts ?? []) as Post[]} analytics={parsedAnalytics.success ? parsedAnalytics.data : emptyAnalytics} notice={notice} />;
}

function Dashboard({ posts, analytics, notice }: { posts: Post[]; analytics: DashboardAnalytics; notice: string | null }) {
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-4xl font-bold">Dashboard</h1><p className="mt-2 text-gray-600">Manage your writing and understand its reach.</p></div><Link href="/new" className="rounded-lg bg-black px-5 py-3 text-white">New Post</Link></div>{notice && <p role="status" className="mt-8 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{notice}</p>}<section aria-labelledby="summary-heading" className="mt-10"><h2 id="summary-heading" className="text-2xl font-bold">Overview</h2><dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Published posts", analytics.summary.publishedPosts], ["Total views", analytics.summary.totalViews], ["Total saves", analytics.summary.totalSaves], ["Followers", analytics.summary.currentFollowers]].map(([label, value]) => <div key={label} className="rounded-xl border bg-white/50 p-5"><dt className="text-sm text-gray-600">{label}</dt><dd className="mt-2 text-3xl font-bold text-[#053400]">{value}</dd></div>)}</dl></section><FollowerGrowth points={analytics.followerGrowth} /><section aria-labelledby="writing-heading" className="mt-12"><h2 id="writing-heading" className="text-2xl font-bold">Your writing</h2><div className="mt-5 space-y-4">{posts.map((post) => { const metrics = analytics.postMetrics[post.id]; return <article key={post.id} className="flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-gray-100 px-3 py-1 text-xs">{typeLabels[post.type] ?? "Article"}</span><span className={`rounded-full px-3 py-1 text-xs capitalize ${post.status === "published" ? "bg-green-100 text-green-700" : post.status === "removed" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{post.status}</span></div><h3 className="text-xl font-semibold"><Link href={`/editor?id=${post.id}`} className="hover:underline">{post.title || "Untitled"}</Link></h3><p className="mt-2 text-sm text-gray-500">Updated {new Date(post.updated_at).toLocaleDateString()}</p>{post.status === "published" && <dl className="mt-3 flex gap-5 text-sm"><div><dt className="inline text-gray-500">Views </dt><dd className="inline font-semibold">{metrics?.views ?? 0}</dd></div><div><dt className="inline text-gray-500">Saves </dt><dd className="inline font-semibold">{metrics?.saves ?? 0}</dd></div></dl>}{post.status === "draft" && <p className="mt-3 text-sm text-gray-500">Draft · analytics begin when published</p>}</div><DashboardPostActions id={post.id} status={post.status} /></article>; })}{posts.length === 0 && <div className="rounded-xl border p-10 text-center text-gray-500">You have not started writing yet.</div>}</div></section></main>;
}

function FollowerGrowth({ points }: { points: DashboardAnalytics["followerGrowth"] }) {
  const max = Math.max(1, ...points.map((point) => Math.abs(point.change)));
  const net = points.reduce((sum, point) => sum + point.change, 0);
  return <section aria-labelledby="growth-heading" className="mt-10 rounded-xl border bg-white/40 p-5"><div className="flex items-end justify-between gap-4"><div><h2 id="growth-heading" className="text-xl font-bold">Follower growth</h2><p className="mt-1 text-sm text-gray-600">Daily net change over the trailing 30 UTC days.</p></div><p className={`text-2xl font-bold ${net < 0 ? "text-red-700" : "text-[#053400]"}`}>{net > 0 ? "+" : ""}{net}</p></div>{points.length ? <div className="mt-6 flex h-32 items-center gap-1" role="img" aria-label={`Follower growth chart, net ${net} over 30 days`}>{points.map((point) => <div key={point.date} title={`${point.date}: ${point.change > 0 ? "+" : ""}${point.change}`} className="flex h-full min-w-0 flex-1 items-center"><div className={`w-full rounded-sm ${point.change < 0 ? "bg-red-400" : "bg-[#42614A]"}`} style={{ height: `${point.change === 0 ? 2 : Math.max(8, Math.abs(point.change) / max * 100)}%` }} /></div>)}</div> : <p className="mt-6 text-sm text-gray-500">Growth history will appear after the analytics migration is applied.</p>}</section>;
}
