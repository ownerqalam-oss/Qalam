export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-gray-500">
          Reviving the Pen
        </p>

        <h1 className="text-6xl font-bold tracking-tight">
          Qalam
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          A home for Muslim writers and readers. Essays, articles, poetry and
          stories rooted in sincerity.
        </p>

        <div className="mt-10 flex gap-4">
          <a
            href="/journal"
            className="rounded-md bg-black px-6 py-3 text-white"
          >
            Read the Journal
          </a>

          <a
            href="/login"
            className="rounded-md border border-gray-300 px-6 py-3"
          >
            Write
          </a>
        </div>
      </section>

      {/* Editor's Choice */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-6 text-3xl font-bold">
          Editor's Choice
        </h2>

        <div className="rounded-xl border p-8">
          <p className="text-gray-500">Coming Soon</p>
        </div>
      </section>

      {/* Latest Writing */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-6 text-3xl font-bold">
          Latest Writing
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border p-6">Articles</div>
          <div className="rounded-xl border p-6">Essays</div>
          <div className="rounded-xl border p-6">Poetry</div>
          <div className="rounded-xl border p-6">Stories</div>
        </div>
      </section>

      {/* Become a Writer */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">
          Become a Writer
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-gray-600">
          Qalam is currently invite-only for writers. If you've been invited,
          continue writing. If not, enjoy the journal and follow our journey.
        </p>

        <a
          href="/login"
          className="mt-8 inline-block rounded-md border px-6 py-3"
        >
          Write for Qalam
        </a>
      </section>
    </main>
  );
}
