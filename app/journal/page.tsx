import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "../../lib/seo";
import JournalContent from "./JournalContent";

export const metadata: Metadata = pageMetadata({
  title: "Journal",
  description:
    "Articles, poetry, reflections and short stories from Muslim writers on Qalam.",
  path: "/journal",
});

export default function JournalPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#F7F1E8]" />}>
      <JournalContent />
    </Suspense>
  );
}
