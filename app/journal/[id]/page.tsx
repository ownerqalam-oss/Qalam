import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createPublicClient } from "../../../lib/supabase/public";
import {
  DEFAULT_IMAGE,
  SITE_NAME,
  SITE_URL,
  excerpt,
  noIndex,
  pageMetadata,
} from "../../../lib/seo";
import JsonLd from "../../../components/JsonLd";
import ArticleView, {
  type Article,
  type OtherPiece,
  type Profile,
} from "./ArticleView";

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
    return { title: "Article not found", ...noIndex };
  }

  const { article, profile } = data;

  return pageMetadata({
    title: article.title,
    description:
      article.tagline?.trim() ||
      excerpt(article.content) ||
      "Read on Qalam - a home for Muslim writers.",
    path: `/journal/${id}`,
    image: article.cover_image_url,
    type: "article",
    publishedTime: article.published_at,
    authors: profile?.display_name ? [profile.display_name] : undefined,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadArticle(id);

  if (!data) notFound();

  const { article, profile } = data;
  const url = `${SITE_URL}/journal/${article.id}`;

  // Anonymous pieces are credited to Qalam, never to the real author.
  const author =
    article.is_anonymous || !profile
      ? { "@type": "Organization", name: SITE_NAME, url: SITE_URL }
      : {
          "@type": "Person",
          name: profile.display_name || "Qalam Writer",
          url: `${SITE_URL}/writers/${profile.id}`,
        };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.tagline?.trim() || excerpt(article.content),
    image: [article.cover_image_url || DEFAULT_IMAGE],
    datePublished: article.published_at ?? undefined,
    author,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo2.png` },
    },
    mainEntityOfPage: url,
    url,
    articleSection: article.type,
    keywords: article.tags?.join(", ") || undefined,
    inLanguage: "en",
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <ArticleView
        initialArticle={article}
        profile={profile}
        moreFromWriter={data.moreFromWriter}
      />
    </>
  );
}
