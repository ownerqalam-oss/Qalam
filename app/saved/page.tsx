import { FeedPagination } from "../../components/FeedPagination";
import { FeedAuthor, FeedPost, PostCard } from "../../components/PostCard";
import { requireOnboardedUser } from "../../lib/auth";
import { cursorFilter, encodeFeedCursor, parseFeedCursor } from "../../lib/feed-cursor";
import { createClient } from "../../lib/supabase/server";

const PAGE_SIZE = 12;

export default async function SavedPage({ searchParams }: { searchParams: Promise<{ cursor?: string | string[] }> }) {
  const user = await requireOnboardedUser();
  const cursorValue = (await searchParams).cursor;
  const cursor = parseFeedCursor(Array.isArray(cursorValue) ? cursorValue[0] : cursorValue);
  if ("isDevelopmentBypass" in user) return <SavedShell posts={[]} authors={new Map()} nextHref={null} />;

  const supabase = await createClient();
  let query = supabase.from("saved_posts").select("post_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).order("post_id", { ascending: false }).limit(PAGE_SIZE + 1);
  if (cursor) query = query.or(cursorFilter("created_at", "post_id", cursor));
  const { data: savedRows, error } = await query;
  if (error) return <FeedError />;
  const hasMore = savedRows.length > PAGE_SIZE;
  const pageRows = savedRows.slice(0, PAGE_SIZE);
  const postIds = pageRows.map((row) => row.post_id);
  if (!postIds.length) return <SavedShell posts={[]} authors={new Map()} nextHref={null} />;

  const { data: postData, error: postError } = await supabase.from("posts").select("id, author_id, title, tagline, type, tags, published_at").in("id", postIds).eq("status", "published");
  if (postError) return <FeedError />;
  const byId = new Map((postData ?? []).map((post) => [post.id, post as FeedPost]));
  const posts = postIds.map((id) => byId.get(id)).filter((post): post is FeedPost => Boolean(post));
  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const { data: profiles, error: profileError } = authorIds.length ? await supabase.from("profiles").select("id, username, display_name").in("id", authorIds) : { data: [], error: null };
  if (profileError) return <FeedError />;
  const authors = new Map((profiles ?? []).filter((profile) => profile.username && profile.display_name).map((profile) => [profile.id, { username: profile.username!, display_name: profile.display_name! } satisfies FeedAuthor]));
  const last = pageRows.at(-1);
  const next = hasMore && last ? encodeFeedCursor({ timestamp: last.created_at, id: last.post_id }) : null;
  return <SavedShell posts={posts.filter((post) => authors.has(post.author_id))} authors={authors} nextHref={next ? `/saved?cursor=${encodeURIComponent(next)}` : null} />;
}

function SavedShell({ posts, authors, nextHref }: { posts: FeedPost[]; authors: Map<string, FeedAuthor>; nextHref: string | null }) {
  return <main className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-12"><h1 className="text-4xl font-bold sm:text-5xl">Saved Posts</h1><p className="mt-3 text-gray-600">Your private reading list.</p><div className="mt-8 space-y-4">{posts.map((post) => <PostCard key={post.id} post={post} author={authors.get(post.author_id)!} saved />)}</div>{!posts.length && <div className="mt-8 rounded-xl border p-10 text-center text-gray-500">Posts you save will appear here.</div>}<FeedPagination href={nextHref} /></main>;
}

function FeedError() { return <main className="mx-auto max-w-4xl px-6 py-12"><h1 className="text-3xl font-bold">Saved posts unavailable</h1><p className="mt-3 text-gray-600">Please try again in a moment.</p></main>; }
