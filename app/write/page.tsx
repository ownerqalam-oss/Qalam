"use client";

import { Suspense } from "react";
import EditorContent from "../editor/EditorContent";
import AyahLoader from "../../components/AyahLoader";

export default function WritePage() {
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
