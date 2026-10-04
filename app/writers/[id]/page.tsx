import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createPublicClient } from "../../../lib/supabase/public";
import { SITE_URL, excerpt, noIndex, pageMetadata } from "../../../lib/seo";
import JsonLd from "../../../components/JsonLd";
import WriterView, { type Article, type Profile } from "./WriterView";

// Wrapped in cache() so generateMetadata and the page share one fetch.
const loadWriter = cache(async (id: string) => {
  const supabase = createPublicClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, bio, avatar_url")
    .eq("id", id)
    .maybeSingle<Profile>();

  if (!profile) return null;

  /*
   * Only public pieces here - anonymous ones must never be tied to a
   * writer in server-rendered HTML. The owner's own view adds them
   * client-side.
   */
  const { data: articles } = await supabase
    .from("drafts")
    .select(
      "id, title, content, type, tags, published_at, is_anonymous, cover_image_url"
    )
    .eq("user_id", id)
    .eq("status", "published")
    .eq("is_anonymous", false)
    .order("published_at", { ascending: false });

  return { profile, articles: (articles ?? []) as Article[] };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await loadWriter(id);

  if (!data) {
    return { title: "Writer not found", ...noIndex };
  }

  const name = data.profile.display_name || "Qalam Writer";

  return pageMetadata({
    title: name,
    description:
      (data.profile.bio && excerpt(data.profile.bio)) ||
      `Read articles, poetry and reflections by ${name} on Qalam.`,
    path: `/writers/${id}`,
    image: data.profile.avatar_url,
    type: "profile",
  });
}

export default async function WriterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadWriter(id);

  if (!data) notFound();

  const { profile, articles } = data;
  const url = `${SITE_URL}/writers/${profile.id}`;

  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    mainEntity: {
      "@type": "Person",
      name: profile.display_name || "Qalam Writer",
      url,
      description: profile.bio || undefined,
      image: profile.avatar_url || undefined,
    },
    // Only public pieces - the server list never includes anonymous ones.
    hasPart: articles.map((article) => ({
      "@type": "Article",
      headline: article.title,
      url: `${SITE_URL}/journal/${article.id}`,
      datePublished: article.published_at ?? undefined,
    })),
  };

  return (
    <>
      <JsonLd data={profileJsonLd} />
      <WriterView profile={profile} initialArticles={articles} />
    </>
  );
}
