import { NextResponse } from "next/server";

import { parseUploadedDocument } from "@/lib/document-parser";
import { ingestDocumentText } from "@/lib/ingest";

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission" }, { status: 400 });
  }

  const password = asTrimmedString(formData.get("password"));
  const title = asTrimmedString(formData.get("title"));
  const sourceValue = asTrimmedString(formData.get("source"));
  const manualText = asTrimmedString(formData.get("text"));
  const source = sourceValue || null;
  const fileValue = formData.get("file");
  const file = fileValue instanceof File ? fileValue : null;

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

  const hasManualText = manualText.length > 0;
  const hasFile = !!file;

  if (hasManualText && hasFile) {
    return NextResponse.json(
      { error: "Provide either manual text or a file upload, not both." },
      { status: 400 }
    );
  }

  if (!hasManualText && !hasFile) {
    return NextResponse.json(
      { error: "Provide manual text or upload a PDF, DOCX, or TXT file." },
      { status: 400 }
    );
  }

  let text = manualText;

  if (file) {
    try {
      const parsedDocument = await parseUploadedDocument(file);
      text = parsedDocument.text;
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to parse uploaded file";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  try {
    const result = await ingestDocumentText({
      title,
      source,
      text,
    });

    return NextResponse.json({
      ok: true,
      document_id: result.document_id,
      chunks: result.chunks,
      latency_ms: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("Ingestion failed", error);
    const message =
      error instanceof Error && error.message ? error.message : "Ingestion failed";
    const status = message === "No chunks generated" ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
