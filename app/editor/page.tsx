"use client";

import { Suspense } from "react";
import EditorContent from "./EditorContent";
import AyahLoader from "../../components/AyahLoader";

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7F1E8]">
          <AyahLoader />
        </main>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
