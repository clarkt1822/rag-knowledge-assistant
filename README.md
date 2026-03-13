# RAG Knowledge Assistant

Minimal baseline for a Next.js + Supabase + OpenAI retrieval-augmented generation project.

## Status

This repository is currently at the setup stage. It contains baseline repository files and project structure but no application implementation yet.

## Goal

Build a grounded, inspectable, and measurable RAG system with strong engineering fundamentals.

## Environment

Copy `.env.example` to `.env.local` for local development.

Public browser-safe variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only secrets:
- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Never commit `.env.local` or real credentials.

## Planned Features

- ingestion
- chunking
- embeddings
- retrieval
- citations
- logging
- debug mode
- evaluation