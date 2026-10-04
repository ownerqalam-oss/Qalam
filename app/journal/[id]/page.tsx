import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createPublicClient } from "../../../lib/supabase/public";
import ArticleView, {
  type Article,
  type OtherPiece,
  type Profile,
} from "./ArticleView";

function excerptFromHtml(html: string, maxLength = 160): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength).trimEnd()}…`;
}

// Wrapped in cache() so generateMetadata and the page share one fetch.
const loadArticle = cache(async (id: string) => {
  const supabase = createPublicClient();

  const { data: article } = await supabase
    .from("drafts")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle<Article>();

  if (!article) return null;

  /*
   * Anonymous pieces never load or expose the author's profile.
   */
  if (article.is_anonymous) {
    return { article, profile: null, moreFromWriter: [] };
  }

  const [{ data: profile }, { data: moreFromWriter }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, bio, avatar_url")
      .eq("id", article.user_id)
      .maybeSingle<Profile>(),
    supabase
      .from("drafts")
      .select("id, title, type")
      .eq("user_id", article.user_id)
      .eq("status", "published")
      .eq("is_anonymous", false)
      .neq("id", article.id)
      .order("published_at", { ascending: false })
      .limit(4),
  ]);

  return {
    article,
    profile,
    moreFromWriter: (moreFromWriter ?? []) as OtherPiece[],
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await loadArticle(id);

  if (!data) {
    return { title: "Article not found | Qalam" };
  }

  const { article } = data;
  const description =
    excerptFromHtml(article.content) ||
    "Read on Qalam - a home for Muslim writers.";
  const image = article.cover_image_url || "https://qalam.ie/og-default.png";

  return {
    title: `${article.title} | Qalam`,
    description,
    openGraph: {
      title: article.title,
      description,
      url: `https://qalam.ie/journal/${id}`,
      siteName: "Qalam",
      images: [{ url: image, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [image],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadArticle(id);

  if (!data) notFound();

  return (
    <ArticleView
      initialArticle={data.article}
      profile={data.profile}
      moreFromWriter={data.moreFromWriter}
    />
  );
}
