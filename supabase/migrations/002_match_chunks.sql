create or replace function match_chunks (
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  chunk_id uuid,
  document_id uuid,
  title text,
  source text,
  content text,
  similarity double precision
)
language sql
stable
as $$
  select
    c.id as chunk_id,
    c.document_id,
    d.title,
    d.source,
    c.content,
    1 - (e.embedding <=> query_embedding) as similarity
  from embeddings e
  join chunks c on c.id = e.chunk_id
  join documents d on d.id = c.document_id
  where e.embedding is not null
    and match_count > 0
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

comment on function match_chunks(vector(1536), int) is
'Returns the most similar chunks for a query embedding using cosine distance.';