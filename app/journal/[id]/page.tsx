"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../../../lib/supabase/client";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface Article {
  id: string;
  title: string;
  content: string;
  tagline: string | null;
  type: string;
  tags: string[] | null;
  published_at: string | null;
  user_id: string;
  is_anonymous: boolean;
  cover_image_url: string | null;
}

export default function ArticlePage() {
  const { id } = useParams();

  const [article, setArticle] = useState<Article | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id]);

  async function loadArticle() {
    /*
     * Load the published article.
     */
    const { data: articleData, error: articleError } = await supabase
      .from("drafts")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (articleError || !articleData) {
      console.error("Error loading article:", articleError);
      setLoading(false);
      return;
    }

    setArticle(articleData);

    /*
     * If the article is anonymous, we still load the
     * author's profile privately for the page logic,
     * but we NEVER display it publicly.
     */
    if (!articleData.is_anonymous) {
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, display_name, bio, avatar_url")
          .eq("id", articleData.user_id)
          .single();

      if (profileError) {
        console.error(
          "Error loading writer profile:",
          profileError
        );
      }

      if (profileData) {
        setProfile(profileData);
      }
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F1E8] px-6 py-20 text-[#46382F]">
        <div className="mx-auto max-w-3xl">
          <p className={`${inter.className} text-sm text-[#81766D]`}>
            Loading...
          </p>
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-[#F7F1E8] px-6 py-20 text-[#46382F]">
        <div className="mx-auto max-w-3xl">
          <h1
            className={`${poppins.className} mb-4 text-4xl font-medium`}
          >
            Article not found
          </h1>

          <Link
            href="/journal"
            className={`${inter.className} text-[#053400] hover:underline`}
          >
            ← Back to Journal
          </Link>
        </div>
      </main>
    );
  }

  const isAnonymous = article.is_anonymous;

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <article className="mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-20">

        {/* BACK TO JOURNAL */}
        <Link
          href="/journal"
          className={`${inter.className} mb-12 inline-block text-sm text-[#81766D] transition hover:text-[#053400]`}
        >
          ← Back to Journal
        </Link>

        {/* COVER IMAGE */}
        {article.cover_image_url && (
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="mb-10 h-[220px] w-full rounded-2xl object-cover md:h-[360px]"
          />
        )}

        {/* CATEGORY */}
        <div className="mb-5 flex flex-wrap gap-2">
          <span
            className={`${inter.className} rounded-full bg-[#E9E2D8] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#42614A]`}
          >
            {article.type === "story"
              ? "Short Story"
              : article.type}
          </span>

          {article.tags?.map((tag) => (
            <span
              key={tag}
              className={`${inter.className} rounded-full bg-[#E9E2D8] px-3 py-1 text-xs text-[#70655C]`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* TITLE */}
        <h1
          className={`${poppins.className} max-w-4xl text-[44px] font-medium leading-[1.12] tracking-[-1.5px] text-[#46382F] md:text-[58px]`}
        >
          {article.title}
        </h1>

        {/* TAGLINE */}
        {article.tagline && (
          <p
            className={`${inter.className} mt-6 max-w-3xl text-lg leading-8 text-[#70655C] md:text-xl`}
          >
            {article.tagline}
          </p>
        )}

        {/* WRITER */}
        <div className="mt-8 flex items-center gap-4 border-b border-[#DCD4C9] pb-10">

          {isAnonymous ? (
            <>
              {/* ANONYMOUS AVATAR */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#053400] text-white">
                <span className={`${poppins.className} text-lg`}>
                  Q
                </span>
              </div>

              {/* ANONYMOUS NAME */}
              <div>
                <p
                  className={`${poppins.className} text-[15px] font-medium text-[#46382F]`}
                >
                  Anonymous
                </p>

                {article.published_at && (
                  <p
                    className={`${inter.className} mt-1 text-xs uppercase tracking-[0.12em] text-[#81766D]`}
                  >
                    {new Date(
                      article.published_at
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* NORMAL AVATAR */}
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || "Writer"}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#053400] text-white">
                  <span className={`${poppins.className} text-lg`}>
                    {profile?.display_name
                      ?.charAt(0)
                      .toUpperCase() || "Q"}
                  </span>
                </div>
              )}

              {/* NORMAL NAME + DATE */}
              <div>
                <p
                  className={`${poppins.className} text-[15px] font-medium text-[#46382F]`}
                >
                  {profile?.display_name || "Qalam Writer"}
                </p>

                {article.published_at && (
                  <p
                    className={`${inter.className} mt-1 text-xs uppercase tracking-[0.12em] text-[#81766D]`}
                  >
                    {new Date(
                      article.published_at
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ARTICLE CONTENT */}
        <div
          className={`${inter.className} prose prose-lg mt-12 max-w-none text-[#46382F]`}
          dangerouslySetInnerHTML={{
            __html: article.content,
          }}
        />

        {/* WRITER BIO */}
        {!isAnonymous && profile?.bio && (
          <div className="mt-16 border-t border-[#DCD4C9] pt-10">
            <div className="flex items-start gap-5">

              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || "Writer"}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#053400] text-white">
                  <span className={`${poppins.className} text-xl`}>
                    {profile.display_name
                      ?.charAt(0)
                      .toUpperCase() || "Q"}
                  </span>
                </div>
              )}

              <div>
                <p
                  className={`${inter.className} mb-1 text-xs font-medium uppercase tracking-[0.18em] text-[#42614A]`}
                >
                  Written by
                </p>

                <h2
                  className={`${poppins.className} text-xl font-medium text-[#46382F]`}
                >
                  {profile.display_name || "Qalam Writer"}
                </h2>

                <p
                  className={`${inter.className} mt-2 max-w-2xl text-sm leading-6 text-[#70655C]`}
                >
                  {profile.bio}
                </p>
              </div>

            </div>
          </div>
        )}

      </article>
    </main>
  );
}