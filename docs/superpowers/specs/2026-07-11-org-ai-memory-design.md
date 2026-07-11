# Organizational AI Memory — Design Spec

**Date:** 2026-07-11
**Context:** AABW Saigon 2026 (Agentic AI Build Week), Founders Track, Problem Statement 5 — "Organizational AI Memory: The Capability Layer for the AI Enterprise."
**Constraints:** Build from zero in under 8 hours. Submission 2026-07-12, 9:00 AM ICT. Deliverable is a working demo carrying a 5-minute pitch. OpenAI API key available.

## 1. Product concept

Organizational memory as **exhaust capture, not data entry**. The system ingests the byproducts of AI work that already exist — exported Claude/ChatGPT conversations, Claude Code session transcripts, Slack thread dumps, agent config files — and AI agents distill them into a single, visible **knowledge graph (Org KG)** of typed memory assets: Prompts, Workflows, Agent Configs, Decisions, and Lessons, each with why-context and provenance (who, when, from what source).

Three named agents — **the Agent Council** — run the memory:

- **Scribe** (input layer): distills raw exhaust into typed assets, capturing the *why*, not just the artifact.
- **Curator** (maintenance): merges duplicates, links related work, versions via supersession — never deletes.
- **Auditor** (governance): checks new knowledge against the `standard` and `decision` nodes currently in the graph. Its rules are compiled from the graph at runtime, so uploading a leadership memo changes agent behavior with no configuration.

Downstream, employees get **"Start a task" recommendations** (describe a task → the org's best relevant assets, with provenance trails) and a **capability analytics panel** (where AI capability is growing, duplicated, or missing).

Every agent action is itself recorded in the graph, so all governance is inspectable: anyone can trace how any output or verdict was derived.

**Pitch sentence:** *Employees' AI know-how becomes a living knowledge graph, and a council of AI agents — governed by the org's own memos and decisions — keeps it clean, current, and reusable, forever.*

### Mapping to Problem Statement 5 product vision

| PS5 bullet | This design |
|---|---|
| Searchable memory layer for prompts, workflows, agents, patterns | Org KG with typed asset nodes; "Start a task" doubles as search |
| Context capture — why it worked, not just the artifact | Mandatory `context` field on every asset; Scribe mines it from surrounding conversation |
| Governance and versioning for organizational AI assets | Auditor + graph-derived standards; `superseded_by` edges as versioning |
| Recommendations surfacing relevant prior work | "Start a task" tab |
| Analytics: capability growing / duplicated / missing | Analytics tab computed from graph + agent actions |

## 2. Architecture

Single **Next.js (TypeScript)** app:

- **UI:** React, `react-force-graph-2d` for the graph view, dark theme.
- **Backend:** Next.js API routes.
- **LLM:** OpenAI SDK. All agent calls use structured (JSON) output. All prompts live in one `prompts.ts` file for late-night tuning without logic changes.
- **Storage:** Supabase (hosted Postgres), accessed via `@supabase/supabase-js`. No auth/RLS — anon key, open tables (demo scope). **Supabase Realtime** pushes node/edge changes to the UI so agent activity animates live.
- **Demo resilience:** `npm run seed` wipes and reloads the full demo dataset in one command. A local JSON snapshot of the seeded state ships in the repo; an env flag switches the app to read-only local-snapshot mode if network/Supabase fails at the venue.

## 3. Data model

Two tables.

**`nodes`** — `id uuid, type text, label text, content text, context text, status text, author text, source jsonb, team text, created_at timestamptz`

- `type`: `prompt` | `workflow` | `agent_config` | `lesson` | `decision` | `standard` | `person` | `project` | `source` | `agent_action`
- `content`: the artifact itself (prompt text, workflow steps, memo text, raw transcript for `source` nodes)
- `context`: the why — when it works, when it fails, why it was chosen. Required on asset nodes.
- `status`: `pending` (yellow) → `approved` (green) | `flagged` (red) | `superseded` (gray). UI colors nodes by status.
- `source` (jsonb): `{ kind: 'claude_conversation' | 'chatgpt_export' | 'slack_thread' | 'config_file' | 'manual', name }`

**`edges`** — `id uuid, from_node uuid, to_node uuid, type text, created_at timestamptz`

- `type`: `derived_from` | `authored_by` | `used_in` | `supports` | `contradicts` | `superseded_by` | `reviewed_by` | `governs`

Structural rules:

- Agent verdicts are `agent_action` nodes with `reviewed_by` edges to what they judged and `governs`/`contradicts` edges to standards cited — governance lives inside the graph.
- The Curator retires, never deletes: merged nodes become `superseded` with a `superseded_by` edge. This is the versioning story.
- Raw exhaust is kept as a `source` node; every extracted asset has a `derived_from` edge to it, so provenance clicks through to the original transcript.

## 4. The Agent Council — mechanics and data flow

Pipeline per ingestion:

```
raw exhaust (paste / .txt / .md / .json upload)
  → Scribe: typed asset nodes (status: pending) + source node + provenance edges
  → Curator: dedupe/link pass over the pending nodes
  → Auditor: standards check over survivors
  → graph updated live + every verdict logged as agent_action nodes
```

Each agent is one focused OpenAI call with JSON output, wrapped in a shared runner that persists its actions.

**Scribe** — input: raw text + uploader metadata. Output: asset nodes with `content` and `context`, a `source` node, `derived_from` and `authored_by` edges (creates `person` nodes as needed). Judgment call: extract only what is worth keeping; discard noise. All output lands `pending`.

**Curator** — input: new pending nodes + a compact index of all existing nodes (id, type, label, one-line summary; graph is small enough to fit whole). Actions: `link` (add `supports`/`used_in` edges), `merge` (older node → `superseded` + `superseded_by` edge), `pass`. Each action carries one-line reasoning.

**Auditor** — input: the nodes under review + **all non-superseded `standard` and `decision` nodes (any status, `pending` included) compiled into its instructions at runtime** (the "memos program the agent" mechanic — a freshly ingested memo takes effect immediately). Actions: `approve`, `flag` (with `contradicts`/`governs` edge to the exact node cited), `reject`. Flagged nodes stay visible in red; the Auditor never silently deletes.

**Triggers:** automatically on every ingestion (pipeline runs over the newly ingested nodes); and a manual **Run Council** button that re-reviews **all non-superseded asset nodes, approved ones included** — so a new standard can reverse an earlier approval (the demo's showpiece mechanism).

**Error handling (demo-grade):** each agent call retries once on failure or malformed JSON; on second failure the ingestion lands as `pending` with a visible "awaiting review" state. The app degrades to a human-review queue, never to a stack trace.

## 5. UI

One page, dark theme, two zones:

- **Left ~60% — the living graph** (`react-force-graph-2d`). Color = status, shape/icon = type. Node click → detail drawer: content, context, provenance chain (source → author → reviews), standards it was judged against. Fed by Supabase Realtime.
- **Right ~40% — tabbed workbench:**
  1. **Capture** — paste box + file drop (`.txt`/`.md`/`.json`) + uploader-name field → runs the pipeline.
  2. **Council Log** — agent feed, newest first: agent avatar (📝/🧹/🕵️), action, one-line reasoning; entries clickable → highlight involved nodes in the graph. Contains the **Run Council** button.
  3. **Start a task** — one input ("what are you about to do?") → 2–4 recommended approved assets with content, why-context, and a "trace" button that lights up the provenance path. Implementation: LLM over the compact node index picks relevant IDs and composes a short answer.
  4. **Library** — a browsable list of live assets, filterable by type (workflows, prompts, lessons…); clicking opens the node drawer.
  5. **Analytics** — four stat cards + two bar charts, computed from graph queries: assets by type/team (growing), Curator merges with examples (duplicated), Auditor flags by standard (governed), teams/asset-types with zero coverage (missing).

**Editing (versioned and governed):** the node drawer has an Edit mode for any live asset. Saving never overwrites: it creates a new node (status `pending`) with the edited content/context, marks the old node `superseded` with a `superseded_by` edge (old versions stay viewable), and immediately runs the Auditor on the new version. Human edits go through the same governance as captured knowledge.

## 6. Seed dataset

Fictional consulting firm, ~50 nodes, loaded by `npm run seed`:

- 6 people across 3 teams; 2 client projects
- ~10 prompts, ~6 workflows, 2 agent configs, ~8 lessons, 3 standards, 4 decisions
- 2 `source` transcripts already captured
- **Planted demo hooks:** one near-duplicate prompt pair (Curator's live merge) and one workflow that will contradict the leadership memo uploaded during the demo (Auditor's reversal beat)

Demo fixtures shipped in repo: one messy-but-realistic Claude conversation export (Scribe beat) and one leadership memo text (memo moment).

## 7. Five-minute demo script

1. **0:00–0:45 Problem.** "When your best consultant leaves, her prompts, workflows, and AI lessons leave with her." One slide → live app with seeded graph.
2. **0:45–1:45 Exhaust capture.** Paste the Claude conversation fixture → Scribe distills three yellow nodes (prompt, workflow, lesson) with why-context and provenance. *"Nobody did data entry."*
3. **1:45–2:45 The Council governs.** Curator merges the planted duplicate (gray-out animates). Auditor approves two, flags one, citing the standard violated. Click the log entry → the graph lights up the reasoning chain.
4. **2:45–3:30 The memo moment (showpiece).** Upload the leadership memo ("all AI client deliverables require senior review — after the Menlo incident") → `standard` node lands → **Run Council** → Auditor reverses an earlier approval, red edge pointing at the memo node. *"Leadership wrote a memo — the agents learned it."*
5. **3:30–4:15 Reuse + analytics.** "Start a task": "market-entry study for a retail client" → best assets with provenance. Flip to Analytics (growing / duplicated / missing). If built: the Library edit beat (edit a workflow → Auditor flags it) or the MCP capture (live or the 20-second backup clip — "the knowledge saves itself"). *"Individual learning is now permanent organizational capability."*
6. **4:15–5:00 Business close** (business teammate takes this minute — spoken script lives in BUSINESS_GUIDE.md §6). Callback: *"You asked for five things — you just saw all five."* Who pays, why they stay (compounding moat), roadmap: auto-capture across all AI clients, role-aware access, enterprise SSO.

The demo follows this click-path; the spoken lines and Q&A prep live in `BUSINESS_GUIDE.md` §2 and §6 — the two documents must stay in sync. If a feature is cut during the build, its row in BUSINESS_GUIDE §2 must be struck the same hour.

## 8. Build order and cut lines

Risk-first; each step leaves a demoable app:

1. Scaffold Next.js + Supabase schema + seed script + fallback snapshot (~1 hr)
2. Graph UI on seeded data + node detail drawer (~1.5 hr)
3. Scribe ingestion pipeline end-to-end (~1.5 hr)
4. Curator + Auditor + Council Log + Run Council (~2 hr)
5. Start a task (~45 min)
6. Analytics (~45 min)
7. Polish, seed tuning, **two full pitch rehearsals** (remainder)

**Cut lines, in order, if time runs out:** pgvector stretch → Analytics tab (present numbers verbally) → Library tab + edit mode. **Never cut:** Scribe→Curator→Auditor core, the memo moment, and Start a task (the reuse payoff).

**Stretch (only if ahead of schedule):**
- **MCP capture server** — a minimal MCP stdio server exposing a `save_to_org_memory` tool that POSTs to the existing `/api/ingest`, so an employee using Claude Desktop/Code can say "save what we learned" and watch the knowledge land in the graph. This is capture-at-the-source — the real product answer to "knowledge is created while employees use AI tools." Demo live only after rehearsal; always keep a pre-recorded 20-second backup clip.
- pgvector embedding column on `nodes`; "Start a task" becomes vector similarity + LLM rerank.

## 9. Testing

Demo-grade: one smoke script (`npm run smoke`) that runs seed → ingests a fixture transcript → runs the council → asserts expected node counts and statuses. Plus two full pitch rehearsals against the exact demo assets. No unit-test suite (deliberate, given the deadline).

## 10. Out of scope (roadmap-only, stated in pitch)

- Full MCP auto-capture across all AI clients (the stretch MCP server covers manual save-to-memory from Claude only; ChatGPT/other clients and automatic background capture remain roadmap)
- The separate higher-ups knowledge graph (HU KG) — cut during design; standards live in the single Org KG instead
- Role-aware access control, auth, SSO
- PDF/docx parsing; format-specific importers
- Multi-tenancy, deployment hardening, production security (RLS, key management)
