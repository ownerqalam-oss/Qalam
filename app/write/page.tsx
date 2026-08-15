"use client";

import { Suspense } from "react";
import EditorContent from "../editor/EditorContent";

export default function WritePage() {
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
