# Troubleshooting

Use this page for common local setup and verification checks.

## The App Does Not Start

If `npm run dev` fails:

1. Make sure you are in `apps/web`
2. Make sure dependencies were installed with `npm install`
3. Re-check `apps/web/.env.local`
4. Re-check the required variables in `docs/environment-variables.md`

TODO: add verified troubleshooting for dependency or platform-specific startup failures if they are observed and reproduced.

## `/admin` Cannot Ingest Content

Check these first:

1. `ADMIN_INGEST_PASSWORD` is set in `apps/web/.env.local`
2. The password entered in `/admin` matches that server-side value
3. You provided exactly one input source:
   `text` or `file`, but not both
4. The uploaded file is a supported PDF, DOCX, or TXT file
5. The uploaded file is not empty and is not larger than `10 MB`
6. Your Supabase project has already run:
   `supabase/migrations/001_init.sql` and `supabase/migrations/002_match_chunks.sql`

If you are testing the route directly, remember that `POST /api/ingest` accepts `multipart/form-data` only.

## `/` Returns Poor Answers Or No Answer

Check these first:

1. You already ingested content successfully
2. The ingested content actually contains the answer you are asking for
3. `OPENAI_API_KEY` is set in `apps/web/.env.local`
4. `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly
5. The SQL files were run against the same Supabase project referenced by your local env file

The current fallback answer is:

```text
I don't know based on the provided documents.
```

That response usually means the retrieved chunks did not support the question strongly enough.

## API Requests Fail During Manual Testing

For `POST /api/chat`:

- Send `application/json`
- Include a non-empty string `question`
- Remember `topK` defaults to `5` and is clamped to `1` through `20`

For `POST /api/ingest`:

- Send `multipart/form-data`
- Include `password` and `title`
- Include exactly one of `text` or `file`

## Secret Handling Reminders

- Keep real secrets out of docs, screenshots, and shared curl examples
- Do not commit `apps/web/.env.local`
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` in browser code
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is browser-safe and should not be described as a secret
