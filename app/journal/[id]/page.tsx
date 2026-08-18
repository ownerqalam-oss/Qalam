import type { Metadata } from "next";
import ArticleView from "./ArticleView";

interface DraftMeta {
  title: string;
  content: string;
  cover_image_url: string | null;
}

function excerptFromHtml(html: string, maxLength = 160): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength).trimEnd()}…`;
}

async function fetchArticleMeta(id: string): Promise<DraftMeta | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/drafts?id=eq.${id}&status=eq.published&select=title,content,cover_image_url`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data[0] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await fetchArticleMeta(id);

  if (!article) {
    return { title: "Article not found | Qalam" };
  }

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

export default function ArticlePage() {
  return <ArticleView />;
}
