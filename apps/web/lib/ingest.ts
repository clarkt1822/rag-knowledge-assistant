import OpenAI from "openai";

import { chunkText } from "@/lib/chunking";
import { createServerSupabaseClient as supabaseService } from "@/lib/supabase-server";

const EMBEDDING_BATCH_SIZE = 64;

export type IngestInput = {
  title: string;
  source: string | null;
  text: string;
};

export type IngestResult = {
  document_id: string;
  chunks: number;
};

function toPgVector(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

export async function ingestDocumentText({
  title,
  source,
  text,
}: IngestInput): Promise<IngestResult> {
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    throw new Error("No chunks generated");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const embedModel = process.env.RAG_EMBED_MODEL || "text-embedding-3-small";
  const openai = new OpenAI({ apiKey });
  const supabase = supabaseService();

  let insertedDocumentId: string | null = null;
  const insertedChunkIds: string[] = [];

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

    if (!insertedDocumentId) {
      throw new Error("Failed to insert document");
    }

    return {
      document_id: insertedDocumentId,
      chunks: insertedChunkIds.length,
    };
  } catch (error) {
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

    throw error;
  }
}
