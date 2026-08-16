"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";

interface Article {
  id: string;
  title: string;
  tagline: string | null;
  type: string;
  tags: string[] | null;
  published_at: string;
}

export default function JournalPage() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    const { data, error } = await supabase
      .from("drafts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (!error && data) {
      setArticles(data);
    }
  }

  function sectionTitle(type: string) {
    switch (type) {
      case "story":
        return "📚 Short Stories";
      case "poetry":
        return "📜 Poetry";
      case "reflection":
        return "✍️ Reflections";
      default:
        return "📖 Articles";
    }
  }

  const types = ["article", "story", "poetry", "reflection"];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-3 text-5xl font-bold">Journal</h1>

      <p className="mb-12 text-gray-600">
        Discover thoughtful writing from the Qalam community.
      </p>

      {types.map((type) => {
        const posts = articles.filter((a) => a.type === type);

        if (posts.length === 0) return null;

        return (
          <section key={type} className="mb-16">
            <h2 className="mb-6 text-3xl font-bold">
              {sectionTitle(type)}
            </h2>

            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/journal/${post.id}`}
                  className="block rounded-xl border p-6 transition hover:border-black"
                >
                  <h3 className="text-2xl font-semibold">
                    {post.title}
                  </h3>

                  {post.tagline && (
                    <p className="mt-2 text-gray-600">
                      {post.tagline}
                    </p>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-3 py-1 text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="mt-4 text-sm text-gray-500">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : ""}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {articles.length === 0 && (
        <div className="rounded-xl border p-10 text-center text-gray-500">
          No published articles yet.
        </div>
      )}
    </main>
  );
}
