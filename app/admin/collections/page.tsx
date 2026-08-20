"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../../../lib/supabase/client";
import { isAdminEmail } from "../../../lib/admin";
import { useToast } from "../../../components/ToastProvider";
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

interface PublishedPiece {
  id: string;
  title: string;
  type: string;
}

export default function AdminCollectionsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [allPublished, setAllPublished] = useState<PublishedPiece[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [collectionDraftIds, setCollectionDraftIds] = useState<string[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (selectedId !== null) loadCollectionPieces(selectedId);
  }, [selectedId]);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isAdminEmail(user?.email)) {
      router.push("/dashboard");
      return;
    }

    loadCollections();
    loadAllPublished();
  }

  async function loadCollections() {
    const { data } = await supabase
      .from("collections")
      .select("id, title, description, cover_image_url")
      .order("created_at", { ascending: false });

    if (data) setCollections(data);
  }

  async function loadAllPublished() {
    const { data } = await supabase
      .from("drafts")
      .select("id, title, type")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (data) setAllPublished(data);
  }

  async function loadCollectionPieces(collectionId: number) {
    const { data } = await supabase
      .from("collection_drafts")
      .select("draft_id")
      .eq("collection_id", collectionId);

    if (data) setCollectionDraftIds(data.map((row) => String(row.draft_id)));
  }

  async function createCollection(e: React.FormEvent) {
    e.preventDefault();

    if (!newTitle.trim()) return;

    setCreating(true);

    const { data, error } = await supabase.rpc("create_collection", {
      p_title: newTitle.trim(),
      p_description: newDescription.trim() || null,
      p_cover_image_url: newCoverUrl.trim() || null,
    });

    setCreating(false);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setNewTitle("");
    setNewDescription("");
    setNewCoverUrl("");
    await loadCollections();
    setSelectedId(data);
    showToast("Collection created.", "success");
  }

  async function deleteCollection(collectionId: number) {
    const { error } = await supabase.rpc("delete_collection", {
      p_collection_id: collectionId,
    });

    if (error) {
      showToast(error.message, "error");
      return;
    }

    if (selectedId === collectionId) setSelectedId(null);
    loadCollections();
    showToast("Collection deleted.", "success");
  }

  async function addPiece(draftId: string) {
    if (selectedId === null) return;

    const { error } = await supabase.rpc("add_to_collection", {
      p_collection_id: selectedId,
      p_draft_id: draftId,
      p_position: collectionDraftIds.length,
    });

    if (error) {
      showToast(error.message, "error");
      return;
    }

    loadCollectionPieces(selectedId);
  }

  async function removePiece(draftId: string) {
    if (selectedId === null) return;

    const { error } = await supabase.rpc("remove_from_collection", {
      p_collection_id: selectedId,
      p_draft_id: draftId,
    });

    if (error) {
      showToast(error.message, "error");
      return;
    }

    loadCollectionPieces(selectedId);
  }

  const selectedCollection = collections.find((c) => c.id === selectedId);
  const piecesInCollection = allPublished.filter((p) => collectionDraftIds.includes(p.id));
  const piecesNotInCollection = allPublished.filter((p) => !collectionDraftIds.includes(p.id));

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <div className="mx-auto max-w-5xl px-6 py-12 md:px-8">

        <Link href="/admin" className={`${inter.className} text-sm text-[#81766D] hover:text-[#053400]`}>
          ← Admin Dashboard
        </Link>

        <h1 className={`${poppins.className} mt-3 text-4xl font-medium text-[#053400]`}>
          Collections
        </h1>

        <InkFlourish className="mb-10 mt-2 w-[90px]" />

        <div className="grid gap-10 md:grid-cols-[280px_1fr]">

          {/* SIDEBAR: list + create */}
          <div>
            <div className="space-y-2">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => setSelectedId(collection.id)}
                  className={`${inter.className} block w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    selectedId === collection.id
                      ? "border-[#053400] bg-[#E4EDE6] text-[#053400]"
                      : "border-[#DCD4C9] text-[#46382F] hover:border-[#053400]"
                  }`}
                >
                  {collection.title}
                </button>
              ))}
            </div>

            <form onSubmit={createCollection} className="mt-6 space-y-3 rounded-xl border border-[#DCD4C9] bg-white p-4">
              <p className={`${inter.className} text-xs font-medium uppercase tracking-wide text-[#42614A]`}>
                New Collection
              </p>

              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title"
                className={`${inter.className} w-full rounded-lg border border-[#DCD4C9] px-3 py-2 text-sm outline-none focus:border-[#053400]`}
              />

              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className={`${inter.className} w-full rounded-lg border border-[#DCD4C9] px-3 py-2 text-sm outline-none focus:border-[#053400]`}
              />

              <input
                value={newCoverUrl}
                onChange={(e) => setNewCoverUrl(e.target.value)}
                placeholder="Cover image URL (optional)"
                className={`${inter.className} w-full rounded-lg border border-[#DCD4C9] px-3 py-2 text-sm outline-none focus:border-[#053400]`}
              />

              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                className={`${inter.className} w-full rounded-full bg-[#053400] py-2 text-sm font-medium text-white transition hover:bg-[#0B4D2B] disabled:opacity-50`}
              >
                {creating ? "Creating..." : "Create Collection"}
              </button>
            </form>
          </div>

          {/* MAIN: manage pieces */}
          <div>
            {!selectedCollection ? (
              <p className={`${inter.className} text-sm text-[#81766D]`}>
                Select a collection to manage its pieces, or create a new one.
              </p>
            ) : (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className={`${poppins.className} text-2xl font-medium`}>
                    {selectedCollection.title}
                  </h2>

                  <button
                    onClick={() => deleteCollection(selectedCollection.id)}
                    className={`${inter.className} text-xs text-red-600 hover:underline`}
                  >
                    Delete collection
                  </button>
                </div>

                <p className={`${inter.className} mb-2 text-xs font-medium uppercase tracking-wide text-[#42614A]`}>
                  In this collection ({piecesInCollection.length})
                </p>

                <div className="mb-8 space-y-2">
                  {piecesInCollection.length === 0 && (
                    <p className={`${inter.className} text-sm text-[#81766D]`}>Nothing added yet.</p>
                  )}

                  {piecesInCollection.map((piece) => (
                    <div key={piece.id} className="flex items-center justify-between rounded-lg border border-[#DCD4C9] bg-white px-4 py-2.5">
                      <span className={`${inter.className} text-sm`}>{piece.title}</span>
                      <button
                        onClick={() => removePiece(piece.id)}
                        className={`${inter.className} text-xs text-red-600 hover:underline`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <p className={`${inter.className} mb-2 text-xs font-medium uppercase tracking-wide text-[#42614A]`}>
                  Add a published piece
                </p>

                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {piecesNotInCollection.map((piece) => (
                    <div key={piece.id} className="flex items-center justify-between rounded-lg border border-[#DCD4C9] bg-white px-4 py-2.5">
                      <span className={`${inter.className} text-sm`}>{piece.title}</span>
                      <button
                        onClick={() => addPiece(piece.id)}
                        className={`${inter.className} text-xs font-medium text-[#053400] hover:underline`}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
