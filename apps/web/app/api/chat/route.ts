import { NextResponse } from "next/server";

import { answerWithRag } from "@/lib/rag";
import { matchChunks } from "@/lib/retrieval";

const DEFAULT_TOP_K = 5;
const MIN_TOP_K = 1;
const MAX_TOP_K = 20;

type ChatRequestBody = {
  question?: unknown;
  topK?: unknown;
  traceMode?: unknown;
};

function parseQuestion(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTopK(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_TOP_K;
  }

  const normalized = Math.floor(value);

  if (normalized < MIN_TOP_K) {
    return MIN_TOP_K;
  }

  if (normalized > MAX_TOP_K) {
    return MAX_TOP_K;
  }

  return normalized;
}

function parseTraceMode(value: unknown) {
  return value === true;
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const question = parseQuestion(body.question);
  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const topK = normalizeTopK(body.topK);
  const traceMode = parseTraceMode(body.traceMode);

  try {
    const retrieved = await matchChunks(question, topK);
    const answer = await answerWithRag(question, retrieved);

    return NextResponse.json({
      answer,
      retrieved,
      ...(traceMode
        ? {
            trace: {
              question,
              topK,
              retrieved_count: retrieved.length,
            },
          }
        : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Question is required") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Chat request failed", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
