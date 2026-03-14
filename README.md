# RAG Knowledge Assistant

A retrieval-augmented generation (RAG) system built with Next.js, Supabase (Postgres + pgvector), and OpenAI.

The goal of this project is to build a grounded, inspectable, and measurable RAG architecture with strong engineering fundamentals instead of prompt-only experimentation.

This repository focuses on building the full pipeline:

document ingestion → chunking → embeddings → vector retrieval → answer generation → evaluation.

## Project Status

🚧 Work in progress.

The repository currently contains the infrastructure and database foundations for the system.  
Application logic and ingestion pipelines are being implemented next.

This project is being built incrementally to prioritize:

- clear architecture
- reproducibility
- inspectable retrieval behavior
- measurable evaluation

## Architecture (High Level)

The system is designed around a standard RAG pipeline:

documents  
↓  
chunking  
↓  
embeddings (OpenAI)  
↓  
pgvector similarity search  
↓  
retrieval  
↓  
LLM answer generation  
↓  
citations + logging  

The vector search layer is implemented using **Postgres + pgvector** inside Supabase.

## Tech Stack

- Next.js
- Supabase (Postgres)
- pgvector
- OpenAI API

## Environment Setup

Copy `.env.example` to `.env.local` for local development.

Public browser-safe variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only secrets:

- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Never commit `.env.local` or real credentials.

## Planned System Features

- document ingestion pipeline
- document chunking
- embedding generation
- vector similarity retrieval
- answer generation with citations
- query logging
- debugging and inspection tools
- evaluation framework for retrieval quality

## Development Approach

This project is intentionally built step-by-step with an emphasis on:

- database-first architecture
- deterministic retrieval
- measurable improvements
- minimal abstraction layers

The goal is to understand how RAG systems work internally rather than relying on heavy frameworks.

## License

MIT