import { readFileSync } from "node:fs";
import path from "node:path";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MIN_PDF_TEXT_LENGTH = 20;

const SUPPORTED_FILE_TYPES = new Map<string, string>([
  ["application/pdf", ".pdf"],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".docx",
  ],
  ["text/plain", ".txt"],
]);

export type ParsedDocument = {
  fileName: string;
  mimeType: string;
  text: string;
};

function getExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const lastDot = normalized.lastIndexOf(".");
  return lastDot >= 0 ? normalized.slice(lastDot) : "";
}

function isSupportedFile(file: File) {
  const extension = getExtension(file.name);

  if (extension === ".pdf" || extension === ".docx" || extension === ".txt") {
    return true;
  }

  return SUPPORTED_FILE_TYPES.has(file.type);
}

function normalizeExtractedText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

let isPdfWorkerConfigured = false;

function ensurePdfWorker() {
  if (!isPdfWorkerConfigured) {
    const workerPath = path.join(
      process.cwd(),
      "node_modules",
      "pdf-parse",
      "dist",
      "worker",
      "pdf.worker.mjs"
    );
    const workerSource = readFileSync(workerPath, "utf8");
    const workerDataUrl = `data:text/javascript;base64,${Buffer.from(workerSource).toString("base64")}`;

    PDFParse.setWorker(workerDataUrl);
    isPdfWorkerConfigured = true;
  }
}

export async function parseUploadedDocument(file: File): Promise<ParsedDocument> {
  if (!isSupportedFile(file)) {
    throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT file.");
  }

  if (file.size === 0) {
    throw new Error("Uploaded file is empty.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Uploaded file is too large. Max size is 10 MB.");
  }

  const extension = getExtension(file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (extension === ".txt" || file.type === "text/plain") {
    const text = normalizeExtractedText(new TextDecoder("utf-8").decode(buffer));

    if (!text) {
      throw new Error("Uploaded TXT file is empty.");
    }

    return {
      fileName: file.name,
      mimeType: file.type || "text/plain",
      text,
    };
  }

  if (
    extension === ".docx" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    const text = normalizeExtractedText(result.value);

    if (!text) {
      throw new Error("Could not extract any text from the DOCX file.");
    }

    return {
      fileName: file.name,
      mimeType:
        file.type ||
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      text,
    };
  }

  if (extension === ".pdf" || file.type === "application/pdf") {
    ensurePdfWorker();

    let parser: PDFParse | null = null;

    try {
      parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const text = normalizeExtractedText(result.text);

      if (!text || text.length < MIN_PDF_TEXT_LENGTH) {
        throw new Error(
          "Could not extract enough text from the PDF. It may be scanned, and OCR is not supported yet."
        );
      }

      return {
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        text,
      };
    } finally {
      if (parser) {
        await parser.destroy();
      }
    }
  }

  throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT file.");
}
