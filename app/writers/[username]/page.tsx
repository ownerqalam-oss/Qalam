import { notFound } from "next/navigation";
import { Avatar } from "../../../components/Avatar";
import { FollowButton } from "../../../components/FollowButton";
import { FeedPost, PostCard } from "../../../components/PostCard";
import { ReportButton } from "../../../components/ReportButton";
import { getCurrentUser } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";
import { usernameSchema } from "../../../lib/validation/profiles";

export default async function WriterPage({ params }: { params: Promise<{ username: string }> }) {
  const parsed = usernameSchema.safeParse((await params).username);
  if (!parsed.success) notFound();

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id, username, display_name, bio, avatar_path, follower_count, following_count").eq("username", parsed.data).maybeSingle();
  if (!profile || !profile.username || !profile.display_name) notFound();

  const user = await getCurrentUser();
  const [{ data: postData, error: postError }, followResult] = await Promise.all([
    supabase.from("posts").select("id, author_id, title, tagline, type, tags, published_at").eq("author_id", profile.id).eq("status", "published").order("published_at", { ascending: false }),
    user && user.id !== profile.id ? supabase.from("follows").select("followed_id").eq("follower_id", user.id).eq("followed_id", profile.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (postError) return <main className="mx-auto max-w-4xl px-6 py-12"><p>Published writing is unavailable right now.</p></main>;
  const posts = (postData ?? []) as FeedPost[];
  const { data: saves } = user && posts.length ? await supabase.from("saved_posts").select("post_id").eq("user_id", user.id).in("post_id", posts.map((post) => post.id)) : { data: [] };
  const savedIds = new Set((saves ?? []).map((save) => save.post_id));
  const author = { username: profile.username, display_name: profile.display_name };

  return <main className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16"><header className="flex flex-col gap-6 sm:flex-row sm:items-start"><Avatar path={profile.avatar_path} name={profile.display_name} size="lg" /><div><h1 className="text-4xl font-bold text-[#053400] sm:text-5xl">{profile.display_name}</h1><p className="mt-2 text-gray-500">@{profile.username}</p>{profile.bio && <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-700">{profile.bio}</p>}<dl className="mt-5 flex gap-6 text-sm"><div><dt className="sr-only">Followers</dt><dd><strong>{profile.follower_count}</strong> followers</dd></div><div><dt className="sr-only">Following</dt><dd><strong>{profile.following_count}</strong> following</dd></div></dl>{user && user.id !== profile.id && <div className="flex items-end gap-4"><FollowButton writerId={profile.id} initialFollowing={Boolean(followResult.data)} /><div className="mb-2"><ReportButton targetType="profile" targetId={profile.id} label="Report profile" /></div></div>}</div></header><section className="mt-14 border-t pt-10"><h2 className="text-2xl font-bold">Published writing</h2><div className="mt-6 space-y-4">{posts.map((post) => <PostCard key={post.id} post={post} author={author} saved={savedIds.has(post.id)} />)}{!posts.length && <p className="rounded-xl border p-8 text-center text-gray-500">No published writing yet.</p>}</div></section></main>;
}
