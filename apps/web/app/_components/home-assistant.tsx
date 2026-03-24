"use client";

import { FormEvent, useRef, useState } from "react";

type RetrievedChunk = {
  chunk_id: string;
  document_id: string;
  title: string;
  source: string | null;
  content: string;
  similarity: number;
};

type ChatTrace = {
  question?: string;
  topK?: number;
  retrieved_count?: number;
};

type ChatResponse = {
  answer?: string;
  retrieved?: RetrievedChunk[];
  trace?: ChatTrace;
  error?: string;
};

function formatSimilarity(value: number) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return value.toFixed(3);
}

function getPreview(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 220) {
    return normalized;
  }

  return `${normalized.slice(0, 220).trimEnd()}...`;
}

export default function HomeAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [retrieved, setRetrieved] = useState<RetrievedChunk[]>([]);
  const [trace, setTrace] = useState<ChatTrace | null>(null);
  const [traceMode, setTraceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuestion = question.trim();

    if (!normalizedQuestion) {
      setError("Enter a question to query your knowledge base.");
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAnswer("");
    setRetrieved([]);
    setTrace(null);
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: normalizedQuestion,
          topK: 5,
          traceMode,
        }),
        signal: controller.signal,
      });

      let data: ChatResponse | null = null;

      try {
        data = (await response.json()) as ChatResponse;
      } catch {
        data = null;
      }

      if (!response.ok) {
        setError(data?.error ?? "The assistant returned an invalid response.");
        return;
      }

      if (!data) {
        setError("The assistant returned an invalid response.");
        return;
      }

      setAnswer(data.answer ?? "");
      setRetrieved(data.retrieved ?? []);
      setTrace(data.trace ?? null);
    } catch (submitError) {
      if (submitError instanceof DOMException && submitError.name === "AbortError") {
        return;
      }

      console.error(submitError);
      setError("Unable to reach the assistant. Please try again.");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }

  function handleClear() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setQuestion("");
    setAnswer("");
    setRetrieved([]);
    setTrace(null);
    setTraceMode(false);
    setError("");
    setIsLoading(false);
  }

  const hasResult = Boolean(answer) || retrieved.length > 0 || Boolean(trace);

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-4xl rounded-[2rem] border border-slate-300/70 bg-white/78 p-5 shadow-[0_24px_80px_-32px_rgba(30,41,59,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[0_28px_90px_-36px_rgba(0,0,0,0.58)] sm:p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Ask your assistant
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Submit one focused question. Responses are rendered plainly and
                  supporting retrieval stays visible but secondary.
                </p>
              </div>

              <label className="inline-flex items-center gap-3 rounded-full border border-slate-300/70 bg-white/70 px-3 py-2 text-sm text-slate-600 shadow-[0_1px_0_rgba(255,255,255,0.72)_inset] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                <span className="font-medium">Trace mode</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={traceMode}
                  onClick={() => setTraceMode((current) => !current)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-sky-300/70 dark:focus-visible:ring-offset-zinc-950 ${
                    traceMode
                      ? "border-sky-600 bg-gradient-to-r from-sky-600 to-indigo-600 dark:border-sky-300 dark:from-sky-300 dark:to-indigo-200"
                      : "border-slate-300 bg-white dark:border-white/10 dark:bg-zinc-900"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 translate-y-[1px] rounded-full bg-white shadow-sm transition dark:bg-zinc-950 ${
                      traceMode ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-[1.75rem] border border-slate-300/80 bg-white/82 p-3 shadow-[0_18px_45px_-28px_rgba(59,130,246,0.2)] dark:border-white/10 dark:bg-white/[0.04]">
              <label className="sr-only" htmlFor="question">
                Ask a question
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="What does our knowledge base say about..."
                rows={5}
                className="w-full resize-none bg-transparent px-3 py-3 text-base leading-7 text-zinc-950 outline-none placeholder:text-slate-400 dark:text-zinc-50 dark:placeholder:text-zinc-500"
              />
              <div className="flex flex-col gap-3 border-t border-slate-200/80 px-3 pt-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Uses `topK: 5` retrieval against your indexed corpus.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-900/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.05] dark:focus-visible:ring-white/20"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex min-w-24 items-center justify-center rounded-full bg-gradient-to-r from-sky-600 via-sky-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-[0_14px_30px_-16px_rgba(37,99,235,0.7)] transition hover:from-sky-500 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-zinc-950"
                  >
                    {isLoading ? "Thinking..." : "Ask"}
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
                {error}
              </div>
            ) : null}
          </form>

          {!hasResult && !isLoading ? (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(241,245,249,0.92))] px-6 py-12 text-center dark:border-white/15 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.035))]">
              <div className="mx-auto max-w-xl space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                  Ready
                </p>
                <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-zinc-100">
                  Ask a question to see grounded results.
                </h3>
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                  Answers will appear here with retrieved source chunks and
                  optional trace details when enabled.
                </p>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-[1.75rem] border border-slate-300/80 bg-white/85 px-6 py-8 shadow-[0_12px_40px_-28px_rgba(59,130,246,0.22)] dark:border-white/10 dark:bg-white/[0.04]">
              <div className="space-y-4">
                <div className="h-3 w-28 rounded-full bg-slate-200 dark:bg-zinc-800" />
                <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-zinc-800" />
                <div className="h-4 w-[92%] rounded-full bg-slate-200 dark:bg-zinc-800" />
                <div className="h-4 w-[78%] rounded-full bg-slate-200 dark:bg-zinc-800" />
              </div>
            </div>
          ) : null}

          {answer ? (
            <div className="rounded-[1.75rem] border border-slate-300/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-6 shadow-[0_22px_50px_-30px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.04))]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Answer
                </p>
              </div>
              <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700 dark:text-zinc-200">
                {answer}
              </p>
            </div>
          ) : null}

          {retrieved.length > 0 ? (
            <div className="space-y-4 rounded-[1.75rem] border border-slate-300/70 bg-white/50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="space-y-1">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Retrieved Context
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Supporting chunks used to ground the response.
                </p>
              </div>

              <div className="grid gap-3">
                {retrieved.map((chunk, index) => (
                  <article
                    key={chunk.chunk_id}
                    className="rounded-2xl border border-slate-200/80 bg-white/78 p-4 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Source {index + 1}
                        </p>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {chunk.title}
                        </h3>
                        {chunk.source ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {chunk.source}
                          </p>
                        ) : null}
                      </div>

                      {formatSimilarity(chunk.similarity) ? (
                        <div className="rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
                          Similarity {formatSimilarity(chunk.similarity)}
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {getPreview(chunk.content)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {trace ? (
            <details className="rounded-[1.5rem] border border-slate-300/70 bg-white/55 p-5 text-sm dark:border-white/10 dark:bg-white/[0.03]">
              <summary className="cursor-pointer list-none font-medium text-slate-600 marker:hidden dark:text-slate-300">
                <span className="inline-flex items-center gap-2">
                  Debug trace
                  <span className="text-slate-400 dark:text-zinc-500">
                    optional diagnostic metadata
                  </span>
                </span>
              </summary>
              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
                {JSON.stringify(trace, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  );
}
