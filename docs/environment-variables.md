# Environment Variables

This document lists the environment variables that are currently referenced by the codebase, plus variables that appear in committed example files but are not currently used.

Verified code paths reviewed for this page:

- `apps/web/lib/rag.ts`
- `apps/web/lib/retrieval.ts`
- `apps/web/app/api/ingest/route.ts`
- `apps/web/scripts/eval_rag.ts`
- `apps/web/lib/ingest.ts`
- `apps/web/lib/supabase-browser.ts`
- `apps/web/lib/supabase-server.ts`

## Where To Put Them

For the runnable web app, local environment variables belong in:

```text
apps/web/.env.local
```

The committed starter file is:

```text
apps/web/.env.example
```

There is also a root `.env.example` in the repository.

Do not commit `apps/web/.env.local`. Local secrets belong there, but the file itself should stay uncommitted.

TODO: decide whether the root `.env.example` is part of the intended setup flow or a leftover partial example, because the runnable app lives in `apps/web`.

## Required Minimum For Local Development

At minimum, local development needs these variables set in `apps/web/.env.local`:

- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_INGEST_PASSWORD`

Optional overrides:

- `RAG_CHAT_MODEL`
- `RAG_EMBED_MODEL`
- `EVAL_BASE_URL`

## Variables Used By The Code

### `OPENAI_API_KEY`

- Required or optional: `Required`
- Example placeholder value: `OPENAI_API_KEY=YOUR_OPENAI_API_KEY`
- Server-side or client-side: `Server-side only`
- Where it is used:
  - `apps/web/lib/ingest.ts`
  - `apps/web/lib/rag.ts`
  - `apps/web/lib/retrieval.ts`
- What it does:
  - Creates embeddings during ingestion
  - Creates embeddings for chat queries
  - Generates grounded answers
- What breaks if missing:
  - Document ingestion fails when embedding generation starts
  - Chat requests fail when query embedding or answer generation is attempted
- Notes:
  - This must not be exposed to the browser

### `NEXT_PUBLIC_SUPABASE_URL`

- Required or optional: `Required`
- Example placeholder value: `NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co`
- Server-side or client-side: `Both`
- Where it is used:
  - `apps/web/lib/supabase-browser.ts`
  - `apps/web/lib/supabase-server.ts`
- What it does:
  - Provides the Supabase project URL for both browser and server clients
- What breaks if missing:
  - Browser-side Supabase client creation fails
  - Server-side Supabase client creation fails
  - Ingestion and retrieval paths that depend on Supabase cannot run
- Notes:
  - The `NEXT_PUBLIC_` prefix means this value is safe to expose to the client

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- Required or optional: `Required`
- Example placeholder value: `NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY`
- Server-side or client-side: `Client-side`
- Where it is used:
  - `apps/web/lib/supabase-browser.ts`
- What it does:
  - Creates the browser-safe Supabase client
- What breaks if missing:
  - Browser-side Supabase client creation fails
- Notes:
  - This value is intended to be browser-safe
  - The current app mainly uses server-side RAG flows, but this variable is still referenced by the browser client helper

### `SUPABASE_SERVICE_ROLE_KEY`

- Required or optional: `Required`
- Example placeholder value: `SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY`
- Server-side or client-side: `Server-side only`
- Where it is used:
  - `apps/web/lib/supabase-server.ts`
- What it does:
  - Creates the privileged server-side Supabase client used by ingestion and retrieval logic
- What breaks if missing:
  - Server-side Supabase client creation fails
  - Ingestion cannot insert documents, chunks, or embeddings
  - Retrieval cannot call the `match_chunks` RPC
- Notes:
  - This must never be exposed to client-side code or `NEXT_PUBLIC_*` variables

### `RAG_CHAT_MODEL`

- Required or optional: `Optional`
- Example placeholder value: `RAG_CHAT_MODEL=gpt-4.1-mini`
- Server-side or client-side: `Server-side only`
- Where it is used:
  - `apps/web/lib/rag.ts`
- What it does:
  - Overrides the default model used for grounded answer generation
- What breaks if missing:
  - Nothing immediately breaks; the code falls back to `gpt-4.1-mini`
- Notes:
  - The fallback value is defined in code, not inferred from docs

### `RAG_EMBED_MODEL`

- Required or optional: `Optional`
- Example placeholder value: `RAG_EMBED_MODEL=text-embedding-3-small`
- Server-side or client-side: `Server-side only`
- Where it is used:
  - `apps/web/lib/ingest.ts`
  - `apps/web/lib/retrieval.ts`
- What it does:
  - Overrides the embedding model used for document ingestion and chat query embeddings
- What breaks if missing:
  - Nothing immediately breaks; the code falls back to `text-embedding-3-small`

### `ADMIN_INGEST_PASSWORD`

- Required or optional: `Required`
- Example placeholder value: `ADMIN_INGEST_PASSWORD=YOUR_ADMIN_PASSWORD`
- Server-side or client-side: `Server-side only`
- Where it is used:
  - `apps/web/app/api/ingest/route.ts`
- What it does:
  - Protects `POST /api/ingest` with a simple password check
- What breaks if missing:
  - The ingest route returns a server misconfiguration error
  - Admin ingestion through `/admin` cannot succeed
- Notes:
  - This is not browser-safe
  - The `/admin` page submits this value to the server via form data; the secret itself should still only be stored in server-side environment configuration

### `EVAL_BASE_URL`

- Required or optional: `Optional`
- Example placeholder value: `EVAL_BASE_URL=http://localhost:3000`
- Server-side or client-side: `Server-side only`
- Where it is used:
  - `apps/web/scripts/eval_rag.ts`
- What it does:
  - Overrides the base URL targeted by the evaluation runner
- What breaks if missing:
  - Nothing immediately breaks; the script falls back to `http://localhost:3000`
- Notes:
  - This variable is only used by the evaluation script, not by the running app itself

## Variables Present In Example Files But Not Used

### `RAG_TOP_K`

- Status: `Unused in current code`
- Example placeholder value: `RAG_TOP_K=5`
- Where it appears:
  - `apps/web/.env.example`
- Where it is not used:
  - No current code path reads `process.env.RAG_TOP_K`
- Why this matters:
  - Readers may assume the chat route uses an environment-configured retrieval count, but the current implementation does not
- Current behavior instead:
  - `POST /api/chat` accepts `topK` in the request body
  - If `topK` is missing or invalid, the route defaults to `5`
  - The route clamps `topK` to the range `1` to `20`
- Recommendation:
  - Mark this variable as legacy or remove it from example files in a future documentation or cleanup pass

## Cross-Check Summary

Verified direct env usage by file:

- `apps/web/lib/rag.ts`
  - `OPENAI_API_KEY`
  - `RAG_CHAT_MODEL`
- `apps/web/lib/retrieval.ts`
  - `OPENAI_API_KEY`
  - `RAG_EMBED_MODEL`
- `apps/web/app/api/ingest/route.ts`
  - `ADMIN_INGEST_PASSWORD`
- `apps/web/scripts/eval_rag.ts`
  - `EVAL_BASE_URL`
- `apps/web/lib/ingest.ts`
  - `OPENAI_API_KEY`
  - `RAG_EMBED_MODEL`
- `apps/web/lib/supabase-browser.ts`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `apps/web/lib/supabase-server.ts`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Safe Example Block

Use placeholder values only:

```env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
RAG_CHAT_MODEL=gpt-4.1-mini
RAG_EMBED_MODEL=text-embedding-3-small
ADMIN_INGEST_PASSWORD=YOUR_ADMIN_PASSWORD
EVAL_BASE_URL=http://localhost:3000
```
