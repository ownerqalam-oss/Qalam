"use client";

import { Suspense } from "react";
import JournalContent from "./JournalContent";

export default function JournalPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#F7F1E8]" />}>
      <JournalContent />
    </Suspense>
  );
}
