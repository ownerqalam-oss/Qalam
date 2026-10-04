import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Poppins, Inter } from "next/font/google";
import { createPublicClient } from "../../../lib/supabase/public";
import { getGenreColor } from "../../../lib/genreColors";
import CoverImage from "../../../components/CoverImage";
import InkFlourish from "../../../components/InkFlourish";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

interface Collection {
  id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

interface Piece {
  id: string;
  title: string;
  type: string;
  cover_image_url: string | null;
  user_id: string;
  is_anonymous: boolean;
}

interface Writer {
  id: string;
  display_name: string | null;
}

// Wrapped in cache() so generateMetadata and the page share one fetch.
const loadCollection = cache(async (id: string) => {
  const supabase = createPublicClient();

  const { data: collection } = await supabase
    .from("collections")
    .select("id, title, description, cover_image_url")
    .eq("id", id)
    .maybeSingle<Collection>();

  if (!collection) return null;

  const { data: pieceRows } = await supabase
    .from("collection_drafts")
    .select("position, draft:drafts(id, title, type, cover_image_url, user_id, is_anonymous, status)")
    .eq("collection_id", id)
    .order("position", { ascending: true });

  const pieces: Piece[] = [];

  for (const row of pieceRows ?? []) {
    const draft = Array.isArray(row.draft) ? row.draft[0] : row.draft;
    if (draft && draft.status === "published") {
      pieces.push(draft);
    }
  }

  const authorIds = Array.from(
    new Set(
      pieces
        .filter((piece) => !piece.is_anonymous)
        .map((piece) => piece.user_id)
    )
  );

  let writers: Writer[] = [];

  if (authorIds.length > 0) {
    const { data: writerData } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds);

    writers = writerData ?? [];
  }

  return { collection, pieces, writers };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await loadCollection(id);

  if (!data) {
    return { title: "Collection not found | Qalam" };
  }

  const { collection } = data;
  const description =
    collection.description?.trim().slice(0, 160) ||
    `A curated collection of writing on Qalam.`;
  const image = collection.cover_image_url || "https://qalam.ie/og-default.png";

  return {
    title: `${collection.title} | Qalam`,
    description,
    openGraph: {
      title: collection.title,
      description,
      url: `https://qalam.ie/collections/${id}`,
      siteName: "Qalam",
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: collection.title,
      description,
      images: [image],
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadCollection(id);

  if (!data) notFound();

  const { collection, pieces, writers } = data;

  function getWriter(userId: string) {
    return writers.find((writer) => writer.id === userId);
  }

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <section className="mx-auto max-w-[1180px] px-6 py-16 md:px-8">

        <Link href="/collections" className={`${inter.className} text-sm text-[#81766D] hover:text-[#053400]`}>
          ← Back to Collections
        </Link>

        <div className="mt-8 mb-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]">
            COLLECTION
          </p>

          <h1 className="mt-4 text-5xl font-medium text-[#053400]">
            {collection.title}
          </h1>

          <InkFlourish className="mt-3 w-[90px]" />

          {collection.description && (
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#70655C]">
              {collection.description}
            </p>
          )}
        </div>

        {pieces.length === 0 ? (
          <div className="border-y border-[#DCD4C9] py-12">
            <p className="text-[#81766D]">No pieces in this collection yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pieces.map((piece) => {
              const writer = piece.is_anonymous ? null : getWriter(piece.user_id);
              const genreColor = getGenreColor(piece.type);

              return (
                <Link
                  key={piece.id}
                  href={`/journal/${piece.id}`}
                  className={`group flex items-center gap-5 rounded-xl border border-[#DCD4C9] border-t-4 ${genreColor.cardBorder} bg-[#E9E2D8] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
                >
                  <CoverImage
                    src={piece.cover_image_url}
                    type={piece.type}
                    alt={piece.title}
                    className="h-20 w-20 shrink-0 rounded-lg"
                  />

                  <div className="min-w-0 flex-1">
                    <p className={`${inter.className} text-[11px] font-medium uppercase tracking-[0.2em] text-[#42614A]`}>
                      {piece.type === "story" ? "Short Story" : piece.type}
                    </p>

                    <h3 className={`${poppins.className} mt-1 text-xl font-medium text-[#46382F] group-hover:text-[#053400]`}>
                      {piece.title}
                    </h3>

                    <p className={`${inter.className} mt-1 text-sm text-[#70655C]`}>
                      {writer?.display_name || "Qalam Writer"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </section>
    </main>
  );
}
