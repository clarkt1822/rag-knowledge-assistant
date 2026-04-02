# Getting Started

This guide walks through local setup for the runnable web app in `apps/web`.

If a step here conflicts with a future repo change, keep the repo state as the source of truth and replace unknown values with `TODO` rather than guessing.

## 1. Prerequisites

Before you begin, make sure you have:

- Node.js `TODO: document the supported version`
- npm
- A Supabase account
- An OpenAI API key
- Git

## 2. Clone The Repository

Run these commands in a terminal:

```bash
git clone YOUR_REPOSITORY_URL rag-knowledge-assistant
cd rag-knowledge-assistant
cd apps/web
npm install
```

Replace `YOUR_REPOSITORY_URL` with the actual repository URL.

## 3. Set Up Environment Variables

The local environment file for the web app lives at:

```text
apps/web/.env.local
```

Use the committed example file as your starting point:

```text
apps/web/.env.example
```

Create `apps/web/.env.local` and fill it with placeholder-based values that match your own Supabase and OpenAI setup.

Keep this file local-only and do not commit it.

Required variables for local development are documented in:

- `docs/environment-variables.md`

At minimum, that document currently lists these required variables:

```env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
ADMIN_INGEST_PASSWORD=YOUR_ADMIN_PASSWORD
```

Do not put real secrets in committed files.

## 4. Create A Supabase Project

If you do not already have a Supabase project:

1. Sign in to Supabase.
2. Create a new project.
3. Wait for the database to finish provisioning.
4. Copy the project URL, anon key, and service role key into `apps/web/.env.local`.
5. Set `ADMIN_INGEST_PASSWORD` in `apps/web/.env.local` to a local placeholder value you control.

This guide stays high level on purpose.

TODO: add a verified project creation walkthrough with exact Supabase UI labels if the team wants one.

## 5. Run The Database SQL Files

After your Supabase project exists, run the SQL files in this order:

1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_match_chunks.sql`

High-level flow:

1. Open your Supabase project dashboard.
2. Open the SQL editor.
3. Run `001_init.sql`.
4. Run `002_match_chunks.sql`.

These files are located at:

```text
supabase/migrations/001_init.sql
supabase/migrations/002_match_chunks.sql
```

TODO: add a verified CLI migration flow if the repo adopts one as part of the supported setup.

## 6. Start The App

From `apps/web`, run:

```bash
npm run dev
```

Expected local URL:

```text
http://localhost:3000
```

## 7. Verify The App Works

After the dev server starts:

1. Open `http://localhost:3000/`.
2. Open `http://localhost:3000/admin`.
3. Test ingestion from the admin page with placeholder content.
4. Test chat from the home page using the content you ingested.

Suggested verification flow:

1. In `/admin`, submit a small manual text document with a placeholder title and source.
2. Wait for a successful ingestion response in the UI.
3. Go back to `/`.
4. Ask a question that should be answerable from the text you just ingested.
5. Confirm the answer reflects the ingested content.

If ingestion or chat fails, re-check:

- `apps/web/.env.local`
- `docs/environment-variables.md`
- whether both SQL files were run against the correct Supabase project
