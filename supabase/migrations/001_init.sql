create extension if not exists vector;
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  char_count int not null check (char_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create table if not exists embeddings (
  chunk_id uuid primary key references chunks(id) on delete cascade,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create table if not exists query_logs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  top_k int not null default 5 check (top_k > 0),
  model text,
  latency_ms int check (latency_ms is null or latency_ms >= 0),
  retrieved jsonb,
  answer text,
  trace jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chunks_document_id_idx
  on chunks(document_id);

create index if not exists documents_source_idx
  on documents(source);

create index if not exists query_logs_created_at_idx
  on query_logs(created_at desc);

create index if not exists embeddings_hnsw_idx
  on embeddings using hnsw (embedding vector_cosine_ops);

drop trigger if exists set_documents_updated_at on documents;
create trigger set_documents_updated_at
before update on documents
for each row
execute function public.set_updated_at();

drop trigger if exists set_chunks_updated_at on chunks;
create trigger set_chunks_updated_at
before update on chunks
for each row
execute function public.set_updated_at();