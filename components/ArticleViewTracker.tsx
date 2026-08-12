"use client";

import { useEffect } from "react";

export function ArticleViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let sent = false;

    function stopTimer() {
      if (timer) clearTimeout(timer);
      timer = null;
    }

    function startTimer() {
      stopTimer();
      if (sent || document.visibilityState !== "visible") return;
      timer = setTimeout(() => {
        sent = true;
        void fetch(`/api/posts/${postId}/view`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}" });
      }, 3000);
    }

    startTimer();
    document.addEventListener("visibilitychange", startTimer);
    return () => { stopTimer(); document.removeEventListener("visibilitychange", startTimer); };
  }, [postId]);

  return null;
}
