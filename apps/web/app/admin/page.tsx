"use client";

import { useRef, useState } from "react";

type IngestResponse = {
  ok?: boolean;
  document_id?: string;
  chunks?: number;
  latency_ms?: number;
  error?: string;
};

const fieldStyle = {
  width: "100%",
  padding: 10,
  border: "1px solid #555",
  borderRadius: 6,
  background: "#111",
  color: "#fff",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function ingest() {
    if (isSubmitting) {
      return;
    }

    setStatus("");

    const normalizedPassword = password.trim();
    const normalizedTitle = title.trim();
    const normalizedSource = source.trim();
    const normalizedText = text.trim();

    if (!normalizedPassword) {
      setStatus("Error: password is required.");
      return;
    }

    if (!normalizedTitle) {
      setStatus("Error: title is required.");
      return;
    }

    if (!normalizedText && !file) {
      setStatus("Error: provide text or upload a file.");
      return;
    }

    if (normalizedText && file) {
      setStatus("Error: provide either text or a file, not both.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Ingesting...");

    try {
      const formData = new FormData();
      formData.set("password", normalizedPassword);
      formData.set("title", normalizedTitle);
      formData.set("source", normalizedSource);
      formData.set("text", normalizedText);

      if (file) {
        formData.set("file", file);
      }

      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      let data: IngestResponse = {};
      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        data = (await res.json()) as IngestResponse;
      } else {
        const message = (await res.text()).trim();
        if (message) {
          data.error = message;
        }
      }

      if (!res.ok || !data.ok) {
        setStatus(`Error: ${data.error ?? `Request failed (${res.status}).`}`);
        return;
      }

      setStatus(
        `Success: document_id=${data.document_id}, chunks=${data.chunks}, latency=${data.latency_ms}ms`
      );

      setTitle("");
      setSource("");
      setText("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      setStatus("Error: unexpected network or server failure.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
      <h1>Admin Ingestion</h1>
      <p>Load a document into the RAG system.</p>
      <p>Provide manual text or upload a PDF, DOCX, or TXT file.</p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void ingest();
        }}
        style={{ display: "grid", gap: 12 }}
      >
        <label>
          <div style={{ marginBottom: 6 }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={isSubmitting}
            required
            style={fieldStyle}
          />
        </label>

        <label>
          <div style={{ marginBottom: 6 }}>Title</div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            required
            style={fieldStyle}
          />
        </label>

        <label>
          <div style={{ marginBottom: 6 }}>Source (optional)</div>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={isSubmitting}
            style={fieldStyle}
          />
        </label>

        <label>
          <div style={{ marginBottom: 6 }}>File (optional)</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
            }}
            disabled={isSubmitting}
            style={fieldStyle}
          />
        </label>

        <label>
          <div style={{ marginBottom: 6 }}>Text</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            disabled={isSubmitting}
            style={fieldStyle}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "fit-content",
            padding: "10px 16px",
            border: "1px solid #555",
            borderRadius: 6,
            background: "#222",
            color: "#fff",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Ingesting..." : "Ingest document"}
        </button>

        {status ? (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              padding: 12,
              border: "1px solid #555",
              borderRadius: 6,
              background: "#111",
              color: "#fff",
            }}
            aria-live="polite"
          >
            {status}
          </pre>
        ) : null}
      </form>
    </main>
  );
}
