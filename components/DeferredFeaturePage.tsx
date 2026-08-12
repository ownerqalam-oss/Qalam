import Link from "next/link";

export default function DeferredFeaturePage({ title, description }: { title: string; description: string }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#42614A]">Coming soon</p>
      <h1 className="mt-4 text-4xl font-bold text-[#053400] sm:text-5xl">{title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">{description}</p>
      <Link href="/journal" className="mt-8 inline-block rounded-full bg-[#053400] px-5 py-3 text-sm font-medium text-white">Browse the Journal</Link>
    </main>
  );
}
