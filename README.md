# RAG Knowledge Assistant

RAG Knowledge Assistant is a Next.js + Supabase project for ingesting documents, storing embeddings in pgvector, retrieving relevant chunks, and generating grounded answers from those retrieved sources.

The repository currently includes:

- A public chat UI at `/`
- An admin ingestion UI at `/admin`
- A chat API at `/api/chat`
- An ingestion API at `/api/ingest`
- Supabase SQL files for schema setup and retrieval
- An evaluation script for exercising `/api/chat`

## Current Behavior

Today, the project can:

- Accept manual text ingestion through the admin flow
- Accept file ingestion for PDF, DOCX, and TXT documents
- Chunk document text and store chunk metadata
- Generate embeddings with OpenAI
- Store embeddings in Supabase using pgvector
- Retrieve similar chunks through the `match_chunks` SQL function
- Generate answers grounded in retrieved chunks
- Return retrieval metadata and optional trace data from the chat API

Known limits in the current implementation:

- PDF ingestion does not support OCR for scanned PDFs
- Uploaded files larger than 10 MB are rejected
- The chat route defaults `topK` to `5` and clamps values to the range `1` to `20`
- TODO: clarify whether the root `.env.example` should remain part of the supported setup flow, because the runnable app lives in `apps/web`

## Tech Stack

- Frontend and API: Next.js App Router
- Database: Supabase Postgres with pgvector
- Embeddings and answer generation: OpenAI
- Retrieval: cosine similarity via Supabase RPC
- Evaluation runner: `tsx`

## Project Structure

```text
apps/
  web/
    app/
      _components/
        home-assistant.tsx
      admin/
        page.tsx
      api/
        chat/
          route.ts
        ingest/
          route.ts
      globals.css
      layout.tsx
      page.tsx
    lib/
      chunking.ts
      document-parser.ts
      ingest.ts
      rag.ts
      retrieval.ts
      supabase-browser.ts
      supabase-server.ts
    scripts/
      eval_rag.ts
    .env.example
    package.json
docs/
eval/
  questions.json
supabase/
  migrations/
    001_init.sql
    002_match_chunks.sql
CONTRIBUTING.md
README.md
```

## Quick Start

### 1. Prerequisites

You need:

- Node.js
- npm
- A Supabase project
- An OpenAI API key

TODO: document an explicit Node.js version if the project decides to pin one.

### 2. Install dependencies

From the web app directory:

```bash
cd apps/web
npm install
```

### 3. Configure environment variables

For local development, put the web app environment variables in:

```text
apps/web/.env.local
```

Start from:

```text
apps/web/.env.example
```

Use placeholder values like these:

```env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
RAG_CHAT_MODEL=gpt-4.1-mini
RAG_EMBED_MODEL=text-embedding-3-small
ADMIN_INGEST_PASSWORD=YOUR_ADMIN_PASSWORD
```

Notes:

- `OPENAI_API_KEY` is required for both embeddings and answer generation
- `NEXT_PUBLIC_SUPABASE_URL` is required by both browser and server Supabase clients
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is browser-safe
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must not be exposed to the client
- `RAG_CHAT_MODEL` is optional; the current code falls back to `gpt-4.1-mini`
- `RAG_EMBED_MODEL` is optional; the current code falls back to `text-embedding-3-small`
- `ADMIN_INGEST_PASSWORD` is required by `/api/ingest`
- `EVAL_BASE_URL` is optional and is only used by the evaluation script
- `apps/web/.env.local` is for local-only values and should not be committed

Implementation note:

- `apps/web/.env.example` currently includes `RAG_TOP_K`, but the current code does not read that variable. The chat route uses request input and defaults to `5`.

### 4. Initialize Supabase

Create a Supabase project, then run the SQL in these files against that project:

- `supabase/migrations/001_init.sql`
- `supabase/migrations/002_match_chunks.sql`

These files create:

- The required extensions
- The `documents`, `chunks`, `embeddings`, and `query_logs` tables
- The HNSW vector index
- The `match_chunks` SQL function used by retrieval

How to run the SQL:

1. Open your Supabase project.
2. Open the SQL editor, or use another SQL client connected to the same database.
3. Run `001_init.sql`.
4. Run `002_match_chunks.sql`.

TODO: document a verified CLI-based migration workflow if one is added to the repo.

### 5. Start the app

From `apps/web`:

```bash
npm run dev
```

Then open:

- `http://localhost:3000/` for the chat UI
- `http://localhost:3000/admin` for the admin ingestion UI

## Available Commands

Run these from `apps/web`:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run eval
```

What they do:

- `dev`: starts the Next.js dev server
- `build`: creates a production build
- `start`: starts the production server
- `lint`: runs ESLint
- `eval`: runs `scripts/eval_rag.ts`

The evaluation script writes its report to:

```text
docs/evaluation.md
```

If you need a non-default target for evaluation, set:

```env
EVAL_BASE_URL=http://localhost:3000
```

## API Overview

### `POST /api/chat`

Request body:

```json
{
  "question": "What does the knowledge base say about vector search?",
  "topK": 5,
  "traceMode": true
}
```

Behavior:

- `question` is required
- `topK` is optional
- if `topK` is missing or invalid, the route defaults to `5`
- `topK` is clamped to the range `1` to `20`
- if `traceMode` is `true`, the response includes trace metadata

Example response:

```json
{
  "answer": "Vector search is implemented with Supabase pgvector and cosine similarity. [Source 1]",
  "retrieved": [
    {
      "chunk_id": "UUID",
      "document_id": "UUID",
      "title": "Example Document",
      "source": "manual",
      "content": "Relevant chunk text",
      "similarity": 0.92
    }
  ],
  "trace": {
    "question": "What does the knowledge base say about vector search?",
    "topK": 5,
    "retrieved_count": 1
  }
}
```

If the retrieved sources do not support an answer, the current implementation uses this fallback:

```text
I don't know based on the provided documents.
```

### `POST /api/ingest`

This route expects `multipart/form-data`, not JSON.

Required form fields:

- `password`
- `title`

Optional form fields:

- `source`
- `text`
- `file`

Rules:

- provide either `text` or `file`
- do not provide both
- supported file types are PDF, DOCX, and TXT

Example using `curl` with manual text:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -F "password=YOUR_ADMIN_PASSWORD" \
  -F "title=Example Document" \
  -F "source=manual" \
  -F "text=Your raw document text goes here."
```

Example using `curl` with a file upload:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -F "password=YOUR_ADMIN_PASSWORD" \
  -F "title=Example PDF" \
  -F "source=upload" \
  -F "file=@./example.pdf;type=application/pdf"
```

Example success response:

```json
{
  "ok": true,
  "document_id": "UUID",
  "chunks": 12,
  "latency_ms": 850
}
```

Possible ingestion failures include:

- missing or incorrect admin password
- missing title
- missing content input
- providing both text and file
- unsupported file type
- empty upload
- oversized upload
- missing server configuration

## Application Flow

### Ingestion flow

1. A document is submitted through `/admin` or `POST /api/ingest`.
2. Manual text is accepted directly, or uploaded files are parsed.
3. The text is chunked.
4. The document row and chunk rows are inserted into Supabase.
5. Embeddings are created with OpenAI.
6. Embedding rows are inserted into the `embeddings` table.

### Chat flow

1. A question is submitted through `/` or `POST /api/chat`.
2. The question is embedded with OpenAI.
3. Supabase calls `match_chunks` to retrieve similar chunks.
4. Retrieved chunks are turned into a grounded prompt.
5. The answer is generated from those sources and returned with retrieval metadata.

## Notes For Contributors

- The main runnable app is in `apps/web`
- The root `README.md` is the primary onboarding document
- `apps/web/README.md` currently stays minimal and points readers back to the root docs
- `docs/evaluation.md` is generated output from the evaluation script, not hand-written documentation

## TODOs

- TODO: decide whether the root `.env.example` should remain, be expanded, or be removed from the supported setup path
- TODO: add dedicated docs pages for environment variables, API details, troubleshooting, and contributor workflow
- TODO: document a verified deployment process when one exists

## License

MIT
