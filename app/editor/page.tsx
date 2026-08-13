"use client";

import { Suspense } from "react";
import EditorContent from "./EditorContent";

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-4xl px-8 py-12">
          <p className="text-sm text-gray-500">Loading editor...</p>
        </main>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
