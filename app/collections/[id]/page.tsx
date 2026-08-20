"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../../../lib/supabase/client";
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

export default function CollectionPage() {
  const { id } = useParams();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadCollection();
  }, [id]);

  async function loadCollection() {
    const { data: collectionData, error: collectionError } = await supabase
      .from("collections")
      .select("id, title, description, cover_image_url")
      .eq("id", id)
      .single();

    if (collectionError || !collectionData) {
      setLoading(false);
      return;
    }

    setCollection(collectionData);

    const { data: pieceRows } = await supabase
      .from("collection_drafts")
      .select("position, draft:drafts(id, title, type, cover_image_url, user_id, is_anonymous, status)")
      .eq("collection_id", id)
      .order("position", { ascending: true });

    if (pieceRows) {
      const publishedPieces: Piece[] = [];

      for (const row of pieceRows) {
        const draft = Array.isArray(row.draft) ? row.draft[0] : row.draft;
        if (draft && draft.status === "published") {
          publishedPieces.push(draft);
        }
      }

      setPieces(publishedPieces);

      const authorIds = Array.from(
        new Set(
          publishedPieces
            .filter((piece) => !piece.is_anonymous)
            .map((piece) => piece.user_id)
        )
      );

      if (authorIds.length > 0) {
        const { data: writerData } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", authorIds);

        if (writerData) setWriters(writerData);
      }
    }

    setLoading(false);
  }

  function getWriter(userId: string) {
    return writers.find((writer) => writer.id === userId);
  }

  if (loading) {
    return <main className="min-h-screen bg-[#F7F1E8]" />;
  }

  if (!collection) {
    return (
      <main className="min-h-screen bg-[#F7F1E8] px-8 py-20 text-[#46382F]">
        <div className="mx-auto max-w-4xl">
          <h1 className={`${poppins.className} text-4xl`}>Collection not found</h1>
          <Link href="/collections" className={`${inter.className} mt-6 inline-block text-[#053400]`}>
            ← Back to Collections
          </Link>
        </div>
      </main>
    );
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
