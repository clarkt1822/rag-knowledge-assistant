import HomeAssistant from "./_components/home-assistant";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,_rgba(250,252,255,0.98)_0%,_rgba(243,246,252,0.96)_46%,_rgba(238,243,250,0.92)_100%)] px-6 py-10 text-zinc-950 dark:bg-[linear-gradient(180deg,_rgba(9,9,11,1)_0%,_rgba(14,17,24,0.98)_48%,_rgba(18,22,30,0.96)_100%)] dark:text-zinc-50 sm:px-8 sm:py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-x-0 top-[-12rem] h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_52%)] dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.16),_transparent_56%)]" />
        <div className="absolute left-[-8rem] top-32 h-72 w-72 rounded-full bg-sky-200/45 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-400/10" />
        <div className="absolute bottom-[-8rem] left-1/2 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-white/60 blur-3xl dark:bg-white/[0.03]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-10">
        <section className="max-w-3xl space-y-4">
          <div className="inline-flex rounded-full border border-slate-300/70 bg-white/75 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-600 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
            Grounded Answers
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
              RAG Knowledge Assistant
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Ask a real question against your indexed knowledge base and get a
              grounded answer with supporting context when available.
            </p>
          </div>
        </section>

        <HomeAssistant />
      </div>
    </main>
  );
}
