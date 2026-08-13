"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Poppins, Inter } from "next/font/google";
import { supabase } from "../../../lib/supabase";

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
}

export default function WriterPage() {
  const { id } = useParams();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Controls enlarged profile picture
  const [showAvatar, setShowAvatar] = useState(false);

  useEffect(() => {
    if (id) {
      loadWriter();
    }
  }, [id]);

  async function loadWriter() {
    // Load writer profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, bio, avatar_url")
      .eq("id", id)
      .single();

    if (profileError || !profileData) {
      console.error("Error loading writer:", profileError);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    // Load published articles
    const { data: articleData, error: articleError } = await supabase
      .from("drafts")
      .select("id, title")
      .eq("user_id", id)
      .eq("status", "published");

    if (articleError) {
      console.error("ARTICLE ERROR MESSAGE:", articleError.message);
      console.error("ARTICLE ERROR CODE:", articleError.code);
      console.error("ARTICLE ERROR DETAILS:", articleError.details);
      console.error("ARTICLE ERROR HINT:", articleError.hint);
    }

    if (articleData) {
      setArticles(articleData);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F1E8] px-8 py-20 text-[#46382F]">
        Loading...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#F7F1E8] px-8 py-20 text-[#46382F]">
        <div className="mx-auto max-w-4xl">
          <h1 className={`${poppins.className} text-4xl`}>
            Writer not found
          </h1>

          <Link
            href="/writers"
            className={`${inter.className} mt-6 inline-block text-[#053400]`}
          >
            ← Back to Writers
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <div className="mx-auto max-w-[1180px] px-8 py-16">

        {/* BACK */}
        <Link
          href="/writers"
          className={`${inter.className} text-sm text-[#81766D] hover:text-[#053400]`}
        >
          ← Back to Writers
        </Link>

        {/* PROFILE */}
        <section className="mt-12 border-b border-[#DCD4C9] pb-12">
          <div className="flex items-center gap-6">

            {/* PROFILE PICTURE */}
            {profile.avatar_url ? (
              <button
                type="button"
                onClick={() => setShowAvatar(true)}
                className="cursor-zoom-in rounded-full focus:outline-none"
                aria-label="View profile picture"
              >
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || "Writer"}
                  className="h-24 w-24 rounded-full object-cover transition hover:opacity-90"
                />
              </button>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#053400] text-white">
                <span className={`${poppins.className} text-3xl`}>
                  {profile.display_name?.charAt(0).toUpperCase() || "Q"}
                </span>
              </div>
            )}

            <div>
              <p
                className={`${inter.className} text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]`}
              >
                QALAM WRITER
              </p>

              <h1
                className={`${poppins.className} mt-2 text-4xl font-medium text-[#053400] md:text-5xl`}
              >
                {profile.display_name || "Qalam Writer"}
              </h1>
            </div>
          </div>

          {profile.bio && (
            <p
              className={`${inter.className} mt-7 max-w-2xl text-[15px] leading-7 text-[#70655C]`}
            >
              {profile.bio}
            </p>
          )}
        </section>

        {/* WRITING */}
        <section className="mt-12">

          <div className="flex items-center justify-between border-b border-[#DCD4C9] pb-6">
            <h2
              className={`${poppins.className} text-3xl font-medium`}
            >
              Writing
            </h2>

            <span
              className={`${inter.className} text-sm text-[#81766D]`}
            >
              {articles.length}{" "}
              {articles.length === 1 ? "piece" : "pieces"}
            </span>
          </div>

          {articles.length === 0 ? (
            <p
              className={`${inter.className} py-10 text-sm text-[#81766D]`}
            >
              No published writing yet.
            </p>
          ) : (
            <div className="divide-y divide-[#DCD4C9]">

              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/journal/${article.id}`}
                  className="group block py-8"
                >
                  <p
                    className={`${inter.className} text-[11px] font-medium uppercase tracking-[0.2em] text-[#42614A]`}
                  >
                    QALAM
                  </p>

                  <h3
                    className={`${poppins.className} mt-2 text-2xl font-medium group-hover:text-[#053400]`}
                  >
                    {article.title}
                  </h3>
                </Link>
              ))}

            </div>
          )}

        </section>
      </div>

      {/* PROFILE PICTURE LIGHTBOX */}
      {showAvatar && profile.avatar_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6"
          onClick={() => setShowAvatar(false)}
        >
          {/* CLOSE BUTTON */}
          <button
            type="button"
            onClick={() => setShowAvatar(false)}
            className="absolute right-6 top-6 text-4xl font-light text-white transition hover:opacity-70"
            aria-label="Close profile picture"
          >
            ×
          </button>

          {/* LARGE IMAGE */}
          <img
            src={profile.avatar_url}
            alt={profile.display_name || "Writer"}
            className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
