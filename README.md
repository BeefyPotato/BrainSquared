# BrainSquared

**Organizational AI memory** — a knowledge graph that captures the AI know-how your team already produces (prompts, workflows, agent configs, decisions, lessons, standards), and a council of three AI agents that keeps it clean, current, and compliant.

Built for AABW Saigon 2026, Founders Track, Problem Statement 5.

## How it works

1. **Capture** — paste raw exhaust (an exported AI conversation, a Slack thread, a config file) into the app, or call it via the bundled MCP server from inside an AI chat tool.
2. **Scribe** extracts genuinely reusable knowledge assets from the raw text and writes them into the graph as `pending` nodes.
3. **Curator** checks new nodes against the existing graph, merging duplicates and linking related work.
4. **Auditor** checks nodes against the org's current standards and decisions, approving or flagging them — and re-judges the whole graph when governance changes (e.g. a new leadership memo).

Every agent action is itself written back into the graph, so the whole process is visible and traceable in the UI.

See [AGENTS.md](AGENTS.md) for the full architecture and data flow, and [BUSINESS_GUIDE.md](BUSINESS_GUIDE.md) for the product narrative.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Supabase](https://supabase.com) (Postgres + Realtime) for the graph store
- [OpenAI](https://platform.openai.com) for the agent LLM calls
- `react-force-graph-2d` for the live graph view
- A stdio [MCP](https://modelcontextprotocol.io) server (`mcp/server.ts`) as a second capture front door

## Getting started

### 1. Prerequisites

- Node.js 20+
- A Supabase project with `supabase/schema.sql` applied (SQL Editor → paste → Run)
- An OpenAI API key

### 2. Environment

Create `.env.local` in the repo root (never committed):

```
NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | Run ESLint |
| `npm run seed` | Wipe and reload demo data from `data/seed.json` |
| `npm run smoke` | End-to-end smoke test: seed → ingest a fixture → assert the council acted |
| `npm run snapshot` | Dump the live graph to `public/fallback-snapshot.json` (offline demo fallback) |
| `npm run mcp` | Run the MCP capture server (`mcp/server.ts`) over stdio |

## Project structure

```
src/lib/agents/    Scribe, Curator, Auditor — the agent council and its prompts
src/lib/           Shared types and the Supabase data access layer
src/app/api/       HTTP routes: ingest, council, task, edit, analytics
src/app/, src/components/   The one-page UI (graph + tabbed workbench)
mcp/               MCP stdio server exposing save_to_org_memory
scripts/           seed / smoke / snapshot operational tooling
data/              Seed data and demo fixtures
supabase/          Database schema
docs/superpowers/  Design spec and implementation plan
```

## MCP capture

Connecting `mcp/server.ts` to an MCP-compatible AI tool (e.g. Claude Code/Desktop) exposes one tool, `save_to_org_memory(conversation_text, uploader)`, which POSTs to this app's `/api/ingest`. Requires the dev server running; point `BRAINSQUARED_URL` at it if not on `localhost:3000`. See `MANUAL_STEPS.md` Part 4B for the Claude Desktop config steps.
