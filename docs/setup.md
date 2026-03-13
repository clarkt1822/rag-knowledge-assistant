# Setup Notes

## Supabase
- Created the Supabase project for this RAG Knowledge Assistant
- Enabled pgvector with:
  - `create extension if not exists vector;`
- Verified extension install with:
  - `select extname from pg_extension;`
- Confirmed `vector` exists in the extension list

## Secrets
- Supabase service role key must only be used server-side
- Never expose the service role key to the browser
- Do not commit real keys or credentials to the repository
- Store local secrets in `apps/web/.env.local`
- Keep `.env.local` gitignored

## Repo policy
- Only setup notes are committed in this step
- No production credentials, copied dashboard values, or screenshots containing secrets are committed