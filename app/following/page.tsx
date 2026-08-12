import { FeedPagination } from "../../components/FeedPagination";
import { FeedAuthor, FeedPost, PostCard } from "../../components/PostCard";
import { requireOnboardedUser } from "../../lib/auth";
import { cursorFilter, encodeFeedCursor, parseFeedCursor } from "../../lib/feed-cursor";
import { createClient } from "../../lib/supabase/server";

const PAGE_SIZE = 12;

export default async function FollowingPage({ searchParams }: { searchParams: Promise<{ cursor?: string | string[] }> }) {
  const user = await requireOnboardedUser();
  const cursorValue = (await searchParams).cursor;
  const cursor = parseFeedCursor(Array.isArray(cursorValue) ? cursorValue[0] : cursorValue);
  if ("isDevelopmentBypass" in user) return <FollowingShell posts={[]} authors={new Map()} savedIds={new Set()} nextHref={null} />;

  const supabase = await createClient();
  const { data: follows, error: followError } = await supabase.from("follows").select("followed_id").eq("follower_id", user.id);
  if (followError) return <FeedError />;
  const writerIds = (follows ?? []).map((follow) => follow.followed_id);
  if (!writerIds.length) return <FollowingShell posts={[]} authors={new Map()} savedIds={new Set()} nextHref={null} />;

  let query = supabase.from("posts").select("id, author_id, title, tagline, type, tags, published_at").eq("status", "published").in("author_id", writerIds).order("published_at", { ascending: false }).order("id", { ascending: false }).limit(PAGE_SIZE + 1);
  if (cursor) query = query.or(cursorFilter("published_at", "id", cursor));
  const { data, error } = await query;
  if (error) return <FeedError />;
  const hasMore = data.length > PAGE_SIZE;
  const posts = data.slice(0, PAGE_SIZE) as FeedPost[];
  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const [{ data: profiles, error: profileError }, { data: saves, error: saveError }] = await Promise.all([
    authorIds.length ? supabase.from("profiles").select("id, username, display_name").in("id", authorIds) : Promise.resolve({ data: [], error: null }),
    posts.length ? supabase.from("saved_posts").select("post_id").eq("user_id", user.id).in("post_id", posts.map((post) => post.id)) : Promise.resolve({ data: [], error: null }),
  ]);
  if (profileError || saveError) return <FeedError />;
  const authors = new Map((profiles ?? []).filter((profile) => profile.username && profile.display_name).map((profile) => [profile.id, { username: profile.username!, display_name: profile.display_name! } satisfies FeedAuthor]));
  const last = posts.at(-1);
  const next = hasMore && last?.published_at ? encodeFeedCursor({ timestamp: last.published_at, id: last.id }) : null;
  return <FollowingShell posts={posts.filter((post) => authors.has(post.author_id))} authors={authors} savedIds={new Set((saves ?? []).map((save) => save.post_id))} nextHref={next ? `/following?cursor=${encodeURIComponent(next)}` : null} />;
}

function FollowingShell({ posts, authors, savedIds, nextHref }: { posts: FeedPost[]; authors: Map<string, FeedAuthor>; savedIds: Set<string>; nextHref: string | null }) {
  return <main className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-12"><h1 className="text-4xl font-bold sm:text-5xl">Following</h1><p className="mt-3 text-gray-600">The latest writing from people you follow.</p><div className="mt-8 space-y-4">{posts.map((post) => <PostCard key={post.id} post={post} author={authors.get(post.author_id)!} saved={savedIds.has(post.id)} />)}</div>{!posts.length && <div className="mt-8 rounded-xl border p-10 text-center text-gray-500">Follow a writer to see their published work here.</div>}<FeedPagination href={nextHref} /></main>;
}

function FeedError() { return <main className="mx-auto max-w-4xl px-6 py-12"><h1 className="text-3xl font-bold">Following feed unavailable</h1><p className="mt-3 text-gray-600">Please try again in a moment.</p></main>; }
