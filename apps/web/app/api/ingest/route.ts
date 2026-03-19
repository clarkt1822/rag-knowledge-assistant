import { NextResponse } from "next/server";
import OpenAI from "openai";

import { chunkText } from "@/lib/chunking";
import { createServerSupabaseClient as supabaseService } from "@/lib/supabase-server";

const EMBEDDING_BATCH_SIZE = 64;

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toPgVector(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  let insertedDocumentId: string | null = null;
  const insertedChunkIds: string[] = [];

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};

  const password = typeof payload.password === "string" ? payload.password : "";
  const title = asTrimmedString(payload.title);
  const sourceValue = asTrimmedString(payload.source);
  const text = asTrimmedString(payload.text);
  const source = sourceValue || null;

  const adminPassword = process.env.ADMIN_INGEST_PASSWORD;
  if (!adminPassword) {
    console.error("Missing ADMIN_INGEST_PASSWORD");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const chunks = chunkText(text);
  if (chunks.length === 0) {
    return NextResponse.json({ error: "No chunks generated" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const embedModel = process.env.RAG_EMBED_MODEL || "text-embedding-3-small";
  const openai = new OpenAI({ apiKey });
  const supabase = supabaseService();

  try {
    const { data: documentRow, error: documentError } = await supabase
      .from("documents")
      .insert({
        title,
        source,
      })
      .select("id")
      .single();

    if (documentError || !documentRow) {
      throw new Error(documentError?.message || "Failed to insert document");
    }

    insertedDocumentId = documentRow.id;

    const { data: chunkRows, error: chunkError } = await supabase
      .from("chunks")
      .insert(
        chunks.map((chunk) => ({
          document_id: insertedDocumentId,
          chunk_index: chunk.chunk_index,
          content: chunk.content,
          char_count: chunk.char_count,
        }))
      )
      .select("id, chunk_index");

    if (chunkError || !chunkRows || chunkRows.length !== chunks.length) {
      throw new Error(chunkError?.message || "Failed to insert chunks");
    }

    const chunkIdByIndex = new Map<number, string>();
    for (const row of chunkRows) {
      chunkIdByIndex.set(row.chunk_index, row.id);
      insertedChunkIds.push(row.id);
    }

    for (let start = 0; start < chunks.length; start += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(start, start + EMBEDDING_BATCH_SIZE);

      const embeddingResponse = await openai.embeddings.create({
        model: embedModel,
        input: batch.map((chunk) => chunk.content),
      });

      const embeddingRows = embeddingResponse.data.map((item, index) => {
        const chunk = batch[index];
        const chunkId = chunkIdByIndex.get(chunk.chunk_index);

        if (!chunkId) {
          throw new Error(`Missing chunk id for chunk_index ${chunk.chunk_index}`);
        }

        return {
          chunk_id: chunkId,
          embedding: toPgVector(item.embedding),
        };
      });

      const { error: embeddingError } = await supabase
        .from("embeddings")
        .insert(embeddingRows);

      if (embeddingError) {
        throw new Error(embeddingError.message || "Failed to insert embeddings");
      }
    }

    return NextResponse.json({
      ok: true,
      document_id: insertedDocumentId,
      chunks: insertedChunkIds.length,
      latency_ms: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("Ingestion failed", error);

    if (insertedDocumentId || insertedChunkIds.length > 0) {
      const cleanupClient = supabaseService();

      if (insertedChunkIds.length > 0) {
        const { error: cleanupEmbeddingsError } = await cleanupClient
          .from("embeddings")
          .delete()
          .in("chunk_id", insertedChunkIds);

        if (cleanupEmbeddingsError) {
          console.error("Cleanup failed for embeddings", cleanupEmbeddingsError);
        }
      }

      if (insertedDocumentId) {
        const { error: cleanupChunksError } = await cleanupClient
          .from("chunks")
          .delete()
          .eq("document_id", insertedDocumentId);

        if (cleanupChunksError) {
          console.error("Cleanup failed for chunks", cleanupChunksError);
        }

        const { error: cleanupDocumentError } = await cleanupClient
          .from("documents")
          .delete()
          .eq("id", insertedDocumentId);

        if (cleanupDocumentError) {
          console.error("Cleanup failed for document", cleanupDocumentError);
        }
      }
    }

    return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
  }
}
