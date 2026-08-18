"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { supabase } from "../lib/supabase/client";
import { useAuth } from "./AuthProvider";

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

interface NotificationRow {
  id: number;
  type: "like" | "comment" | "follow";
  draft_id: number | null;
  actor_id: string;
  actor_count: number;
  created_at: string;
  updated_at: string;
  read_at: string | null;
}

interface ActorProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface DraftInfo {
  id: number;
  title: string;
}

export default function NotificationBell() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [actors, setActors] = useState<ActorProfile[]>([]);
  const [drafts, setDrafts] = useState<DraftInfo[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) return;

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadNotifications() {
    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, type, draft_id, actor_id, actor_count, created_at, updated_at, read_at"
      )
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error || !data) return;

    setNotifications(data);

    const actorIds = Array.from(new Set(data.map((n) => n.actor_id)));

    if (actorIds.length > 0) {
      const { data: actorData } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", actorIds);

      if (actorData) setActors(actorData);
    }

    const draftIds = Array.from(
      new Set(
        data
          .filter((n) => n.draft_id !== null)
          .map((n) => n.draft_id as number)
      )
    );

    if (draftIds.length > 0) {
      const { data: draftData } = await supabase
        .from("drafts")
        .select("id, title")
        .in("id", draftIds);

      if (draftData) setDrafts(draftData);
    }
  }

  function getActor(id: string) {
    return actors.find((a) => a.id === id);
  }

  function getDraft(id: number | null) {
    if (id === null) return null;
    return drafts.find((d) => d.id === id);
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  async function toggleOpen() {
    const next = !open;
    setOpen(next);

    if (next && unreadCount > 0) {
      const unreadIds = notifications
        .filter((n) => !n.read_at)
        .map((n) => n.id);

      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((n) =>
          unreadIds.includes(n.id) ? { ...n, read_at: readAt } : n
        )
      );

      await supabase
        .from("notifications")
        .update({ read_at: readAt })
        .in("id", unreadIds);
    }
  }

  function notificationText(n: NotificationRow) {
    const actor = getActor(n.actor_id);
    const name = actor?.display_name || "Someone";
    const others =
      n.actor_count > 1
        ? ` and ${n.actor_count - 1} other${n.actor_count > 2 ? "s" : ""}`
        : "";

    if (n.type === "like") return `${name}${others} liked your piece`;
    if (n.type === "comment")
      return `${name}${others} commented on your piece`;
    return `${name}${others} started following you`;
  }

  function notificationHref(n: NotificationRow) {
    if (n.type === "follow") return "/dashboard";

    const draft = getDraft(n.draft_id);
    return draft ? `/journal/${draft.id}` : "/dashboard";
  }

  if (!session) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#E9E2D8]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.73 21a2 2 0 0 1-3.46 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B8860B] px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-[#DCD4C9] bg-white shadow-lg">
          {notifications.length === 0 ? (
            <p
              className={`${inter.className} p-5 text-sm text-[#81766D]`}
            >
              No notifications yet.
            </p>
          ) : (
            <div className="divide-y divide-[#DCD4C9]">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={notificationHref(n)}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 transition hover:bg-[#F1E7D3] ${
                    !n.read_at ? "bg-[#E4EDE6]" : ""
                  }`}
                >
                  <p
                    className={`${inter.className} text-sm text-[#46382F]`}
                  >
                    {notificationText(n)}
                  </p>

                  <p
                    className={`${inter.className} mt-1 text-xs text-[#9A9188]`}
                  >
                    {new Date(n.updated_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
