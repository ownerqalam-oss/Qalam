import type { MetadataRoute } from "next";
import { createPublicClient } from "../lib/supabase/public";

const SITE_URL = "https://qalam.ie";

// Regenerate at most hourly rather than querying Supabase on every crawl.
export const revalidate = 3600;

// Supabase caps a single select at 1000 rows, so page through results.
const PAGE_SIZE = 1000;

interface PublishedDraft {
  id: string;
  user_id: string;
  is_anonymous: boolean;
  published_at: string | null;
}

interface CollectionRow {
  id: number;
  created_at: string;
}

async function loadPublishedDrafts(): Promise<PublishedDraft[]> {
  const supabase = createPublicClient();
  const drafts: PublishedDraft[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("drafts")
      .select("id, user_id, is_anonymous, published_at")
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("Sitemap: error loading drafts:", error);
      break;
    }

    drafts.push(...((data ?? []) as PublishedDraft[]));

    if (!data || data.length < PAGE_SIZE) break;
  }

  return drafts;
}

async function loadCollections(): Promise<CollectionRow[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("collections")
    .select("id, created_at");

  if (error) {
    console.error("Sitemap: error loading collections:", error);
    return [];
  }

  return (data ?? []) as CollectionRow[];
}

function toDate(value: string | null): Date | undefined {
  return value ? new Date(value) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [drafts, collections] = await Promise.all([
    loadPublishedDrafts(),
    loadCollections(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/journal`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/explore`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/writers`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/collections`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const articlePages: MetadataRoute.Sitemap = drafts.map((draft) => ({
    url: `${SITE_URL}/journal/${draft.id}`,
    lastModified: toDate(draft.published_at),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  /*
   * Writers are listed only if they have at least one public piece.
   * Anonymous pieces are skipped so they can't be tied to a writer here.
   */
  const latestByWriter = new Map<string, string | null>();

  for (const draft of drafts) {
    if (draft.is_anonymous) continue;

    const current = latestByWriter.get(draft.user_id);
    if (
      current === undefined ||
      (draft.published_at && (!current || draft.published_at > current))
    ) {
      latestByWriter.set(draft.user_id, draft.published_at);
    }
  }

  const writerPages: MetadataRoute.Sitemap = Array.from(
    latestByWriter,
    ([userId, latest]) => ({
      url: `${SITE_URL}/writers/${userId}`,
      lastModified: toDate(latest),
      changeFrequency: "weekly",
      priority: 0.6,
    })
  );

  const collectionPages: MetadataRoute.Sitemap = collections.map(
    (collection) => ({
      url: `${SITE_URL}/collections/${collection.id}`,
      lastModified: toDate(collection.created_at),
      changeFrequency: "weekly",
      priority: 0.6,
    })
  );

  return [
    ...staticPages,
    ...articlePages,
    ...writerPages,
    ...collectionPages,
  ];
}
