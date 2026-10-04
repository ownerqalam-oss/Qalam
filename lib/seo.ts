import type { Metadata } from "next";

export const SITE_URL = "https://qalam.ie";
export const SITE_NAME = "Qalam";
export const DEFAULT_DESCRIPTION =
  "A home for Muslim writers and readers, sharing articles, poetry, reflections and short stories written with sincerity.";
export const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

interface PageMetadataOptions {
  // Plain page title - the root layout's template appends " | Qalam".
  title: string;
  description?: string;
  // Path from the site root, e.g. "/journal". Used as the canonical URL.
  path: string;
  image?: string | null;
  type?: "website" | "article" | "profile";
  publishedTime?: string | null;
  authors?: string[];
}

/*
 * Builds the full metadata for a public page. Next replaces nested
 * objects like openGraph wholesale rather than merging them with the
 * parent's, so every page gets a complete set here.
 */
export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  type = "website",
  publishedTime,
  authors,
}: PageMetadataOptions): Metadata {
  const url = `${SITE_URL}${path}`;
  const images = [image || DEFAULT_IMAGE];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images,
      locale: "en_IE",
      ...(type === "article"
        ? {
            type: "article",
            publishedTime: publishedTime ?? undefined,
            authors,
          }
        : { type }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

// For account, auth and admin pages: keep them out of search results.
export const noIndex: Metadata = {
  robots: { index: false, follow: false },
};

export function excerpt(text: string, maxLength = 160): string {
  const plain = text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;

  return `${plain.slice(0, maxLength).trimEnd()}…`;
}
