"use client";

import { Suspense } from "react";
import EditorContent from "./EditorContent";

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7F1E8] px-8 py-12">
          <div className="mx-auto max-w-4xl">
            <div className="h-16 w-2/3 animate-pulse rounded bg-[#EFE8DC]" />
          </div>
        </main>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
