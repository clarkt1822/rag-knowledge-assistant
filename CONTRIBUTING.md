# Contributing

This repository's runnable app lives in `apps/web`.

## Local Setup

Use these docs as the primary contributor references:

- `README.md`
- `docs/getting-started.md`
- `docs/environment-variables.md`
- `docs/api-reference.md`
- `docs/troubleshooting.md`

## Secrets And Safety

- Put local environment variables in `apps/web/.env.local`
- Do not commit `apps/web/.env.local`
- Use placeholder values only in documentation, examples, screenshots, and shared snippets
- Treat `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_INGEST_PASSWORD` as server-only secrets
- Treat `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as browser-safe public values
- Never place server-only secrets in `NEXT_PUBLIC_*` variables

## Documentation Changes

- Keep setup steps sequential and copy-paste friendly
- Do not guess missing facts; use `TODO` when a value or workflow has not been verified
- Keep API examples aligned with the current routes: `POST /api/chat` accepts JSON
- Keep API examples aligned with the current routes: `POST /api/ingest` accepts `multipart/form-data` only
- Keep `topK` behavior documented consistently: default `5`
- Keep `topK` behavior documented consistently: minimum `1`
- Keep `topK` behavior documented consistently: maximum `20`
