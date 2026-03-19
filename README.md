# RAG Knowledge Assistant

A grounded, inspectable, and measurable Retrieval-Augmented Generation (RAG) system built with modern, production-relevant tooling.

---

## 🚀 Overview

RAG Knowledge Assistant is a general-purpose RAG architecture designed to:

* Ingest arbitrary documents
* Chunk and embed them into vector space
* Store embeddings using pgvector (Supabase)
* Retrieve relevant context for grounded AI responses

The system is intentionally:

* **Simple** → easy to understand and debug
* **Inspectable** → no hidden magic or opaque pipelines
* **Composable** → can be adapted to any domain later

---

## 🧠 Architecture

```
Document
  ↓
Chunking (deterministic, overlap-aware)
  ↓
Embeddings (OpenAI)
  ↓
Vector Storage (Supabase pgvector)
  ↓
Similarity Retrieval (RPC)
  ↓
LLM Response (grounded with sources)
```

---

## 🛠 Tech Stack

* **Frontend / API:** Next.js (App Router)
* **Database:** Supabase (Postgres + pgvector)
* **Embeddings:** OpenAI
* **Vector Search:** cosine similarity via pgvector

---

## 📦 Core Features

### 1. Document Ingestion

* Accepts raw text documents
* Splits into deterministic chunks
* Stores document + chunk metadata

### 2. Embedding Pipeline

* Batch embedding generation
* Cost-aware design
* Stored in `vector(1536)` format

### 3. Vector Storage

* Uses pgvector inside Supabase
* Indexed with HNSW for fast retrieval

### 4. Retrieval

* RPC function: `match_chunks`
* Returns:

  * content
  * similarity score
  * source metadata

### 5. Grounded Responses (planned)

* Responses will include retrieved context
* Supports “I don’t know” fallback when retrieval is weak

---

## 🔐 Design Principles

* **Server-side only retrieval logic**
* **No OpenAI calls in client components**
* **Strict separation of browser vs server environments**
* **No secret leakage to the client**
* **Minimal, inspectable code over abstraction-heavy design**

---

## ⚙️ Project Structure

```
/apps
  /web
    /app
      /api
        /ingest
    /lib
      chunking.ts
      supabase-browser.ts
      supabase-server.ts

/supabase
  /migrations

/docs
/eval
```

---

## 🧪 Current Status

* ✅ Database schema (documents, chunks, embeddings, query_logs)
* ✅ pgvector + HNSW index
* ✅ Chunking system
* ✅ Ingestion API (document → chunks → embeddings)
* ⏳ Retrieval + query pipeline (next)
* ⏳ Response generation with sources

---

## 🔄 Example Ingestion Flow

```
POST /api/ingest

{
  "password": "***",
  "title": "Example Document",
  "source": "manual",
  "text": "Your raw document text..."
}
```

Response:

```
{
  "ok": true,
  "document_id": "uuid",
  "chunks": 12,
  "latency_ms": 850
}
```

---

## 🧠 Why This Project Exists

Most RAG examples are either:

* over-simplified (toy demos)
* or over-engineered (hard to follow)

This project aims to sit in the middle:

→ **real enough to matter**
→ **simple enough to understand**

---

## 📈 Future Improvements

* Query + retrieval API
* Source-cited responses
* Evaluation pipeline (precision / recall)
* Streaming responses
* UI for document upload + querying

---

## 🧑‍💻 Getting Started

1. Clone the repo
2. Configure environment variables
3. Run:

```
cd apps/web
npm install
npm run dev
```

4. Use `/api/ingest` to add documents

---

## 🧭 Build Philosophy

This project is being built in public with a focus on:

* understanding systems deeply
* avoiding unnecessary abstraction
* validating each step before moving forward

---

## 📬 Notes

This is an evolving system. The goal is not perfection — it’s clarity, correctness, and steady progress.

---

## 🪪 License

MIT
