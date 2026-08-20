"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../../lib/supabase/client";
import InkFlourish from "../../components/InkFlourish";

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

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [pieceCounts, setPieceCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  async function loadCollections() {
    const { data, error } = await supabase
      .from("collections")
      .select("id, title, description, cover_image_url")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCollections(data);

      const { data: pieceRows } = await supabase
        .from("collection_drafts")
        .select("collection_id");

      if (pieceRows) {
        const counts: Record<number, number> = {};
        for (const row of pieceRows) {
          counts[row.collection_id] = (counts[row.collection_id] ?? 0) + 1;
        }
        setPieceCounts(counts);
      }
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <section className="mx-auto max-w-[1180px] px-6 py-16 md:px-8">

        <div className="mb-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]">
            CURATED BY QALAM
          </p>

          <h1 className="mt-4 text-5xl font-medium text-[#053400]">
            Collections
          </h1>

          <InkFlourish className="mt-3 w-[90px]" />

          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#70655C]">
            Themed groupings of writing from across the Qalam community.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-[#EFE8DC]" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="border-y border-[#DCD4C9] py-12">
            <p className="text-[#81766D]">No collections yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="group block overflow-hidden rounded-xl border border-[#DCD4C9] bg-[#E9E2D8] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {collection.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={collection.cover_image_url}
                    alt={collection.title}
                    className="h-36 w-full object-cover"
                  />
                )}

                <div className="p-6">
                  <h2
                    className={`${poppins.className} text-xl font-medium text-[#46382F] transition group-hover:text-[#053400]`}
                  >
                    {collection.title}
                  </h2>

                  {collection.description && (
                    <p className={`${inter.className} mt-2 text-sm leading-6 text-[#70655C]`}>
                      {collection.description}
                    </p>
                  )}

                  <p className={`${inter.className} mt-4 text-xs text-[#9A9188]`}>
                    {pieceCounts[collection.id] ?? 0}{" "}
                    {pieceCounts[collection.id] === 1 ? "piece" : "pieces"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

      </section>
    </main>
  );
}
