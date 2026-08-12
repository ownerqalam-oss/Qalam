"use client";

import { useEffect } from "react";

export function FeedErrorBoundary({ error, retry, title }: { error: Error & { digest?: string }; retry: () => void; title: string }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="mx-auto max-w-4xl px-6 py-12"><h1 className="text-3xl font-bold">{title}</h1><p className="mt-3 text-gray-600">Something unexpected happened while loading this page.</p><button type="button" onClick={retry} className="mt-6 rounded-full border border-[#053400] px-5 py-2 text-sm font-semibold text-[#053400] hover:bg-[#F1EAE0]">Try again</button></main>;
}
