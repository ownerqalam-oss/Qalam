import Link from "next/link";
import { FeedPagination } from "../../components/FeedPagination";
import { FeedAuthor, FeedPost, PostCard } from "../../components/PostCard";
import { getCurrentUser } from "../../lib/auth";
import { cursorFilter, encodeFeedCursor, parseFeedCursor } from "../../lib/feed-cursor";
import { createClient } from "../../lib/supabase/server";
import { writingTypeSchema } from "../../lib/validation/posts";

const PAGE_SIZE = 12;
const types = [
  { value: "article", label: "Articles" },
  { value: "story", label: "Short Stories" },
  { value: "poetry", label: "Poetry" },
  { value: "reflection", label: "Reflections" },
] as const;

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function JournalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const typeValue = first(params.type);
  const type = writingTypeSchema.safeParse(typeValue).success ? writingTypeSchema.parse(typeValue) : null;
  const rawTag = first(params.tag)?.trim();
  const tag = rawTag && rawTag.length <= 40 ? rawTag : null;
  const cursor = parseFeedCursor(first(params.cursor));
  const supabase = await createClient();

  let query = supabase.from("posts").select("id, author_id, title, tagline, type, tags, published_at").eq("status", "published").order("published_at", { ascending: false }).order("id", { ascending: false }).limit(PAGE_SIZE + 1);
  if (type) query = query.eq("type", type);
  if (tag) query = query.contains("tags", [tag]);
  if (cursor) query = query.or(cursorFilter("published_at", "id", cursor));

  const { data, error } = await query;
  if (error) return <FeedError title="Journal unavailable" />;
  const hasMore = data.length > PAGE_SIZE;
  const posts = data.slice(0, PAGE_SIZE) as FeedPost[];
  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const user = await getCurrentUser();
  const [{ data: profiles, error: profileError }, savesResult] = await Promise.all([
    authorIds.length ? supabase.from("profiles").select("id, username, display_name").in("id", authorIds) : Promise.resolve({ data: [], error: null }),
    user && posts.length ? supabase.from("saved_posts").select("post_id").eq("user_id", user.id).in("post_id", posts.map((post) => post.id)) : Promise.resolve({ data: [], error: null }),
  ]);
  if (profileError || savesResult.error) return <FeedError title="Journal unavailable" />;
  const authors = new Map((profiles ?? []).filter((profile) => profile.username && profile.display_name).map((profile) => [profile.id, { username: profile.username!, display_name: profile.display_name! } satisfies FeedAuthor]));
  const savedIds = new Set((savesResult.data ?? []).map((save) => save.post_id));
  const visiblePosts = posts.filter((post) => authors.has(post.author_id));
  const last = posts.at(-1);
  const nextCursor = hasMore && last?.published_at ? encodeFeedCursor({ timestamp: last.published_at, id: last.id }) : null;
  const nextParams = new URLSearchParams();
  if (type) nextParams.set("type", type);
  if (tag) nextParams.set("tag", tag);
  if (nextCursor) nextParams.set("cursor", nextCursor);

  return <main className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-12"><h1 className="mb-3 text-4xl font-bold sm:text-5xl">Journal</h1><p className="text-gray-600">Discover thoughtful writing from the Qalam community.</p><nav aria-label="Writing type" className="mt-8 flex flex-wrap gap-2"><Link href={tag ? `/journal?tag=${encodeURIComponent(tag)}` : "/journal"} className={`rounded-full border px-4 py-2 text-sm ${!type ? "bg-[#053400] text-white" : "hover:bg-gray-50"}`}>All</Link>{types.map(({ value, label }) => { const href = new URLSearchParams({ type: value }); if (tag) href.set("tag", tag); return <Link key={value} href={`/journal?${href}`} className={`rounded-full border px-4 py-2 text-sm ${type === value ? "bg-[#053400] text-white" : "hover:bg-gray-50"}`}>{label}</Link>; })}</nav><form action="/journal" className="my-5 flex max-w-md gap-2">{type && <input type="hidden" name="type" value={type} />}<label htmlFor="tag-filter" className="sr-only">Filter by tag</label><input id="tag-filter" name="tag" defaultValue={tag ?? ""} maxLength={40} placeholder="Filter by tag" className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2" /><button className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">Filter</button></form>{tag && <p className="mb-6 text-sm text-gray-600">Showing tag <strong>{tag}</strong> · <Link href={type ? `/journal?type=${type}` : "/journal"} className="underline">clear</Link></p>}<div className="space-y-4">{visiblePosts.map((post) => <PostCard key={post.id} post={post} author={authors.get(post.author_id)!} saved={savedIds.has(post.id)} />)}</div>{visiblePosts.length === 0 && <div className="rounded-xl border p-10 text-center text-gray-500">No published writing matches these filters.</div>}<FeedPagination href={nextCursor ? `/journal?${nextParams}` : null} /></main>;
}

function FeedError({ title }: { title: string }) { return <main className="mx-auto max-w-4xl px-6 py-12"><h1 className="text-3xl font-bold">{title}</h1><p className="mt-3 text-gray-600">Please try again in a moment.</p></main>; }
