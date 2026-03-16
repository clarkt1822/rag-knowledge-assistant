export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-20">
      <section className="w-full max-w-3xl rounded-3xl border border-black/10 bg-white/70 p-10 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="mb-6 inline-flex rounded-full border border-black/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-600 dark:border-white/10 dark:text-zinc-400">
          Public Scaffold
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
            RAG Knowledge Assistant
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
            A minimal production-minded shell for a retrieval-augmented
            knowledge assistant. This placeholder page exists to keep the
            scaffold intentional while core search, ingestion, and chat flows
            are built out.
          </p>
        </div>
      </section>
    </main>
  );
}
