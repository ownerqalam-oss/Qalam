"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

interface Article {
  id: string;
  title: string;
  content: string;
  tagline: string | null;
  type: string;
  tags: string[] | null;
  published_at: string | null;
}

export default function ArticlePage() {
  const { id } = useParams();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, []);

  async function loadArticle() {
    const { data, error } = await supabase
      .from("drafts")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (!error && data) {
      setArticle(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20">
        Loading...
      </main>
    );
  }

  if (!article) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="mb-4 text-4xl font-bold">
          Article not found
        </h1>

        <Link
          href="/journal"
          className="text-blue-600"
        >
          ← Back to Journal
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/journal"
        className="mb-10 inline-block text-gray-500 hover:text-black"
      >
        ← Back to Journal
      </Link>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm capitalize">
          {article.type}
        </span>

        {article.tags?.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      <h1 className="mb-4 text-5xl font-bold">
        {article.title}
      </h1>

      {article.tagline && (
        <p className="mb-8 text-xl text-gray-600">
          {article.tagline}
        </p>
      )}

      {article.published_at && (
        <p className="mb-10 text-sm text-gray-500">
          {new Date(article.published_at).toLocaleDateString()}
        </p>
      )}

      <article
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{
          __html: article.content,
        }}
      />
    </main>
  );
}
