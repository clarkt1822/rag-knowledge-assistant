import "server-only";

import OpenAI from "openai";

import { createServerSupabaseClient } from "@/lib/supabase-server";

const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;

export type RetrievedChunk = {
  chunk_id: string;
  document_id: string;
  title: string;
  source: string | null;
  content: string;
  similarity: number;
};

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
}

function getEmbeddingModel() {
  return process.env.RAG_EMBED_MODEL || "text-embedding-3-small";
}

function normalizeQuestion(question: string) {
  const normalized = question.trim();

  if (!normalized) {
    throw new Error("Question is required");
  }

  return normalized;
}

function normalizeTopK(topK: number) {
  if (!Number.isFinite(topK)) {
    return DEFAULT_TOP_K;
  }

  const normalized = Math.floor(topK);

  if (normalized < 1) {
    return 1;
  }

  if (normalized > MAX_TOP_K) {
    return MAX_TOP_K;
  }

  return normalized;
}

export async function embedQuery(question: string) {
  const normalizedQuestion = normalizeQuestion(question);
  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model: getEmbeddingModel(),
    input: normalizedQuestion,
  });

  const embedding = response.data[0]?.embedding;

  if (!embedding) {
    throw new Error("Failed to create query embedding");
  }

  return embedding;
}

export async function matchChunks(question: string, topK: number) {
  const normalizedQuestion = normalizeQuestion(question);
  const matchCount = normalizeTopK(topK);
  const queryEmbedding = await embedQuery(normalizedQuestion);
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(error.message || "Failed to retrieve matching chunks");
  }

  return (data ?? []) as RetrievedChunk[];
}
