import { ModerationForm } from "../../../components/ModerationForm";
import { createAdminClient } from "../../../lib/supabase/admin";

export default async function AdminPostsPage() {
  const supabase = createAdminClient();
  const { data: posts, error } = await supabase.from("posts").select("id, title, type, status, updated_at").order("updated_at", { ascending: false }).limit(100);
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><p className="text-sm font-medium uppercase tracking-[0.25em] text-[#42614A]">Administration</p><h1 className="mt-3 text-4xl font-bold">Posts</h1><p className="mt-3 text-gray-600">Every removal and restoration requires a reason and creates an audit record.</p>{error && <p className="mt-8 rounded-lg bg-red-50 p-3 text-red-700">Posts could not be loaded.</p>}<div className="mt-10 space-y-4">{posts?.map((post) => <div key={post.id} className="grid gap-4 rounded-xl border p-5 sm:grid-cols-[1fr_18rem] sm:items-start"><div><div className="flex gap-2 text-xs capitalize text-gray-500"><span>{post.type}</span><span>·</span><span>{post.status}</span></div><h2 className="mt-2 text-lg font-semibold">{post.title || "Untitled"}</h2></div><ModerationForm targetType="post" targetId={post.id} action={post.status === "removed" ? "restore" : "remove"} /></div>)}{!posts?.length && !error && <p className="rounded-xl border p-8 text-center text-gray-500">No posts yet.</p>}</div></main>;
}
