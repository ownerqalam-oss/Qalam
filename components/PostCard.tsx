import Link from "next/link";
import { SaveButton } from "./SaveButton";

export type FeedPost = {
  id: string;
  author_id: string;
  title: string;
  tagline: string | null;
  type: string;
  tags: string[] | null;
  published_at: string | null;
};

export type FeedAuthor = { username: string; display_name: string };

export function PostCard({ post, author, saved = false }: { post: FeedPost; author: FeedAuthor; saved?: boolean }) {
  return <article className="rounded-xl border p-5 transition hover:border-[#053400] sm:p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-[#42614A]">{post.type}</p><h2 className="mt-2 text-2xl font-semibold"><Link href={`/journal/${post.id}`} className="hover:underline">{post.title}</Link></h2><p className="mt-2 text-sm text-gray-500">By <Link href={`/writers/${author.username}`} className="font-medium text-[#42614A] hover:underline">{author.display_name}</Link></p></div><SaveButton postId={post.id} initialSaved={saved} /></div>{post.tagline && <p className="mt-3 text-gray-600">{post.tagline}</p>}{post.tags && post.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{post.tags.map((tag) => <Link key={tag} href={`/journal?tag=${encodeURIComponent(tag)}`} className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">{tag}</Link>)}</div>}<p className="mt-4 text-sm text-gray-500">{post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}</p></article>;
}
