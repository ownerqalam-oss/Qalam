import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createPublicClient } from "../../../lib/supabase/public";
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
    return { title: "Writer not found | Qalam" };
  }

  const name = data.profile.display_name || "Qalam Writer";
  const description =
    data.profile.bio?.trim().slice(0, 160) ||
    `Read articles, poetry and reflections by ${name} on Qalam.`;
  const image = data.profile.avatar_url || "https://qalam.ie/og-default.png";

  return {
    title: `${name} | Qalam`,
    description,
    openGraph: {
      title: name,
      description,
      url: `https://qalam.ie/writers/${id}`,
      siteName: "Qalam",
      images: [{ url: image }],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: name,
      description,
      images: [image],
    },
  };
}

export default async function WriterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadWriter(id);

  if (!data) notFound();

  return <WriterView profile={data.profile} initialArticles={data.articles} />;
}
