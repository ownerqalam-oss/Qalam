import Link from "next/link";

export default function NewPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col px-6 py-20">
      <h1 className="mb-10 text-center text-4xl font-bold">
        What are you writing?
      </h1>

      <div className="space-y-4">
        <Link
          href="/editor?type=article"
          className="block rounded-xl border p-6 text-xl transition hover:bg-gray-50"
        >
          📖 Article
        </Link>

        <Link
          href="/editor?type=reflection"
          className="block rounded-xl border p-6 text-xl transition hover:bg-gray-50"
        >
          ✍️ Reflection
        </Link>

        <Link
          href="/editor?type=poetry"
          className="block rounded-xl border p-6 text-xl transition hover:bg-gray-50"
        >
          📜 Poetry
        </Link>

        <Link
            href="/editor?type=story"
            className="block rounded-xl border p-6 text-xl transition hover:bg-gray-50"
        >
            📚 Short Story
        </Link>

      </div>
    </main>

  );
}
