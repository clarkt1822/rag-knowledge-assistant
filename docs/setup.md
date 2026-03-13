# Setup Notes

## Supabase
- Created the Supabase project for this RAG Knowledge Assistant
- Enabled pgvector with:
  - `create extension if not exists vector;`
- Verified extension install with:
  - `select extname from pg_extension;`
- Confirmed `vector` exists in the extension list

## Secrets
- Supabase service role key must only be used in server-side code, server routes, or trusted backend scripts
- Never expose the service role key to the browser or place it in any `NEXT_PUBLIC_*` variable
- Supabase anon key is the only browser-safe Supabase key
- Do not commit real keys, copied dashboard values, or credentials to the repository
- Store local secrets in `.env.local`
- Keep `.env.local` gitignored
- Keep `.env.example` committed with placeholders only and no real secret values

## Repo policy
- Only setup notes are committed in this step
- No production credentials, copied dashboard values, or screenshots containing secrets are committed
