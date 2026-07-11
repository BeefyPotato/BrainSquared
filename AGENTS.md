# AGENTS.md — BrainSquared Build Guide

Read this first if you are an AI agent (or human) implementing any part of this repo. It tells you what the product is, how data flows end to end, and — per folder — what to build, what it consumes, what it produces, and how it contributes to the whole.

**Authoritative documents (read in this order):**
1. This file — orientation.
2. `docs/superpowers/specs/2026-07-11-org-ai-memory-design.md` — the approved design (WHY).
3. `docs/superpowers/plans/2026-07-11-brainsquared-mvp.md` — the implementation plan with **complete code for every file** (WHAT/HOW). Your folder's placeholder files each name their plan task (e.g. "Task B3"). Implement from the plan; do not invent alternative designs.
4. `BUSINESS_GUIDE.md` — the product narrative the pitch is built on. Its §2 table maps every feature to the pain it solves and the demo moment that proves it. **The implementation must keep every §2 row true.** Two rules that follow: (a) any user-facing string you write must be plain language a non-technical judge understands on a projector — no jargon, no internal names (naming note: the agents are "the Council" on screen and "AI librarians" in the spoken pitch — both refer to Scribe/Curator/Auditor); (b) if a feature is cut or changed, flag it so BUSINESS_GUIDE §2 is updated the same hour — a pitch describing a feature that no longer exists is a stage failure.

## What we are building

**BrainSquared — Organizational AI Memory.** Hackathon: AABW Saigon 2026, Founders Track, Problem Statement 5. Deadline: 2026-07-12, 9:00 AM ICT. Deliverable: a working demo carrying a 5-minute pitch.

Concept: organizational memory as **exhaust capture, not data entry**. Employees drop in the byproducts of AI work that already exist (exported Claude/ChatGPT conversations, Slack threads, agent configs). A council of three AI agents turns that exhaust into a living, visible **knowledge graph** of typed assets — prompts, workflows, agent configs, decisions, lessons, standards — each with why-context and provenance:

- **Scribe** (input layer) — distills raw text into typed asset nodes, capturing the artifact AND why it works.
- **Curator** (maintenance) — merges duplicates, links related work; retires via `superseded_by` edges (versioning), never deletes.
- **Auditor** (governance) — judges assets against the `standard`/`decision` nodes **currently in the graph**, compiled into its instructions at runtime. Upload a leadership memo → the Auditor's rules change. This is the demo's showpiece.

Every agent verdict is itself an `agent_action` node in the graph — governance is transparent and traceable. Downstream: "Start a task" recommendations (reuse) and capability analytics (growing/duplicated/missing).

## End-to-end flow

```
                    ┌───────────────────────────── UI (src/components, src/app/page.tsx)
                    │  Capture tab                        Council Log · Start a task · Analytics
                    ▼
        POST /api/ingest (src/app/api)
                    │
        runIngestPipeline (src/lib/agents/pipeline.ts)
                    │
   Scribe ──► Curator ──► Auditor        (src/lib/agents/*.ts, prompts in prompts.ts,
   (extract)  (dedupe/link) (govern)      LLM calls via runner.ts)
                    │
        nodes + edges written to Supabase (src/lib/supabase.ts, schema in supabase/)
                    │
        Supabase Realtime pushes changes ──► GraphView re-renders live
                    │
   POST /api/council  = Auditor sweep over all live assets (the "memo moment")
   POST /api/task     = recommender over approved assets
   GET  /api/analytics = counts/gaps computed from the graph
                    │
        seeded demo state from data/seed.json via scripts/seed.ts
        network-failure fallback: public/fallback-snapshot.json via scripts/snapshot.ts
```

## Global constraints (apply to every folder)

- Stack: Next.js 15 (App Router, TypeScript), `@supabase/supabase-js`, `openai`, `react-force-graph-2d`. No Tailwind (inline styles). No test framework — one smoke script is the deliberate test strategy.
- Env (`.env.local`, never committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4.1`).
- Node statuses/colors (verbatim everywhere): `pending` #eab308 · `approved` #22c55e · `flagged` #ef4444 · `superseded` #64748b.
- All shared types come from `src/lib/types.ts`. Never redefine `KGNode`/`KGEdge`/API payload shapes locally.
- ALL LLM prompts live in `src/lib/agents/prompts.ts` — nowhere else.
- LLM failures must never crash an ingest: nodes stay `pending` ("awaiting review"), the app degrades gracefully.
- Git: trunk-based on `master`; `git pull --rebase` before every commit; commit per task. File ownership: Track A = backend/data, Track B = agents/APIs, Track C = frontend (see plan timeline). Don't edit another track's files.
- Commands: `npm run dev` · `npm run seed` (wipe+reload demo data) · `npm run smoke` · `npm run snapshot`.

---

## Folder-by-folder build guide

### `src/lib/` — shared foundation (plan Tasks 0, A1)

**Files:** `types.ts` (Task 0), `supabase.ts` (Task A1).

**What it is:** the contract every other folder codes against. `types.ts` defines `KGNode`, `KGEdge`, the type/status/edge enums, `ASSET_TYPES`, and every API payload shape (`IngestInput`, `PipelineResult`, `CouncilLogEntry`, `AnalyticsSummary`). `supabase.ts` is the ONLY module that talks to the database: exports `supabase` client, `newId(prefix)`, `getGraph()`, `insertNodes()`, `insertEdges()`, `setNodeStatus()`.

**Contribution to the flow:** everything upstream (agents) and downstream (UI, APIs, scripts) reads/writes the graph exclusively through these two files. If a signature here changes, three tracks break — treat it as frozen after Task 0/A1.

**Build notes:** exact code in plan Steps 0.5 and A1.1. IDs are human-readable text (`wf-fasttrack`), not uuid — deliberate, for stable demo fixtures.

### `src/lib/agents/` — the Agent Council (plan Tasks B1–B4)

**Files:** `prompts.ts` + `runner.ts` (B1), `scribe.ts` + `pipeline.ts` (B2), `curator.ts` (B3), `auditor.ts` (B4).

**What it is:** the product's core. `runner.ts` provides `llmJson<T>(system, user)` (OpenAI JSON mode, one retry) and `logAction(agent, action, reasoning, nodeIds)` (writes the `agent_action` node + `reviewed_by` edges — the transparency mechanic). Each agent is one focused LLM call plus graph writes:

- `scribe.ts` → `runScribe(input)`: creates a `source` node (raw text preserved), finds/creates the uploader's `person` node, inserts asset nodes as `pending` with `derived_from`/`authored_by` edges.
- `curator.ts` → `runCurator(targetIds)`: merge (older node → `superseded` + `superseded_by` edge) / link (`supports`, `used_in`) / pass.
- `auditor.ts` → `runAuditor(targetIds)`: compiles ALL non-superseded `standard`+`decision` nodes (any status — a pending memo counts immediately) into its instructions; verdicts approve/flag; flags add `contradicts` (asset→standard) and `governs` (action→standard) edges.
- `pipeline.ts` → `runIngestPipeline(input)` chains Scribe→Curator→Auditor with each stage guarded (failure leaves nodes `pending`, never throws to the route); `runCouncilReview()` is an **Auditor-only** sweep over all live assets (deliberate: Curator sweeping the whole graph risks surprise merges mid-demo).

**Contribution to the flow:** this folder IS the pitch — "agents run the memory." The demo's showpiece (upload memo → Run Council → Auditor reverses a verdict citing the memo node) lives here; plan Step B4.3 is the mandatory end-to-end verification of it.

**Build notes:** label prefixes matter — `logAction` produces labels like `curator: merge …` / `auditor: flagged …`, and `/api/analytics` counts them by prefix. Don't change label formats.

### `src/app/api/` — HTTP surface (plan Tasks B2, B4, B5, B6, A3)

**Files:** `ingest/route.ts` (B2), `council/route.ts` (B4), `task/route.ts` (B5), `edit/route.ts` (B6), `analytics/route.ts` (A3).

**What it is:** five thin routes. `ingest` validates input and calls `runIngestPipeline`; `council` calls `runCouncilReview`; `task` runs the recommender prompt over approved assets and returns `{ok, answer, nodeIds}`; `edit` performs a **versioned edit** (creates a new `pending` node with the edited content, marks the old one `superseded` with a `superseded_by` edge, then runs the Auditor on the new version — human edits go through the same governance as captured knowledge); `analytics` computes `AnalyticsSummary` from `getGraph()` (asset counts by type/team, merge/flag counts from `agent_action` labels, coverage gaps).

**Contribution to the flow:** the only bridge between UI and agents/data. Contracts are frozen in `types.ts` and the plan's "Interface contracts" section — the frontend was built against them, so don't rename fields.

**Build notes:** set `maxDuration` on LLM routes (pipeline can take ~60s+). Always return JSON, never throw HTML error pages — the UI shows `error` strings.

### `src/app/` (shell) — page and layout (plan Task C1)

**Files:** `page.tsx` (replace placeholder), `layout.tsx` + `globals.css` (from create-next-app, lightly modified).

**What it is:** one-page app owning all shared UI state: `graph` (fetched via `getGraph()`, refreshed by Supabase Realtime subscription on `nodes`/`edges`), `selectedNodeId`, `highlightIds`, active tab. Layout: graph left (~60%), tabbed workbench right (Capture / Council Log / Start a task / Analytics). Also implements the fallback: if `NEXT_PUBLIC_USE_FALLBACK=1`, load `public/fallback-snapshot.json` instead of Supabase.

**Contribution to the flow:** the Realtime→refetch loop here is what makes agent activity *visible live on the projector* — nodes bloom yellow and flip green/red with no refresh. Children are pure props-consumers; no state libraries.

### `src/components/` — UI panels (plan Tasks C2–C7)

**Files:** `GraphView.tsx` (C2), `NodeDrawer.tsx` (C3, edit mode added in C7), `CapturePanel.tsx` (C4), `CouncilLog.tsx` (C5), `TaskPanel.tsx` + `AnalyticsPanel.tsx` (C6), `LibraryPanel.tsx` (C7).

**What each does and why it matters to the demo:**
- `GraphView` — `react-force-graph-2d` (dynamic import, `ssr: false`), status colors + type colors (person blue, project cyan, source purple, agent_action magenta); when `highlightIds` is non-empty, everything else dims. This is the centerpiece on screen for all five demo beats.
- `NodeDrawer` — click a node → content, **why-context**, author/source, and clickable provenance edges (jump to related nodes). This demos "context capture" and traceability. C7 adds an Edit mode: saving calls `/api/edit`, then jumps the drawer to the new version so the user watches the Auditor judge their edit live.
- `LibraryPanel` — browsable list of live assets with type-filter chips (Workflows/Prompts/Lessons/…); clicking opens the drawer. The simple "see and edit workflows" entry point.
- `CapturePanel` — paste/upload exhaust → `POST /api/ingest`. Demo beat 2.
- `CouncilLog` — renders `agent_action` nodes from the graph (no separate store), newest first, with agent avatars 📝🧹🕵️; clicking highlights involved nodes; hosts the **Run Council** button (`POST /api/council`). Demo beats 3–4.
- `TaskPanel` — `POST /api/task`, renders recommendations with "trace in graph" buttons. Demo beat 5 (reuse).
- `AnalyticsPanel` — `GET /api/analytics`, stat cards + CSS bars + gap warnings. Demo beat 5 (analytics). First cut if time runs out; Library/edit (B6+C7) is the second cut. Start a task is never cut.

**Build notes:** inline styles only, dark palette (`#0b1220` bg). Components receive `graph`/`onHighlight`/`onDone` as props from `page.tsx` — keep them stateless beyond local form state.

### `scripts/` — operational tooling (plan Tasks A2, A4)

**Files:** `seed.ts` (A2), `snapshot.ts` (A2), `smoke.ts` (A4).

**What it is:** `seed.ts` wipes both tables and loads `data/seed.json` — one command returns the demo to a known state (run between every rehearsal). `snapshot.ts` dumps the live graph to `public/fallback-snapshot.json` for the network-failure fallback. `smoke.ts` is the entire test suite: seed → ingest the conversation fixture through `runIngestPipeline` → assert assets were created and council actions logged → `SMOKE PASS`.

**Contribution to the flow:** rehearsal safety and 4-AM confidence. All scripts load env via `dotenv` from `.env.local` and dynamically import `src/lib/supabase` AFTER env is loaded — keep that order.

### `data/` — the demo's story (plan Task A2)

**Files:** `seed.json`, `fixtures/claude-conversation.txt`, `fixtures/leadership-memo.txt`.

**What it is:** a fictional consulting firm, **Meridian Advisory** (teams: Strategy, Diligence, Digital) — 27 nodes, 24 edges, full content in plan Step A2.1. Two **planted demo hooks that must never be altered casually**:
1. `pr-client-research` (seeded prompt) — the conversation fixture contains a near-duplicate, so the Curator performs a live merge during the demo.
2. `wf-fasttrack` (seeded, approved workflow that skips senior review) — the leadership-memo fixture mandates senior review, so Run Council makes the Auditor flag it, citing the memo node. **This is the showpiece.**

**Contribution to the flow:** the demo IS this data. If you edit seed content, re-verify both hooks end-to-end (plan Steps B3.2, B4.3) and re-run `npm run snapshot`.

### `supabase/` — database schema (plan Task 0)

**Files:** `schema.sql`.

**What it is:** two tables — `nodes` (id text PK, type, label, content, context, status, author, source jsonb, team, created_at) and `edges` (id text PK, from_node/to_node FK cascade, type, created_at) — RLS explicitly disabled (demo scope), both tables added to the `supabase_realtime` publication (this line is what makes the live graph work).

**Contribution to the flow:** run once in the Supabase SQL editor at Task 0. The file is the record; the dashboard is the runtime. If you change the schema, `types.ts` and `supabase.ts` must change in the same commit.

### `mcp/` — MCP capture server (plan Task B7, stretch)

**Files:** `server.ts`.

**What it is:** a minimal MCP stdio server (`@modelcontextprotocol/sdk`) exposing one tool, `save_to_org_memory(conversation_text, uploader)`, which POSTs to the app's existing `/api/ingest`. Connecting it to Claude Desktop/Code means an employee can say "save what we learned to org memory" inside their AI tool and watch the knowledge land in the graph — capture at the source, zero data entry.

**Contribution to the flow:** it's a second front door into the same ingestion pipeline — no new contracts, no new storage. Build order: after B6; first cut if the night runs long (the paste-based Capture tab demonstrates the same value). Requires the Next.js dev server running. The Claude Desktop config step is a human job (MANUAL_STEPS.md Part 4B), and a 20-second recording of it working is the mandatory stage backup.

### `public/` — static assets

Holds `fallback-snapshot.json` (generated by `npm run snapshot`, committed at final phase F2). With `NEXT_PUBLIC_USE_FALLBACK=1` the app renders the graph from this file — the venue-wifi disaster plan. Read-only demo; ingest won't work in fallback mode, and that's accepted.

### `docs/` — spec and plan

Do not implement from memory or improvise: the plan (`docs/superpowers/plans/`) contains complete, verified-consistent code for every file above, with per-task verification commands and commit points. The spec (`docs/superpowers/specs/`) explains intent — consult it when a plan detail seems ambiguous, and prefer the plan when they conflict (its two deviations from the spec are documented inline with rationale).

---

## Definition of done (whole system)

1. `npm run seed` → `npm run smoke` prints `SMOKE PASS`.
2. The five demo beats work end to end (spec §7): capture fixture → council governs → **memo moment reverses a verdict** → task recommendations → analytics.
3. `npm run snapshot` committed; fallback mode renders.
4. Two timed 5-minute rehearsals completed, reseeding between runs.
