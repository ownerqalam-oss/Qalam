import Link from "next/link";
import { notFound } from "next/navigation";
import { SaveButton } from "../../../components/SaveButton";
import { ArticleViewTracker } from "../../../components/ArticleViewTracker";
import { ReportButton } from "../../../components/ReportButton";
import { getCurrentUser } from "../../../lib/auth";
import { sanitizePostHtml } from "../../../lib/sanitize";
import { createClient } from "../../../lib/supabase/server";
import { postIdSchema } from "../../../lib/validation/posts";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const parsedId = postIdSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();
  const supabase = await createClient();
  const { data: article } = await supabase.from("posts").select("id, author_id, title, content_html, tagline, type, tags, published_at").eq("id", parsedId.data).eq("status", "published").maybeSingle();
  if (!article) notFound();
  const user = await getCurrentUser();
  const [{ data: author }, { data: saved }] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", article.author_id).maybeSingle(),
    user ? supabase.from("saved_posts").select("post_id").eq("user_id", user.id).eq("post_id", article.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!author?.username || !author.display_name) notFound();
  const safeHtml = sanitizePostHtml(article.content_html);

  return <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16"><ArticleViewTracker postId={article.id} /><Link href="/journal" className="mb-10 inline-block text-gray-500 hover:text-black">← Back to Journal</Link><div className="mb-4 flex items-start justify-between gap-4"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-gray-100 px-3 py-1 text-sm capitalize">{article.type}</span>{article.tags?.map((tag) => <Link key={tag} href={`/journal?tag=${encodeURIComponent(tag)}`} className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">{tag}</Link>)}</div><SaveButton postId={article.id} initialSaved={Boolean(saved)} /></div><h1 className="mb-4 text-4xl font-bold sm:text-5xl">{article.title}</h1><Link href={`/writers/${author.username}`} className="mb-6 inline-block text-sm font-medium text-[#42614A] hover:underline">By {author.display_name}</Link>{article.tagline && <p className="mb-8 text-xl text-gray-600">{article.tagline}</p>}{article.published_at && <p className="mb-10 text-sm text-gray-500">{new Date(article.published_at).toLocaleDateString()}</p>}<article className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: safeHtml }} />{user?.id !== article.author_id && <footer className="mt-12 flex justify-end border-t pt-6"><ReportButton targetType="post" targetId={article.id} label="Report this post" /></footer>}</main>;
}
