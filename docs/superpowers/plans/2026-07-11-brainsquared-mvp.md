# BrainSquared MVP Implementation Plan (3-Engineer Split)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Organizational AI Memory demo — one knowledge graph maintained by a three-agent council (Scribe/Curator/Auditor) — demo-ready before 2026-07-12 9:00 AM ICT.

**Architecture:** Single Next.js (TypeScript, App Router) app. API routes run the agent pipeline against OpenAI (JSON-mode outputs). Supabase Postgres stores `nodes`/`edges`; Supabase Realtime pushes changes to a `react-force-graph-2d` UI. Seed script + local fallback snapshot make the demo restorable and network-failure-tolerant.

**Tech Stack:** Next.js 15 + TypeScript, `@supabase/supabase-js`, `openai`, `react-force-graph-2d`, `dotenv` + `tsx` for scripts. No Tailwind (inline styles — zero config time). No test framework (deliberate, spec §9: demo-grade smoke script instead of TDD).

## Global Constraints

- Node 20+. App Router (`src/app`), import alias `@/*` → `src/*`.
- Env vars (in `.env.local`, never committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4.1`).
- Node statuses and UI colors, verbatim: `pending` #eab308 (yellow), `approved` #22c55e (green), `flagged` #ef4444 (red), `superseded` #64748b (gray).
- ALL agent prompts live in `src/lib/agents/prompts.ts` and nowhere else.
- Every LLM call: JSON mode, one retry, failure never crashes an ingest (spec §4 error handling).
- **File ownership:** each file belongs to exactly one engineer (see task headers). Never edit another track's file — ask its owner.
- **Git:** trunk-based on `master`. `git pull --rebase` before every commit. Commit after every task minimum.
- Design spec: `docs/superpowers/specs/2026-07-11-org-ai-memory-design.md`. This plan implements it 1:1, with two pragmatic deviations noted inline (text IDs instead of uuid; Run Council = Auditor sweep only).

## Team split & timeline

| Time | Engineer A — Backend/Infra | Engineer B — AI/Agents | Engineer C — Frontend |
|---|---|---|---|
| T+0:00–0:30 | **Task 0 together (one machine): scaffold + contracts + schema → push** | | |
| T+0:30–1:30 | A1 data access → A2 seed | B1 runner + prompts | C1 app shell |
| T+1:30–3:00 | A2 seed + fixtures done (**S1**) → A3 analytics | B2 Scribe + ingest (**S2**) | C2 GraphView → C3 drawer |
| T+3:00–5:00 | A4 smoke + snapshot | B3 Curator → B4 Auditor + council (**S3**) | C4 Capture → C5 Council Log |
| T+5:00–6:30 | Integration support | B5 recommender → B6 edit API | C6 Task + Analytics panels (**S4**) |
| T+6:30–8:00 | **All: C7 Library/edit if on time, then polish, seed tuning, 2 timed pitch rehearsals (S5)** | | |

**Sync points:** S1 seeded graph renders · S2 paste→nodes bloom E2E · S3 memo-reversal moment works · S4 all tabs live · S5 rehearsed.
**Cut lines if late (spec §8):** C6 Analytics → B6+C7 Library/edit. Never cut: pipeline core, memo moment, Start a task.

## Interface contracts (all tracks code against these; defined in Task 0)

API routes (all JSON):

- `POST /api/ingest` body `IngestInput` → `PipelineResult`
- `POST /api/council` body `{}` → `PipelineResult`
- `POST /api/task` body `{ description: string }` → `{ ok: boolean; answer: string; nodeIds: string[] }`
- `POST /api/edit` body `{ nodeId: string; content: string; context: string; editor: string }` → `PipelineResult` (versioned edit: new pending node, old superseded, Auditor re-review)
- `GET /api/analytics` → `AnalyticsSummary`

All shared types in `src/lib/types.ts` (full code in Task 0).

---

## Task 0 (ALL THREE, pair on one machine): Scaffold, contracts, schema

**Files:**
- Create: whole Next.js scaffold, `src/lib/types.ts`, `supabase/schema.sql`, `.env.local`, `data/` and `scripts/` dirs

- [ ] **Step 0.1: Scaffold and install.** The repo already contains the folder skeleton (placeholder files pointing at their plan tasks), and `create-next-app` refuses non-empty directories — so scaffold in a sibling temp folder and copy the generated base files in, keeping the skeleton:

```powershell
# from the repo root's PARENT directory:
npx create-next-app@latest bs-temp --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*"
# copy generated config + app shell into the repo (adjust repo folder name if different):
Copy-Item bs-temp/package.json, bs-temp/package-lock.json, bs-temp/tsconfig.json, bs-temp/next.config.ts, bs-temp/next-env.d.ts, bs-temp/eslint.config.mjs, bs-temp/.gitignore GoofyGoobers/
Copy-Item bs-temp/src/app/layout.tsx, bs-temp/src/app/globals.css GoofyGoobers/src/app/
Remove-Item -Recurse -Force bs-temp
# then from the repo root:
npm i
npm i @supabase/supabase-js openai react-force-graph-2d dotenv
npm i -D tsx
```

(`src/app/page.tsx` placeholder stays — Task C1 replaces it. Delete `src/app/favicon.ico` copying if it complains; it's optional.)

- [ ] **Step 0.2: Add scripts to `package.json`** (inside `"scripts"`)

```json
"seed": "tsx scripts/seed.ts",
"smoke": "tsx scripts/smoke.ts",
"snapshot": "tsx scripts/snapshot.ts"
```

- [ ] **Step 0.3: Create Supabase project** (dashboard: new project, region Singapore) and run this in its SQL editor. Create: `supabase/schema.sql` with the same content.

```sql
create table if not exists nodes (
  id text primary key,
  type text not null,
  label text not null,
  content text not null default '',
  context text not null default '',
  status text not null default 'pending',
  author text,
  source jsonb,
  team text,
  created_at timestamptz not null default now()
);
create table if not exists edges (
  id text primary key,
  from_node text not null references nodes(id) on delete cascade,
  to_node text not null references nodes(id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now()
);
alter table nodes disable row level security;
alter table edges disable row level security;
alter publication supabase_realtime add table nodes;
alter publication supabase_realtime add table edges;
```

(Deviation from spec §3: `id` is `text`, not `uuid` — lets seed data and demo fixtures use stable human-readable IDs like `wf-fasttrack`. Nothing else changes.)

- [ ] **Step 0.4: Create `.env.local`** (values from Supabase dashboard → Settings → API, and your OpenAI key). Add `.env.local` to `.gitignore` (create-next-app already ignores `.env*`— verify).

```
NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1
```

- [ ] **Step 0.5: Create `src/lib/types.ts`** — the single source of truth every track imports:

```ts
export type NodeType =
  | 'prompt' | 'workflow' | 'agent_config' | 'lesson' | 'decision' | 'standard'
  | 'person' | 'project' | 'source' | 'agent_action';
export type NodeStatus = 'pending' | 'approved' | 'flagged' | 'superseded';
export type EdgeType =
  | 'derived_from' | 'authored_by' | 'used_in' | 'supports'
  | 'contradicts' | 'superseded_by' | 'reviewed_by' | 'governs';
export type SourceKind =
  | 'claude_conversation' | 'chatgpt_export' | 'slack_thread' | 'config_file' | 'manual';

export const ASSET_TYPES: NodeType[] =
  ['prompt', 'workflow', 'agent_config', 'lesson', 'decision', 'standard'];

export interface KGNode {
  id: string;
  type: NodeType;
  label: string;
  content: string;
  context: string;
  status: NodeStatus;
  author: string | null;
  source: { kind: SourceKind; name: string } | null;
  team: string | null;
  created_at?: string;
}

export interface KGEdge {
  id: string;
  from_node: string;
  to_node: string;
  type: EdgeType;
  created_at?: string;
}

export interface IngestInput {
  text: string;
  uploader: string;
  sourceKind: SourceKind;
  sourceName: string;
}

export interface CouncilLogEntry {
  agent: 'scribe' | 'curator' | 'auditor';
  actionNodeId: string;
  label: string;
  reasoning: string;
  nodeIds: string[];
}

export interface PipelineResult {
  ok: boolean;
  createdNodeIds: string[];
  log: CouncilLogEntry[];
  error?: string;
}

export interface AnalyticsSummary {
  assetsByType: Record<string, number>;
  assetsByTeam: Record<string, number>;
  mergeCount: number;
  flagCount: number;
  gaps: string[];
}
```

- [ ] **Step 0.6: Verify** — `npm run dev`, open http://localhost:3000, default Next page loads. `npx tsc --noEmit` passes.

- [ ] **Step 0.7: Commit and push**

```powershell
git add -A; git pull --rebase; git commit -m "chore: scaffold Next.js app, shared types, Supabase schema"; git push
```

---

# TRACK A — Engineer A (Backend / Infra / Data)

## Task A1: Supabase data access layer

**Files:** Create: `src/lib/supabase.ts`
**Interfaces:** Consumes `types.ts`. Produces (Tracks B & C rely on these exact signatures): `supabase` client, `newId(prefix): string`, `getGraph(): Promise<{nodes: KGNode[]; edges: KGEdge[]}>`, `insertNodes(nodes: KGNode[])`, `insertEdges(edges: KGEdge[])`, `setNodeStatus(id, status)`.

- [ ] **Step A1.1: Write `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js';
import type { KGNode, KGEdge, NodeStatus } from './types';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function getGraph(): Promise<{ nodes: KGNode[]; edges: KGEdge[] }> {
  const [n, e] = await Promise.all([
    supabase.from('nodes').select('*').order('created_at'),
    supabase.from('edges').select('*').order('created_at'),
  ]);
  if (n.error) throw n.error;
  if (e.error) throw e.error;
  return { nodes: n.data as KGNode[], edges: e.data as KGEdge[] };
}

export async function insertNodes(nodes: KGNode[]): Promise<void> {
  if (!nodes.length) return;
  const { error } = await supabase.from('nodes').insert(nodes);
  if (error) throw error;
}

export async function insertEdges(edges: KGEdge[]): Promise<void> {
  if (!edges.length) return;
  const { error } = await supabase.from('edges').insert(edges);
  if (error) throw error;
}

export async function setNodeStatus(id: string, status: NodeStatus): Promise<void> {
  const { error } = await supabase.from('nodes').update({ status }).eq('id', id);
  if (error) throw error;
}
```

- [ ] **Step A1.2: Verify connectivity** — create throwaway `scripts/ping.ts`:

```ts
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });
import('../src/lib/supabase').then(async ({ getGraph }) => {
  const g = await getGraph();
  console.log(`OK: ${g.nodes.length} nodes, ${g.edges.length} edges`);
});
```

Run: `npx tsx scripts/ping.ts` → Expected: `OK: 0 nodes, 0 edges`. Delete `scripts/ping.ts`.

- [ ] **Step A1.3: Commit** — `git add -A; git pull --rebase; git commit -m "feat: supabase data access layer"; git push`

## Task A2: Seed data, fixtures, seed & snapshot scripts

**Files:** Create: `data/seed.json`, `data/fixtures/claude-conversation.txt`, `data/fixtures/leadership-memo.txt`, `scripts/seed.ts`, `scripts/snapshot.ts`
**Interfaces:** Produces the seeded graph (Track C renders it at S1) and the two demo fixtures (used in demo beats 2 and 4). Planted hooks (spec §6): `pr-client-research` (fixture conversation contains a near-duplicate → Curator merge beat) and `wf-fasttrack` (approved now; the memo contradicts it → Auditor reversal beat).

- [ ] **Step A2.1: Write `data/seed.json`.** Fictional firm: **Meridian Advisory** (teams: Strategy, Diligence, Digital). Complete file:

```json
{
  "nodes": [
    { "id": "p-antran", "type": "person", "label": "An Tran", "content": "Managing Partner", "context": "", "status": "approved", "author": null, "source": null, "team": "Strategy" },
    { "id": "p-minhle", "type": "person", "label": "Minh Le", "content": "Senior Consultant", "context": "", "status": "approved", "author": null, "source": null, "team": "Strategy" },
    { "id": "p-sarahchen", "type": "person", "label": "Sarah Chen", "content": "Diligence Lead", "context": "", "status": "approved", "author": null, "source": null, "team": "Diligence" },
    { "id": "p-davidosei", "type": "person", "label": "David Osei", "content": "Consultant", "context": "", "status": "approved", "author": null, "source": null, "team": "Diligence" },
    { "id": "p-linhpham", "type": "person", "label": "Linh Pham", "content": "Digital Practice Lead", "context": "", "status": "approved", "author": null, "source": null, "team": "Digital" },
    { "id": "p-priyanair", "type": "person", "label": "Priya Nair", "content": "Analyst", "context": "", "status": "approved", "author": null, "source": null, "team": "Digital" },
    { "id": "proj-falcon", "type": "project", "label": "Project Falcon — retail market entry (VN)", "content": "Market-entry study for a regional retail client entering Vietnam.", "context": "", "status": "approved", "author": null, "source": null, "team": "Strategy" },
    { "id": "proj-harbor", "type": "project", "label": "Project Harbor — fintech due diligence", "content": "Buy-side DD on a SEA payments startup.", "context": "", "status": "approved", "author": null, "source": null, "team": "Diligence" },
    { "id": "pr-client-research", "type": "prompt", "label": "Client research brief prompt", "content": "You are a strategy analyst. Given a company name and industry, produce: (1) 5-bullet company overview, (2) top 3 competitors with revenue estimates, (3) three risks, (4) two growth levers. Cite a source for every number. Only use sources published after 2024.", "context": "Minh's team iterated 6 times; the post-2024 source constraint fixed stale-market-size errors. Works best with GPT-4.1.", "status": "approved", "author": "Minh Le", "source": { "kind": "manual", "name": "prompt library" }, "team": "Strategy" },
    { "id": "pr-proposal-draft", "type": "prompt", "label": "Proposal first-draft prompt", "content": "Draft a consulting proposal using template v3: situation, approach, workplan (3 phases), team, fees placeholder. Tone: direct, no superlatives. Input: discovery-call notes.", "context": "Cuts proposal drafting from 4h to 40min. Requires discovery notes as input or it invents scope.", "status": "approved", "author": "Minh Le", "source": { "kind": "manual", "name": "prompt library" }, "team": "Strategy" },
    { "id": "pr-interview-synth", "type": "prompt", "label": "Expert interview synthesis prompt", "content": "Given a raw interview transcript, extract: key claims (with confidence), contradictions with prior interviews, follow-up questions. Output as a table.", "context": "Built on Project Harbor; catches contradictions humans miss across 10+ interviews.", "status": "approved", "author": "Sarah Chen", "source": { "kind": "claude_conversation", "name": "harbor-interviews chat" }, "team": "Diligence" },
    { "id": "pr-swot-gen", "type": "prompt", "label": "Rapid SWOT generator", "content": "Generate a SWOT for {company} grounded ONLY in the attached research pack. Flag any cell where evidence is weak.", "context": "The 'grounded only' clause stops hallucinated strengths. Weak-evidence flags drive follow-up research.", "status": "approved", "author": "Priya Nair", "source": { "kind": "chatgpt_export", "name": "swot-experiments" }, "team": "Digital" },
    { "id": "wf-fasttrack", "type": "workflow", "label": "Fast-track deliverable workflow", "content": "For deliverables under $10k: (1) draft with AI using approved prompts, (2) author self-review against checklist, (3) send directly to client same day. Senior review skipped to hit turnaround targets.", "context": "Introduced to win small engagements on speed. Saves ~1 day per deliverable.", "status": "approved", "author": "David Osei", "source": { "kind": "manual", "name": "ops wiki" }, "team": "Diligence" },
    { "id": "wf-dd-datapack", "type": "workflow", "label": "DD data-pack assembly workflow", "content": "(1) Pull registry filings, (2) run financials through the extraction agent, (3) cross-check revenue vs bank statements, (4) log anomalies in the red-flag sheet.", "context": "Step 3 added after Project Harbor found a 20% revenue overstatement.", "status": "approved", "author": "Sarah Chen", "source": { "kind": "manual", "name": "ops wiki" }, "team": "Diligence" },
    { "id": "wf-content-qa", "type": "workflow", "label": "Client deliverable QA workflow", "content": "(1) AI draft, (2) fact-check pass with citations verified, (3) senior consultant review, (4) partner sign-off for >$50k engagements.", "context": "The baseline QA path for standard deliverables.", "status": "approved", "author": "An Tran", "source": { "kind": "manual", "name": "ops wiki" }, "team": "Strategy" },
    { "id": "ac-extraction-agent", "type": "agent_config", "label": "Financials extraction agent config", "content": "Model: gpt-4.1. System: extract P&L lines from uploaded statements into the standard schema; refuse to guess missing values; output JSON. Temperature 0.", "context": "Refuse-to-guess instruction added after it fabricated a depreciation line on Harbor.", "status": "approved", "author": "Sarah Chen", "source": { "kind": "config_file", "name": "extraction-agent.yaml" }, "team": "Diligence" },
    { "id": "ls-registry-hallucination", "type": "lesson", "label": "Models hallucinate VN registry numbers", "content": "GPT and Claude both invent plausible-looking Vietnamese company registration numbers. Always verify against the National Business Registration Portal.", "context": "Cost us a rework cycle on Falcon when a cited registration number didn't exist.", "status": "approved", "author": "Minh Le", "source": { "kind": "claude_conversation", "name": "falcon-research chat" }, "team": "Strategy" },
    { "id": "ls-old-market-data", "type": "lesson", "label": "Constrain market sizing to post-2024 sources", "content": "Unconstrained prompts pull pre-COVID market reports and overstate growth. Add an explicit source-date constraint.", "context": "Root cause of the stale numbers in early Falcon drafts; fixed by the constraint now baked into pr-client-research.", "status": "approved", "author": "Minh Le", "source": { "kind": "claude_conversation", "name": "falcon-research chat" }, "team": "Strategy" },
    { "id": "ls-translation-tone", "type": "lesson", "label": "VN→EN translation flattens tone", "content": "Machine translation of client interviews loses hedging and politeness cues that matter for reading commitment levels. Have a bilingual reviewer spot-check key quotes.", "context": "Misread a lukewarm partner as enthusiastic on Falcon; caught in review.", "status": "approved", "author": "Linh Pham", "source": { "kind": "slack_thread", "name": "#project-falcon" }, "team": "Digital" },
    { "id": "ls-agent-context-limit", "type": "lesson", "label": "Extraction agent fails silently past ~50 pages", "content": "Beyond ~50 pages the extraction agent starts skipping statements without warning. Chunk uploads to 30 pages.", "context": "Found during Harbor when Q3 statements vanished from output.", "status": "approved", "author": "David Osei", "source": { "kind": "slack_thread", "name": "#project-harbor" }, "team": "Diligence" },
    { "id": "st-no-client-names", "type": "standard", "label": "No real client names in stored prompts", "content": "Prompts saved to the firm library must use placeholders ({company}, {client}) — never real client names or confidential figures.", "context": "Confidentiality obligation under our MSAs.", "status": "approved", "author": "An Tran", "source": { "kind": "manual", "name": "partner memo 2026-02" }, "team": "Strategy" },
    { "id": "st-cite-sources", "type": "standard", "label": "Every client-facing number needs a cited source", "content": "Any figure in a client deliverable must carry a verifiable citation. AI-generated numbers without sources are treated as unverified.", "context": "Adopted after two near-miss factual errors in 2025.", "status": "approved", "author": "An Tran", "source": { "kind": "manual", "name": "partner memo 2025-11" }, "team": "Strategy" },
    { "id": "st-approved-data", "type": "standard", "label": "DD uses approved data sources only", "content": "Due-diligence work may only rely on the approved source list (registry portals, audited statements, licensed databases).", "context": "Regulatory defensibility of DD conclusions.", "status": "approved", "author": "Sarah Chen", "source": { "kind": "manual", "name": "DD practice guide" }, "team": "Diligence" },
    { "id": "dc-default-model", "type": "decision", "label": "GPT-4.1 is the firm default drafting model", "content": "Standardized on GPT-4.1 for drafting (March 2026) after bake-off vs three alternatives on proposal quality.", "context": "Consistency of outputs across teams; revisit quarterly.", "status": "approved", "author": "An Tran", "source": { "kind": "manual", "name": "partner meeting 2026-03" }, "team": "Strategy" },
    { "id": "dc-proposal-template", "type": "decision", "label": "Proposal template v3 is mandatory", "content": "All proposals use template v3 structure. Older templates retired.", "context": "Clients compared inconsistent proposals from two teams in 2025 — embarrassing.", "status": "approved", "author": "An Tran", "source": { "kind": "manual", "name": "partner meeting 2026-01" }, "team": "Strategy" },
    { "id": "dc-ai-disclosure", "type": "decision", "label": "AI use disclosed in engagement letters", "content": "Engagement letters state that AI tools assist drafting and analysis under human review.", "context": "Client trust and legal advice both pointed the same way.", "status": "approved", "author": "An Tran", "source": { "kind": "manual", "name": "partner meeting 2026-04" }, "team": "Strategy" },
    { "id": "src-falcon-chat", "type": "source", "label": "falcon-research chat (Claude, 2026-06-30)", "content": "Archived Claude conversation in which Minh iterated the client research prompt and hit the registry-number hallucination.", "context": "", "status": "approved", "author": "Minh Le", "source": { "kind": "claude_conversation", "name": "falcon-research chat" }, "team": "Strategy" }
  ],
  "edges": [
    { "id": "e-01", "from_node": "pr-client-research", "to_node": "p-minhle", "type": "authored_by" },
    { "id": "e-02", "from_node": "pr-proposal-draft", "to_node": "p-minhle", "type": "authored_by" },
    { "id": "e-03", "from_node": "pr-interview-synth", "to_node": "p-sarahchen", "type": "authored_by" },
    { "id": "e-04", "from_node": "pr-swot-gen", "to_node": "p-priyanair", "type": "authored_by" },
    { "id": "e-05", "from_node": "wf-fasttrack", "to_node": "p-davidosei", "type": "authored_by" },
    { "id": "e-06", "from_node": "wf-dd-datapack", "to_node": "p-sarahchen", "type": "authored_by" },
    { "id": "e-07", "from_node": "wf-content-qa", "to_node": "p-antran", "type": "authored_by" },
    { "id": "e-08", "from_node": "ac-extraction-agent", "to_node": "p-sarahchen", "type": "authored_by" },
    { "id": "e-09", "from_node": "ls-registry-hallucination", "to_node": "p-minhle", "type": "authored_by" },
    { "id": "e-10", "from_node": "ls-old-market-data", "to_node": "p-minhle", "type": "authored_by" },
    { "id": "e-11", "from_node": "ls-translation-tone", "to_node": "p-linhpham", "type": "authored_by" },
    { "id": "e-12", "from_node": "ls-agent-context-limit", "to_node": "p-davidosei", "type": "authored_by" },
    { "id": "e-13", "from_node": "st-no-client-names", "to_node": "p-antran", "type": "authored_by" },
    { "id": "e-14", "from_node": "st-cite-sources", "to_node": "p-antran", "type": "authored_by" },
    { "id": "e-15", "from_node": "st-approved-data", "to_node": "p-sarahchen", "type": "authored_by" },
    { "id": "e-16", "from_node": "pr-client-research", "to_node": "proj-falcon", "type": "used_in" },
    { "id": "e-17", "from_node": "pr-interview-synth", "to_node": "proj-harbor", "type": "used_in" },
    { "id": "e-18", "from_node": "wf-dd-datapack", "to_node": "proj-harbor", "type": "used_in" },
    { "id": "e-19", "from_node": "ac-extraction-agent", "to_node": "proj-harbor", "type": "used_in" },
    { "id": "e-20", "from_node": "pr-client-research", "to_node": "src-falcon-chat", "type": "derived_from" },
    { "id": "e-21", "from_node": "ls-registry-hallucination", "to_node": "src-falcon-chat", "type": "derived_from" },
    { "id": "e-22", "from_node": "ls-old-market-data", "to_node": "src-falcon-chat", "type": "derived_from" },
    { "id": "e-23", "from_node": "ls-old-market-data", "to_node": "pr-client-research", "type": "supports" },
    { "id": "e-24", "from_node": "ls-agent-context-limit", "to_node": "ac-extraction-agent", "type": "supports" }
  ]
}
```

- [ ] **Step A2.2: Write `data/fixtures/claude-conversation.txt`** (demo beat 2 — contains one near-dup prompt, one workflow, one lesson; uploader will be Sarah Chen):

```
Exported Claude conversation — Sarah Chen — 2026-07-10

Sarah: I need to research target companies for the new retail DD. Help me write a reusable prompt.
Claude: Here's a draft: "Given a company name and industry, summarize the company, list competitors, and note risks."
Sarah: Too shallow. I want numbered outputs: overview bullets, top 3 competitors with revenue estimates, three risks, two growth levers. And force citations.
Claude: Updated: "You are a research analyst. Given a company name and industry, produce: (1) a 5-bullet company overview, (2) the top 3 competitors with revenue estimates, (3) three key risks, (4) two growth levers. Provide a cited source for every figure."
Sarah: Better. It kept quoting a 2019 market report though, which inflated the market size badly.
Claude: Add a constraint: "Only cite sources published after 2024."
Sarah: That fixed it. Also — process question. For these small retail DDs I'll run it like this: first run this research prompt per target, then compile a comparison matrix, then do a red-flag pass against the registry portal, then write the summary memo. Sound right?
Claude: Yes — four steps: (1) run the research prompt per target company, (2) compile the comparison matrix, (3) red-flag pass verifying registrations against the national portal, (4) draft the summary memo for senior review.
Sarah: One more thing I learned today: when I paste more than about ten filings at once, you started silently dropping the later ones. I'll batch uploads to five filings from now on.
Claude: Good practice — smaller batches avoid silent truncation of later documents.
Sarah: Great. Saving this whole thread so the team can reuse it.
```

- [ ] **Step A2.3: Write `data/fixtures/leadership-memo.txt`** (demo beat 4 — contradicts `wf-fasttrack`; uploader will be An Tran):

```
PARTNER MEMO — 2026-07-11 — From: An Tran, Managing Partner

Subject: Mandatory senior review for AI-drafted client deliverables

Effective immediately, every client-facing deliverable drafted with AI assistance
must be reviewed by a senior consultant before it is sent to the client. No
exceptions for deal size or turnaround pressure.

Rationale: last month's Menlo Retail incident — an unreviewed AI-drafted brief
quoted a competitor's confidential figures. The client caught it before damage
was done. We will not rely on luck twice.

This supersedes any team-level fast-track arrangements that skip senior review.
```

- [ ] **Step A2.4: Write `scripts/seed.ts`**

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });
import seed from '../data/seed.json';

async function main() {
  const { supabase } = await import('../src/lib/supabase');
  await supabase.from('edges').delete().neq('id', '');
  await supabase.from('nodes').delete().neq('id', '');
  const { error: nErr } = await supabase.from('nodes').insert(seed.nodes);
  if (nErr) throw nErr;
  const { error: eErr } = await supabase.from('edges').insert(seed.edges);
  if (eErr) throw eErr;
  console.log(`Seeded ${seed.nodes.length} nodes, ${seed.edges.length} edges`);
}
main().catch((e) => { console.error(e); process.exit(1); });
```

(If `import seed from '../data/seed.json'` complains, add `"resolveJsonModule": true` to `tsconfig.json` compilerOptions — usually already set.)

- [ ] **Step A2.5: Write `scripts/snapshot.ts`** (fallback for venue network failure, spec §2):

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });
import { writeFileSync } from 'fs';

async function main() {
  const { getGraph } = await import('../src/lib/supabase');
  const g = await getGraph();
  writeFileSync('public/fallback-snapshot.json', JSON.stringify(g, null, 2));
  console.log(`Snapshot: ${g.nodes.length} nodes, ${g.edges.length} edges`);
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step A2.6: Verify** — `npm run seed` → `Seeded 26 nodes, 24 edges`. `npm run snapshot` → snapshot line. Re-run `npm run seed` (idempotency) → same output.

- [ ] **Step A2.7: Commit** — `git add -A; git pull --rebase; git commit -m "feat: seed data, demo fixtures, seed/snapshot scripts"; git push` **← SYNC S1: tell Engineer C the graph has data.**

## Task A3: Analytics API

**Files:** Create: `src/app/api/analytics/route.ts`
**Interfaces:** Consumes `getGraph`. Produces `GET /api/analytics` → `AnalyticsSummary` (Track C's AnalyticsPanel renders it).

- [ ] **Step A3.1: Write the route**

```ts
import { NextResponse } from 'next/server';
import { getGraph } from '@/lib/supabase';
import { ASSET_TYPES, type AnalyticsSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { nodes } = await getGraph();
    const assets = nodes.filter(n => ASSET_TYPES.includes(n.type) && n.status !== 'superseded');
    const assetsByType: Record<string, number> = {};
    const assetsByTeam: Record<string, number> = {};
    for (const a of assets) {
      assetsByType[a.type] = (assetsByType[a.type] ?? 0) + 1;
      if (a.team) assetsByTeam[a.team] = (assetsByTeam[a.team] ?? 0) + 1;
    }
    const actions = nodes.filter(n => n.type === 'agent_action');
    const mergeCount = actions.filter(n => n.label.startsWith('curator: merge')).length;
    const flagCount = actions.filter(n => n.label.startsWith('auditor: flagged')).length;
    const teams = [...new Set(nodes.filter(n => n.team).map(n => n.team as string))];
    const gaps: string[] = [];
    for (const team of teams) {
      for (const t of ['prompt', 'workflow', 'lesson'] as const) {
        if (!assets.some(a => a.team === team && a.type === t)) {
          gaps.push(`${team} team has no ${t}s in the memory`);
        }
      }
    }
    const summary: AnalyticsSummary = { assetsByType, assetsByTeam, mergeCount, flagCount, gaps };
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step A3.2: Verify** — with `npm run dev` running: `curl.exe http://localhost:3000/api/analytics` → JSON with `assetsByType` counts matching seed (4 prompts, 3 workflows, …) and at least one gap (Digital has no workflows).

- [ ] **Step A3.3: Commit** — `git add -A; git pull --rebase; git commit -m "feat: analytics API"; git push`

## Task A4: Smoke script

**Files:** Create: `scripts/smoke.ts`
**Interfaces:** Consumes `runIngestPipeline` from Track B (exact name from Task B2) and the fixture file. Blocked by B2 — coordinate; until then write it and leave unrun.

- [ ] **Step A4.1: Write `scripts/smoke.ts`**

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });
import { readFileSync } from 'fs';

async function main() {
  const { getGraph } = await import('../src/lib/supabase');
  const { runIngestPipeline } = await import('../src/lib/agents/pipeline');
  const before = await getGraph();
  const text = readFileSync('data/fixtures/claude-conversation.txt', 'utf8');
  const result = await runIngestPipeline({
    text, uploader: 'Sarah Chen', sourceKind: 'claude_conversation',
    sourceName: 'smoke-test-conversation',
  });
  const after = await getGraph();
  const newAssets = result.createdNodeIds.length;
  const newActions = after.nodes.filter(n => n.type === 'agent_action').length
    - before.nodes.filter(n => n.type === 'agent_action').length;
  console.log(`assets created: ${newAssets}, agent actions logged: ${newActions}, log entries: ${result.log.length}`);
  if (!result.ok) throw new Error('pipeline reported not ok');
  if (newAssets < 1) throw new Error('scribe extracted nothing');
  if (newActions < 2) throw new Error('council did not log actions');
  console.log('SMOKE PASS');
}
main().catch((e) => { console.error('SMOKE FAIL:', e); process.exit(1); });
```

- [ ] **Step A4.2: Verify (after B2/B4 land)** — `npm run seed` then `npm run smoke` → `SMOKE PASS`. Then `npm run seed` again to restore clean demo state.

- [ ] **Step A4.3: Commit** — `git add -A; git pull --rebase; git commit -m "feat: smoke script"; git push`

---

# TRACK B — Engineer B (AI / Agents)

## Task B1: Agent runner + all prompts

**Files:** Create: `src/lib/agents/runner.ts`, `src/lib/agents/prompts.ts`
**Interfaces:** Consumes `supabase.ts` (A1). Produces: `llmJson<T>(system, user): Promise<T>`, `logAction(agent, action, reasoning, nodeIds): Promise<KGNode>` — B2–B5 build on these.

- [ ] **Step B1.1: Write `src/lib/agents/runner.ts`**

```ts
import OpenAI from 'openai';
import { insertNodes, insertEdges, newId } from '../supabase';
import type { KGNode, KGEdge } from '../types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1';

export async function llmJson<T>(system: string, user: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await openai.chat.completions.create({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      return JSON.parse(res.choices[0].message.content ?? '') as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export async function logAction(
  agent: 'scribe' | 'curator' | 'auditor',
  action: string,
  reasoning: string,
  nodeIds: string[]
): Promise<KGNode> {
  const node: KGNode = {
    id: newId('act'), type: 'agent_action', label: `${agent}: ${action}`,
    content: reasoning, context: '', status: 'approved', author: agent,
    source: null, team: null,
  };
  await insertNodes([node]);
  const edges: KGEdge[] = nodeIds.map(t => ({
    id: newId('e'), from_node: node.id, to_node: t, type: 'reviewed_by',
  }));
  await insertEdges(edges);
  return node;
}
```

- [ ] **Step B1.2: Write `src/lib/agents/prompts.ts`** — every agent prompt, complete:

```ts
export const SCRIBE_SYSTEM = `You are the Scribe, the capture agent of an organizational AI memory system at a consulting firm. You receive raw text: exported AI conversations, chat threads, config files, or notes. Extract ONLY genuinely reusable AI knowledge assets.

Asset types:
- "prompt": a reusable prompt (capture the final refined version, not early drafts)
- "workflow": a repeatable multi-step process
- "agent_config": settings/instructions for an AI agent or tool
- "lesson": an edge case, failure mode, or hard-won insight
- "decision": a choice that was made, with its rationale
- "standard": a rule or policy the organization must follow

For EVERY asset capture both the artifact and the why:
- "content": the artifact itself (the prompt text, the numbered steps, the rule)
- "context": why it works, when to use it, what failed before it, edge cases discovered

Respond with JSON exactly:
{"assets":[{"type":"...","label":"short specific title","content":"...","context":"..."}],"summary":"one sentence: what you kept and what you skipped"}

Extract 1 to 5 assets. Skip pleasantries, dead ends, duplicated fragments, and anything not reusable. Use placeholders like {company} instead of any real client names.`;

export const CURATOR_SYSTEM = `You are the Curator, the organization agent of an organizational AI memory graph. You receive NEW nodes (just captured) and an INDEX of existing nodes. For each new node decide ONE action:
- "merge": the new node duplicates an existing node (same purpose; wording may differ). The existing node will be retired in favor of the new one.
- "link": the new node relates to an existing node. edge_type "supports" = provides evidence/rationale for it; "used_in" = is used by that project or workflow.
- "pass": no relation worth recording.

Merge ONLY true duplicates. Prefer one strong link over many weak ones.

Respond with JSON exactly:
{"actions":[{"action":"merge"|"link"|"pass","node_id":"<new node id>","target_id":"<existing node id or null>","edge_type":"supports"|"used_in"|null,"reasoning":"one line"}]}

One entry per new node.`;

export const AUDITOR_SYSTEM = `You are the Auditor, the governance agent of an organizational AI memory graph at a consulting firm. You receive the firm's CURRENT standards and decisions, and a set of nodes under review. Judge each node:
- "approve": it does not conflict with any standard or decision.
- "flag": it violates or contradicts a SPECIFIC standard or decision. Cite that node's id in standard_id and name it in your reasoning.

Flag ONLY genuine violations or direct contradictions — not stylistic issues. Standards and decisions under review are approved unless they contradict an existing standard or decision.

Respond with JSON exactly:
{"verdicts":[{"node_id":"...","verdict":"approve"|"flag","standard_id":"<id or null>","reasoning":"one line; when flagging, name the standard/decision violated"}]}

One verdict per node under review.`;

export const RECOMMENDER_SYSTEM = `You help a consulting firm employee starting a new task. You receive their task description and an index of the firm's APPROVED knowledge assets. Pick the 2 to 4 most useful assets and explain briefly.

Respond with JSON exactly:
{"node_ids":["..."],"answer":"2-3 sentences telling the employee what the firm already knows that will help, referencing the assets by name"}`;
```

- [ ] **Step B1.3: Verify** — `npx tsc --noEmit` passes.

- [ ] **Step B1.4: Commit** — `git add -A; git pull --rebase; git commit -m "feat: agent runner and prompts"; git push`

## Task B2: Scribe + pipeline + ingest API

**Files:** Create: `src/lib/agents/scribe.ts`, `src/lib/agents/pipeline.ts`, `src/app/api/ingest/route.ts`
**Interfaces:** Consumes B1 + A1. Produces: `runScribe(input: IngestInput)`, `runIngestPipeline(input: IngestInput): Promise<PipelineResult>` (A4 smoke imports this exact name), `POST /api/ingest` (C4 calls it). Curator/Auditor are stubbed until B3/B4 — pipeline must work with them missing.

- [ ] **Step B2.1: Write `src/lib/agents/scribe.ts`**

```ts
import { llmJson, logAction } from './runner';
import { SCRIBE_SYSTEM } from './prompts';
import { getGraph, insertNodes, insertEdges, newId } from '../supabase';
import type { IngestInput, KGNode, KGEdge, CouncilLogEntry, NodeType } from '../types';

interface ScribeOut {
  assets: { type: NodeType; label: string; content: string; context: string }[];
  summary: string;
}

export async function runScribe(
  input: IngestInput
): Promise<{ createdNodeIds: string[]; log: CouncilLogEntry[] }> {
  const out = await llmJson<ScribeOut>(
    SCRIBE_SYSTEM,
    `UPLOADER: ${input.uploader}\nSOURCE KIND: ${input.sourceKind}\n\nRAW TEXT:\n${input.text}`
  );
  const { nodes: existing } = await getGraph();
  const nodes: KGNode[] = [];
  const edges: KGEdge[] = [];

  const sourceNode: KGNode = {
    id: newId('src'), type: 'source', label: input.sourceName, content: input.text,
    context: '', status: 'approved', author: input.uploader,
    source: { kind: input.sourceKind, name: input.sourceName }, team: null,
  };
  nodes.push(sourceNode);

  let person = existing.find(
    n => n.type === 'person' && n.label.toLowerCase() === input.uploader.toLowerCase()
  );
  if (!person) {
    person = {
      id: newId('p'), type: 'person', label: input.uploader, content: '', context: '',
      status: 'approved', author: null, source: null, team: null,
    };
    nodes.push(person);
  }

  const assetIds: string[] = [];
  for (const a of out.assets) {
    const n: KGNode = {
      id: newId(a.type.slice(0, 2)), type: a.type, label: a.label,
      content: a.content, context: a.context, status: 'pending',
      author: input.uploader, source: { kind: input.sourceKind, name: input.sourceName },
      team: person.team,
    };
    nodes.push(n);
    assetIds.push(n.id);
    edges.push({ id: newId('e'), from_node: n.id, to_node: sourceNode.id, type: 'derived_from' });
    edges.push({ id: newId('e'), from_node: n.id, to_node: person.id, type: 'authored_by' });
  }

  await insertNodes(nodes);
  await insertEdges(edges);
  const action = await logAction('scribe', `captured ${assetIds.length} assets`, out.summary, assetIds);
  return {
    createdNodeIds: assetIds,
    log: [{ agent: 'scribe', actionNodeId: action.id, label: action.label, reasoning: out.summary, nodeIds: assetIds }],
  };
}
```

- [ ] **Step B2.2: Write `src/lib/agents/pipeline.ts`** (Curator/Auditor guarded so B2 ships before B3/B4):

```ts
import { runScribe } from './scribe';
import type { IngestInput, PipelineResult, CouncilLogEntry } from '../types';
import { getGraph } from '../supabase';
import { ASSET_TYPES } from '../types';

export async function runIngestPipeline(input: IngestInput): Promise<PipelineResult> {
  const log: CouncilLogEntry[] = [];
  let createdNodeIds: string[] = [];
  try {
    const s = await runScribe(input);
    createdNodeIds = s.createdNodeIds;
    log.push(...s.log);
    try {
      const { runCurator } = await import('./curator');
      log.push(...(await runCurator(createdNodeIds)).log);
    } catch { /* curator not built yet or failed — nodes stay pending, spec §4 */ }
    try {
      const { runAuditor } = await import('./auditor');
      log.push(...(await runAuditor(createdNodeIds)).log);
    } catch { /* auditor not built yet or failed — nodes stay pending */ }
    return { ok: true, createdNodeIds, log };
  } catch (e) {
    return { ok: false, createdNodeIds, log, error: String(e) };
  }
}

// Run Council button: audit sweep across all live assets.
// (Spec §4 deviation, deliberate: the sweep runs the Auditor only. Running the
// Curator over the whole graph risks surprise merges mid-demo; Curator runs on ingest.)
export async function runCouncilReview(): Promise<PipelineResult> {
  try {
    const { nodes } = await getGraph();
    const ids = nodes
      .filter(n => ASSET_TYPES.includes(n.type) && n.status !== 'superseded')
      .map(n => n.id);
    const { runAuditor } = await import('./auditor');
    const a = await runAuditor(ids);
    return { ok: true, createdNodeIds: [], log: a.log };
  } catch (e) {
    return { ok: false, createdNodeIds: [], log: [], error: String(e) };
  }
}
```

- [ ] **Step B2.3: Write `src/app/api/ingest/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { runIngestPipeline } from '@/lib/agents/pipeline';

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.text || !body.uploader) {
      return NextResponse.json({ ok: false, error: 'text and uploader required' }, { status: 400 });
    }
    const result = await runIngestPipeline({
      text: body.text,
      uploader: body.uploader,
      sourceKind: body.sourceKind ?? 'manual',
      sourceName: body.sourceName ?? `upload by ${body.uploader}`,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step B2.4: Verify** — with `npm run dev` running:

```powershell
curl.exe -X POST http://localhost:3000/api/ingest -H "Content-Type: application/json" -d "{\"text\":\"I refined a prompt today: Summarize a due diligence interview into key claims, contradictions, and follow-ups. Lesson: it misses sarcasm, so review tone manually.\",\"uploader\":\"Priya Nair\",\"sourceKind\":\"manual\",\"sourceName\":\"test note\"}"
```

Expected: `{"ok":true,"createdNodeIds":[...],"log":[{"agent":"scribe",...}]}` with 1–2 created IDs. Check Supabase table editor: new `pending` nodes exist. Run `npm run seed` afterward to restore clean state.

- [ ] **Step B2.5: Commit** — `git add -A; git pull --rebase; git commit -m "feat: scribe agent, ingest pipeline and API"; git push` **← SYNC S2: tell Engineer C `/api/ingest` is live.**

## Task B3: Curator agent

**Files:** Create: `src/lib/agents/curator.ts`
**Interfaces:** Consumes B1 + A1. Produces `runCurator(targetIds: string[]): Promise<{ log: CouncilLogEntry[] }>` (pipeline already imports it dynamically — it activates the moment this file exists).

- [ ] **Step B3.1: Write `src/lib/agents/curator.ts`**

```ts
import { llmJson, logAction } from './runner';
import { CURATOR_SYSTEM } from './prompts';
import { getGraph, insertEdges, setNodeStatus, newId } from '../supabase';
import { ASSET_TYPES, type CouncilLogEntry } from '../types';

interface CuratorOut {
  actions: {
    action: 'merge' | 'link' | 'pass';
    node_id: string;
    target_id: string | null;
    edge_type: 'supports' | 'used_in' | null;
    reasoning: string;
  }[];
}

export async function runCurator(targetIds: string[]): Promise<{ log: CouncilLogEntry[] }> {
  const { nodes } = await getGraph();
  const targets = nodes.filter(n => targetIds.includes(n.id));
  if (!targets.length) return { log: [] };
  const index = nodes
    .filter(n => (ASSET_TYPES.includes(n.type) || n.type === 'project')
      && n.status !== 'superseded' && !targetIds.includes(n.id))
    .map(n => `${n.id} | ${n.type} | ${n.label} | ${n.content.slice(0, 150)}`)
    .join('\n');
  const newList = targets
    .map(n => `${n.id} | ${n.type} | ${n.label} | ${n.content.slice(0, 300)}`)
    .join('\n');

  const out = await llmJson<CuratorOut>(
    CURATOR_SYSTEM,
    `NEW NODES:\n${newList}\n\nEXISTING INDEX:\n${index}`
  );

  const log: CouncilLogEntry[] = [];
  for (const act of out.actions) {
    if (act.action === 'pass') continue;
    if (!act.target_id) continue;
    if (act.action === 'merge') {
      await setNodeStatus(act.target_id, 'superseded');
      await insertEdges([{ id: newId('e'), from_node: act.target_id, to_node: act.node_id, type: 'superseded_by' }]);
    } else if (act.action === 'link' && act.edge_type) {
      await insertEdges([{ id: newId('e'), from_node: act.node_id, to_node: act.target_id, type: act.edge_type }]);
    }
    const a = await logAction('curator', act.action, act.reasoning, [act.node_id, act.target_id]);
    log.push({ agent: 'curator', actionNodeId: a.id, label: a.label, reasoning: act.reasoning, nodeIds: [act.node_id, act.target_id] });
  }
  return { log };
}
```

- [ ] **Step B3.2: Verify** — `npm run seed`, then re-run the Step B2.4 curl but with the full fixture: paste `data/fixtures/claude-conversation.txt` content as `text`, uploader `Sarah Chen`. Expected: log contains a `curator: merge` entry whose nodeIds include `pr-client-research` (the seeded near-duplicate); in Supabase, `pr-client-research` now has status `superseded`. `npm run seed` to restore.

- [ ] **Step B3.3: Commit** — `git add -A; git pull --rebase; git commit -m "feat: curator agent"; git push`

## Task B4: Auditor agent + council API

**Files:** Create: `src/lib/agents/auditor.ts`, `src/app/api/council/route.ts`
**Interfaces:** Consumes B1 + A1. Produces `runAuditor(targetIds: string[]): Promise<{ log: CouncilLogEntry[] }>` and `POST /api/council` (C5's Run Council button calls it).

- [ ] **Step B4.1: Write `src/lib/agents/auditor.ts`** (note: standards/decisions of ANY status count, `pending` included — spec §4, "a fresh memo takes effect immediately"):

```ts
import { llmJson, logAction } from './runner';
import { AUDITOR_SYSTEM } from './prompts';
import { getGraph, insertEdges, setNodeStatus, newId } from '../supabase';
import type { CouncilLogEntry } from '../types';

interface AuditorOut {
  verdicts: {
    node_id: string;
    verdict: 'approve' | 'flag';
    standard_id: string | null;
    reasoning: string;
  }[];
}

export async function runAuditor(targetIds: string[]): Promise<{ log: CouncilLogEntry[] }> {
  const { nodes } = await getGraph();
  const targets = nodes.filter(n => targetIds.includes(n.id) && n.status !== 'superseded');
  if (!targets.length) return { log: [] };
  const rules = nodes.filter(
    n => (n.type === 'standard' || n.type === 'decision') && n.status !== 'superseded'
  );
  const rulesList = rules.map(r => `${r.id} | ${r.type} | ${r.label} | ${r.content}`).join('\n');
  const targetList = targets
    .map(t => `${t.id} | ${t.type} | ${t.label} | ${t.content} | why: ${t.context.slice(0, 200)}`)
    .join('\n');

  const out = await llmJson<AuditorOut>(
    AUDITOR_SYSTEM,
    `CURRENT STANDARDS AND DECISIONS:\n${rulesList}\n\nNODES UNDER REVIEW:\n${targetList}`
  );

  const log: CouncilLogEntry[] = [];
  for (const v of out.verdicts) {
    if (!targets.some(t => t.id === v.node_id)) continue;
    await setNodeStatus(v.node_id, v.verdict === 'approve' ? 'approved' : 'flagged');
    const involved = [v.node_id];
    if (v.verdict === 'flag' && v.standard_id) {
      await insertEdges([{ id: newId('e'), from_node: v.node_id, to_node: v.standard_id, type: 'contradicts' }]);
      involved.push(v.standard_id);
    }
    const a = await logAction('auditor', v.verdict === 'approve' ? 'approved' : 'flagged', v.reasoning, involved);
    if (v.verdict === 'flag' && v.standard_id) {
      await insertEdges([{ id: newId('e'), from_node: a.id, to_node: v.standard_id, type: 'governs' }]);
    }
    log.push({ agent: 'auditor', actionNodeId: a.id, label: a.label, reasoning: v.reasoning, nodeIds: involved });
  }
  return { log };
}
```

- [ ] **Step B4.2: Write `src/app/api/council/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { runCouncilReview } from '@/lib/agents/pipeline';

export const maxDuration = 120;

export async function POST() {
  const result = await runCouncilReview();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
```

- [ ] **Step B4.3: Verify THE MEMO MOMENT end-to-end** (this is the demo's showpiece — it must work here, not first on stage):

1. `npm run seed`
2. Ingest the memo: curl POST `/api/ingest` with `data/fixtures/leadership-memo.txt` content as `text`, uploader `An Tran`, sourceKind `manual`, sourceName `partner memo`. Expected: a new `standard` node created (pending, then approved by the auditor in the same run).
3. `curl.exe -X POST http://localhost:3000/api/council` → Expected: log contains `auditor: flagged` with reasoning naming the senior-review memo, nodeIds including `wf-fasttrack`; in Supabase `wf-fasttrack` status is now `flagged` and a `contradicts` edge points from it to the new standard node.
4. `npm run seed` to restore.

- [ ] **Step B4.4: Commit** — `git add -A; git pull --rebase; git commit -m "feat: auditor agent and council API"; git push` **← SYNC S3: memo moment works. Tell everyone.**

## Task B5: Task recommender API

**Files:** Create: `src/app/api/task/route.ts`
**Interfaces:** Consumes B1 + A1. Produces `POST /api/task` `{ description }` → `{ ok, answer, nodeIds }` (C6's TaskPanel).

- [ ] **Step B5.1: Write the route**

```ts
import { NextResponse } from 'next/server';
import { llmJson } from '@/lib/agents/runner';
import { RECOMMENDER_SYSTEM } from '@/lib/agents/prompts';
import { getGraph } from '@/lib/supabase';
import { ASSET_TYPES } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { description } = await req.json();
    if (!description) return NextResponse.json({ ok: false, error: 'description required' }, { status: 400 });
    const { nodes } = await getGraph();
    const index = nodes
      .filter(n => ASSET_TYPES.includes(n.type) && n.status === 'approved')
      .map(n => `${n.id} | ${n.type} | ${n.label} | ${n.content.slice(0, 150)} | why: ${n.context.slice(0, 100)}`)
      .join('\n');
    const out = await llmJson<{ node_ids: string[]; answer: string }>(
      RECOMMENDER_SYSTEM,
      `TASK: ${description}\n\nAPPROVED ASSETS:\n${index}`
    );
    return NextResponse.json({ ok: true, answer: out.answer, nodeIds: out.node_ids });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step B5.2: Verify** — `curl.exe -X POST http://localhost:3000/api/task -H "Content-Type: application/json" -d "{\"description\":\"starting a market-entry study for a retail client in Vietnam\"}"` → Expected: `nodeIds` includes `pr-client-research` (or its merged successor) and answer references it by name.

- [ ] **Step B5.3: Commit** — `git add -A; git pull --rebase; git commit -m "feat: task recommender API"; git push`

## Task B6: Versioned edit API

**Files:** Create: `src/app/api/edit/route.ts`
**Interfaces:** Consumes `runAuditor` (B4) + A1 data access. Produces `POST /api/edit` (C7's edit mode calls it). Editing never overwrites: new `pending` node, old node `superseded` + `superseded_by` edge, Auditor re-reviews the new version.

- [ ] **Step B6.1: Write `src/app/api/edit/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getGraph, insertNodes, insertEdges, setNodeStatus, newId } from '@/lib/supabase';
import { runAuditor } from '@/lib/agents/auditor';
import type { KGNode } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { nodeId, content, context, editor } = await req.json();
    if (!nodeId || !content || !editor) {
      return NextResponse.json({ ok: false, error: 'nodeId, content, editor required' }, { status: 400 });
    }
    const { nodes } = await getGraph();
    const old = nodes.find(n => n.id === nodeId);
    if (!old) return NextResponse.json({ ok: false, error: 'node not found' }, { status: 404 });
    if (old.status === 'superseded') {
      return NextResponse.json({ ok: false, error: 'cannot edit a superseded version' }, { status: 400 });
    }

    const newNodes: KGNode[] = [];
    let person = nodes.find(
      n => n.type === 'person' && n.label.toLowerCase() === String(editor).toLowerCase()
    );
    if (!person) {
      person = {
        id: newId('p'), type: 'person', label: editor, content: '', context: '',
        status: 'approved', author: null, source: null, team: null,
      };
      newNodes.push(person);
    }
    const revised: KGNode = {
      id: newId(old.type.slice(0, 2)), type: old.type, label: old.label,
      content, context: context ?? old.context, status: 'pending',
      author: editor, source: { kind: 'manual', name: `edit by ${editor}` }, team: person.team,
    };
    newNodes.push(revised);
    await insertNodes(newNodes);
    await insertEdges([
      { id: newId('e'), from_node: old.id, to_node: revised.id, type: 'superseded_by' },
      { id: newId('e'), from_node: revised.id, to_node: person.id, type: 'authored_by' },
    ]);
    await setNodeStatus(old.id, 'superseded');
    const a = await runAuditor([revised.id]);
    return NextResponse.json({ ok: true, createdNodeIds: [revised.id], log: a.log });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step B6.2: Verify** — `npm run seed`, then:

```powershell
curl.exe -X POST http://localhost:3000/api/edit -H "Content-Type: application/json" -d "{\"nodeId\":\"wf-content-qa\",\"content\":\"(1) AI draft, (2) fact-check pass, (3) send directly to client to save time.\",\"context\":\"trimmed for speed\",\"editor\":\"Priya Nair\"}"
```

Expected: `ok:true` with one createdNodeId; in Supabase, `wf-content-qa` is `superseded`, the new node exists, and the Auditor log flags the new version (it drops senior review, contradicting `wf` standards/decisions — reasoning should cite one). `npm run seed` to restore.

- [ ] **Step B6.3: Commit** — `git add -A; git pull --rebase; git commit -m "feat: versioned edit API with auditor re-review"; git push`

---

# TRACK C — Engineer C (Frontend)

All Track C files are client components (`'use client'`). Shared page state lives in `page.tsx`; children receive props only — no state libraries.

## Task C1: App shell and layout

**Files:** Create: `src/app/page.tsx`; Modify: `src/app/globals.css` (replace contents), `src/app/layout.tsx` (title only)
**Interfaces:** Produces the state contract child components consume: `graph`, `selectedNodeId`, `highlightIds`, `refetch`, and tab switching. C2–C6 plug into the named slots.

- [ ] **Step C1.1: Replace `src/app/globals.css` contents**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0b1220; color: #e2e8f0; font-family: ui-sans-serif, system-ui, sans-serif; }
button { cursor: pointer; }
```

- [ ] **Step C1.2: In `src/app/layout.tsx`** set `title: 'BrainSquared — Organizational AI Memory'` in the metadata export. Leave the rest as scaffolded.

- [ ] **Step C1.3: Write `src/app/page.tsx`**

```tsx
'use client';
import { useCallback, useEffect, useState } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';
import { supabase, getGraph } from '@/lib/supabase';
import GraphView from '@/components/GraphView';
import NodeDrawer from '@/components/NodeDrawer';
import CapturePanel from '@/components/CapturePanel';
import CouncilLog from '@/components/CouncilLog';
import TaskPanel from '@/components/TaskPanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';

const TABS = ['Capture', 'Council Log', 'Start a task', 'Analytics'] as const;
type Tab = (typeof TABS)[number];

export default function Home() {
  const [graph, setGraph] = useState<{ nodes: KGNode[]; edges: KGEdge[] }>({ nodes: [], edges: [] });
  const [tab, setTab] = useState<Tab>('Capture');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);

  const refetch = useCallback(async () => {
    if (process.env.NEXT_PUBLIC_USE_FALLBACK === '1') {
      setGraph(await (await fetch('/fallback-snapshot.json')).json());
      return;
    }
    setGraph(await getGraph());
  }, []);

  useEffect(() => {
    refetch();
    if (process.env.NEXT_PUBLIC_USE_FALLBACK === '1') return;
    const ch = supabase
      .channel('kg')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nodes' }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'edges' }, refetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  return (
    <main style={{ display: 'flex', height: '100vh' }}>
      <section style={{ flex: '3 1 0', position: 'relative', borderRight: '1px solid #1e293b' }}>
        <h1 style={{ position: 'absolute', zIndex: 10, padding: 12, fontSize: 18, color: '#94a3b8' }}>
          BrainSquared <span style={{ color: '#475569' }}>— Organizational AI Memory</span>
        </h1>
        <GraphView graph={graph} highlightIds={highlightIds} onNodeClick={setSelectedNodeId} />
        {selectedNodeId && (
          <NodeDrawer graph={graph} nodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} onJump={setSelectedNodeId} />
        )}
      </section>
      <section style={{ flex: '2 1 0', display: 'flex', flexDirection: 'column', minWidth: 380 }}>
        <nav style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: 12, background: tab === t ? '#1e293b' : 'transparent',
              color: tab === t ? '#e2e8f0' : '#64748b', border: 'none', fontSize: 14,
            }}>{t}</button>
          ))}
        </nav>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {tab === 'Capture' && <CapturePanel onDone={refetch} />}
          {tab === 'Council Log' && <CouncilLog graph={graph} onHighlight={setHighlightIds} />}
          {tab === 'Start a task' && <TaskPanel onHighlight={setHighlightIds} graph={graph} />}
          {tab === 'Analytics' && <AnalyticsPanel />}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step C1.4: Create placeholder components** so the page compiles before C2–C6 (each gets replaced by its real task). Create `src/components/GraphView.tsx`, `NodeDrawer.tsx`, `CapturePanel.tsx`, `CouncilLog.tsx`, `TaskPanel.tsx`, `AnalyticsPanel.tsx`, each shaped like:

```tsx
'use client';
export default function GraphView(props: Record<string, unknown>) {
  return <div style={{ padding: 40, color: '#475569' }}>GraphView — coming in Task C2</div>;
}
```

(Adjust the name/text per file. TypeScript prop types arrive with each real implementation.)

- [ ] **Step C1.5: Verify** — `npm run dev`: dark two-pane layout, four tabs switch, placeholders render.

- [ ] **Step C1.6: Commit** — `git add -A; git pull --rebase; git commit -m "feat: app shell with tabs and page state"; git push`

## Task C2: GraphView (the centerpiece)

**Files:** Replace: `src/components/GraphView.tsx`
**Interfaces:** Consumes `{ graph, highlightIds, onNodeClick }` from C1. Requires seeded data (A2/S1).

- [ ] **Step C2.1: Write `src/components/GraphView.tsx`**

```tsx
'use client';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308', approved: '#22c55e', flagged: '#ef4444', superseded: '#64748b',
};
const TYPE_COLORS: Record<string, string> = {
  person: '#3b82f6', project: '#06b6d4', source: '#8b5cf6', agent_action: '#d946ef',
};

export default function GraphView({ graph, highlightIds, onNodeClick }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  highlightIds: string[];
  onNodeClick: (id: string) => void;
}) {
  const data = useMemo(() => ({
    nodes: graph.nodes.map(n => ({ ...n })),
    links: graph.edges
      .filter(e => graph.nodes.some(n => n.id === e.from_node) && graph.nodes.some(n => n.id === e.to_node))
      .map(e => ({ source: e.from_node, target: e.to_node, type: e.type })),
  }), [graph]);

  const hi = new Set(highlightIds);
  const dimmed = hi.size > 0;

  return (
    <ForceGraph2D
      graphData={data}
      backgroundColor="#0b1220"
      nodeId="id"
      nodeLabel={(n: any) => `${n.type}: ${n.label}`}
      nodeVal={(n: any) => (hi.has(n.id) ? 10 : 4)}
      nodeColor={(n: any) => {
        if (dimmed && !hi.has(n.id)) return '#1e293b';
        return TYPE_COLORS[n.type] ?? STATUS_COLORS[n.status] ?? '#94a3b8';
      }}
      linkColor={(l: any) =>
        dimmed && !(hi.has(l.source.id ?? l.source) && hi.has(l.target.id ?? l.target))
          ? '#111827' : '#334155'}
      linkDirectionalArrowLength={3}
      onNodeClick={(n: any) => onNodeClick(n.id)}
      cooldownTicks={80}
    />
  );
}
```

- [ ] **Step C2.2: Verify** — seeded graph renders: green asset cluster, blue people, cyan projects, purple source. Hover shows labels; clicking logs no errors (drawer still placeholder). Insert a row by hand in Supabase table editor → node appears without refresh (Realtime works). Delete it.

- [ ] **Step C2.3: Commit** — `git add -A; git pull --rebase; git commit -m "feat: live force graph with status colors and highlighting"; git push`

## Task C3: NodeDrawer (provenance view)

**Files:** Replace: `src/components/NodeDrawer.tsx`
**Interfaces:** Consumes `{ graph, nodeId, onClose, onJump }`.

- [ ] **Step C3.1: Write `src/components/NodeDrawer.tsx`**

```tsx
'use client';
import type { KGNode, KGEdge } from '@/lib/types';

const EDGE_LABELS: Record<string, string> = {
  derived_from: 'Derived from', authored_by: 'Authored by', used_in: 'Used in',
  supports: 'Supports', contradicts: 'Contradicts', superseded_by: 'Superseded by',
  reviewed_by: 'Reviewed', governs: 'Cites standard',
};

export default function NodeDrawer({ graph, nodeId, onClose, onJump }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  nodeId: string;
  onClose: () => void;
  onJump: (id: string) => void;
}) {
  const node = graph.nodes.find(n => n.id === nodeId);
  if (!node) return null;
  const related = graph.edges
    .filter(e => e.from_node === nodeId || e.to_node === nodeId)
    .map(e => {
      const otherId = e.from_node === nodeId ? e.to_node : e.from_node;
      const other = graph.nodes.find(n => n.id === otherId);
      const dir = e.from_node === nodeId ? '→' : '←';
      return other ? { edge: e, other, dir } : null;
    })
    .filter(Boolean) as { edge: KGEdge; other: KGNode; dir: string }[];

  return (
    <aside style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 360, zIndex: 20,
      background: '#0f172a', borderLeft: '1px solid #1e293b', padding: 16, overflowY: 'auto',
    }}>
      <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', color: '#64748b', fontSize: 18 }}>✕</button>
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b' }}>{node.type} · {node.status}</div>
      <h2 style={{ fontSize: 16, margin: '6px 0 12px' }}>{node.label}</h2>
      {node.content && (<>
        <div style={{ fontSize: 11, color: '#64748b' }}>CONTENT</div>
        <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: '4px 0 12px', color: '#cbd5e1' }}>{node.content}</p>
      </>)}
      {node.context && (<>
        <div style={{ fontSize: 11, color: '#64748b' }}>WHY (CONTEXT)</div>
        <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: '4px 0 12px', color: '#a5b4fc' }}>{node.context}</p>
      </>)}
      {node.author && <p style={{ fontSize: 12, color: '#64748b' }}>By {node.author}{node.source ? ` · from ${node.source.name}` : ''}</p>}
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 12 }}>PROVENANCE & CONNECTIONS</div>
      {related.map(({ edge, other, dir }) => (
        <button key={edge.id} onClick={() => onJump(other.id)} style={{
          display: 'block', width: '100%', textAlign: 'left', margin: '6px 0', padding: 8,
          background: '#1e293b', border: 'none', borderRadius: 6, color: '#e2e8f0', fontSize: 12,
        }}>
          <span style={{ color: '#f472b6' }}>{EDGE_LABELS[edge.type] ?? edge.type} {dir}</span> {other.label}
        </button>
      ))}
    </aside>
  );
}
```

- [ ] **Step C3.2: Verify** — click `pr-client-research` in the graph: drawer shows content, the why-context, author Minh Le, and buttons for its edges (authored_by, used_in, derived_from, supports). Jump buttons navigate.

- [ ] **Step C3.3: Commit** — `git add -A; git pull --rebase; git commit -m "feat: node drawer with provenance"; git push`

## Task C4: CapturePanel

**Files:** Replace: `src/components/CapturePanel.tsx`
**Interfaces:** Consumes `POST /api/ingest` (B2/S2) and `{ onDone }`.

- [ ] **Step C4.1: Write `src/components/CapturePanel.tsx`**

```tsx
'use client';
import { useState } from 'react';
import type { SourceKind, PipelineResult } from '@/lib/types';

const KINDS: { v: SourceKind; l: string }[] = [
  { v: 'claude_conversation', l: 'Claude conversation' },
  { v: 'chatgpt_export', l: 'ChatGPT export' },
  { v: 'slack_thread', l: 'Slack thread' },
  { v: 'config_file', l: 'Agent config file' },
  { v: 'manual', l: 'Notes / other' },
];

export default function CapturePanel({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('');
  const [uploader, setUploader] = useState('');
  const [kind, setKind] = useState<SourceKind>('claude_conversation');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);

  async function submit() {
    if (!text.trim() || !uploader.trim()) return;
    setBusy(true); setResult(null);
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, uploader, sourceKind: kind, sourceName: `${kind} from ${uploader}` }),
      });
      const json: PipelineResult = await res.json();
      setResult(json);
      if (json.ok) { setText(''); onDone(); }
    } finally { setBusy(false); }
  }

  function onFile(f: File | undefined) {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setText(String(r.result ?? ''));
    r.readAsText(f);
  }

  const inputStyle = { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', padding: 8, fontSize: 13, marginBottom: 8 };
  return (
    <div>
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
        Drop in the exhaust of AI work — conversations, threads, configs. The Scribe distills it into memory.
      </p>
      <input style={inputStyle} placeholder="Your name" value={uploader} onChange={e => setUploader(e.target.value)} />
      <select style={inputStyle} value={kind} onChange={e => setKind(e.target.value as SourceKind)}>
        {KINDS.map(k => <option key={k.v} value={k.v}>{k.l}</option>)}
      </select>
      <textarea style={{ ...inputStyle, height: 180 }} placeholder="Paste raw text…" value={text} onChange={e => setText(e.target.value)} />
      <input type="file" accept=".txt,.md,.json" onChange={e => onFile(e.target.files?.[0])} style={{ fontSize: 12, marginBottom: 8, color: '#94a3b8' }} />
      <button onClick={submit} disabled={busy} style={{
        width: '100%', padding: 10, background: busy ? '#334155' : '#4f46e5', color: 'white',
        border: 'none', borderRadius: 6, fontSize: 14,
      }}>{busy ? 'The Council is reviewing…' : 'Capture into memory'}</button>
      {result && (
        <div style={{ marginTop: 12, fontSize: 12, color: result.ok ? '#22c55e' : '#ef4444' }}>
          {result.ok
            ? `Captured ${result.createdNodeIds.length} assets · ${result.log.length} council actions — see Council Log`
            : `Capture landed as pending — council will review (${result.error ?? 'agent error'})`}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step C4.2: Verify** — paste the fixture conversation, name `Sarah Chen`, submit. Watch yellow nodes bloom in the graph, then flip green/red as the council rules. `npm run seed` afterward.

- [ ] **Step C4.3: Commit** — `git add -A; git pull --rebase; git commit -m "feat: capture panel"; git push`

## Task C5: CouncilLog + Run Council

**Files:** Replace: `src/components/CouncilLog.tsx`
**Interfaces:** Consumes `graph` + `onHighlight` from C1, `POST /api/council` (B4). Log entries ARE `agent_action` nodes read from the graph — no separate store.

- [ ] **Step C5.1: Write `src/components/CouncilLog.tsx`**

```tsx
'use client';
import { useState } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';

const AVATARS: Record<string, string> = { scribe: '📝', curator: '🧹', auditor: '🕵️' };

export default function CouncilLog({ graph, onHighlight }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  onHighlight: (ids: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const actions = graph.nodes
    .filter(n => n.type === 'agent_action')
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));

  function highlight(action: KGNode) {
    const ids = graph.edges
      .filter(e => e.from_node === action.id)
      .map(e => e.to_node);
    onHighlight([action.id, ...ids]);
  }

  async function runCouncil() {
    setBusy(true);
    try { await fetch('/api/council', { method: 'POST' }); } finally { setBusy(false); }
  }

  return (
    <div>
      <button onClick={runCouncil} disabled={busy} style={{
        width: '100%', padding: 10, marginBottom: 12, background: busy ? '#334155' : '#7c3aed',
        color: 'white', border: 'none', borderRadius: 6, fontSize: 14,
      }}>{busy ? 'Council in session…' : '⚖️ Run Council — re-review all knowledge'}</button>
      <button onClick={() => onHighlight([])} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, marginBottom: 8 }}>clear highlight</button>
      {actions.length === 0 && <p style={{ fontSize: 13, color: '#64748b' }}>No council activity yet — capture something.</p>}
      {actions.map(a => {
        const agent = a.author ?? 'scribe';
        return (
          <button key={a.id} onClick={() => highlight(a)} style={{
            display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: 10,
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0',
          }}>
            <div style={{ fontSize: 13 }}>{AVATARS[agent] ?? '🤖'} <b>{a.label}</b></div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{a.content}</div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step C5.2: Verify** — after a capture, log shows scribe/curator/auditor entries newest-first; clicking one dims the graph and enlarges the involved nodes; Run Council triggers an audit sweep whose new entries appear via Realtime.

- [ ] **Step C5.3: Commit** — `git add -A; git pull --rebase; git commit -m "feat: council log with run-council and graph highlighting"; git push`

## Task C6: TaskPanel + AnalyticsPanel

**Files:** Replace: `src/components/TaskPanel.tsx`, `src/components/AnalyticsPanel.tsx`
**Interfaces:** Consumes `POST /api/task` (B5), `GET /api/analytics` (A3), `onHighlight`, `graph`.

- [ ] **Step C6.1: Write `src/components/TaskPanel.tsx`**

```tsx
'use client';
import { useState } from 'react';
import type { KGNode, KGEdge } from '@/lib/types';

export default function TaskPanel({ graph, onHighlight }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  onHighlight: (ids: string[]) => void;
}) {
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ answer: string; nodeIds: string[] } | null>(null);

  async function go() {
    if (!desc.trim()) return;
    setBusy(true); setRes(null);
    try {
      const r = await fetch('/api/task', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc }),
      });
      const json = await r.json();
      if (json.ok) setRes(json);
    } finally { setBusy(false); }
  }

  function trace(id: string) {
    const around = graph.edges
      .filter(e => e.from_node === id || e.to_node === id)
      .flatMap(e => [e.from_node, e.to_node]);
    onHighlight([id, ...around]);
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>What are you about to work on? The memory surfaces what the firm already knows.</p>
      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. starting a market-entry study for a retail client"
        style={{ width: '100%', height: 80, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', padding: 8, fontSize: 13, marginBottom: 8 }} />
      <button onClick={go} disabled={busy} style={{ width: '100%', padding: 10, background: busy ? '#334155' : '#4f46e5', color: 'white', border: 'none', borderRadius: 6, fontSize: 14 }}>
        {busy ? 'Searching the memory…' : 'Find relevant knowledge'}
      </button>
      {res && (<div style={{ marginTop: 12 }}>
        <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8 }}>{res.answer}</p>
        {res.nodeIds.map(id => {
          const n = graph.nodes.find(x => x.id === id);
          if (!n) return null;
          return (
            <div key={id} style={{ padding: 10, marginBottom: 8, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}>
              <div style={{ fontSize: 13 }}><b>{n.label}</b> <span style={{ color: '#64748b' }}>({n.type})</span></div>
              <div style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0' }}>{n.context.slice(0, 140)}</div>
              <button onClick={() => trace(id)} style={{ fontSize: 12, background: 'none', border: '1px solid #4f46e5', color: '#818cf8', borderRadius: 4, padding: '2px 8px' }}>trace in graph</button>
            </div>
          );
        })}
      </div>)}
    </div>
  );
}
```

- [ ] **Step C6.2: Write `src/components/AnalyticsPanel.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import type { AnalyticsSummary } from '@/lib/types';

function Bars({ title, data }: { title: string; data: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(data));
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>{title}</div>
      {Object.entries(data).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', marginBottom: 4, fontSize: 12 }}>
          <span style={{ width: 110, color: '#94a3b8' }}>{k}</span>
          <div style={{ height: 10, width: `${(v / max) * 60}%`, background: '#4f46e5', borderRadius: 3, marginRight: 6 }} />
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPanel() {
  const [a, setA] = useState<AnalyticsSummary | null>(null);
  useEffect(() => { fetch('/api/analytics').then(r => r.json()).then(setA); }, []);
  if (!a) return <p style={{ fontSize: 13, color: '#64748b' }}>Computing…</p>;
  const card = { flex: 1, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 12, textAlign: 'center' as const };
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={card}><div style={{ fontSize: 22 }}>{Object.values(a.assetsByType).reduce((s, n) => s + n, 0)}</div><div style={{ fontSize: 11, color: '#64748b' }}>live assets</div></div>
        <div style={card}><div style={{ fontSize: 22 }}>{a.mergeCount}</div><div style={{ fontSize: 11, color: '#64748b' }}>duplicates merged</div></div>
        <div style={card}><div style={{ fontSize: 22 }}>{a.flagCount}</div><div style={{ fontSize: 11, color: '#64748b' }}>governance flags</div></div>
      </div>
      <Bars title="Capability by type (growing)" data={a.assetsByType} />
      <Bars title="Capability by team" data={a.assetsByTeam} />
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Gaps (missing)</div>
      {a.gaps.length === 0 && <p style={{ fontSize: 12, color: '#94a3b8' }}>No coverage gaps detected.</p>}
      {a.gaps.map(g => <p key={g} style={{ fontSize: 12, color: '#f59e0b', marginBottom: 4 }}>⚠ {g}</p>)}
    </div>
  );
}
```

- [ ] **Step C6.3: Verify** — Task tab returns recommendations and trace lights the path; Analytics shows counts matching seed and the Digital-workflows gap. **← SYNC S4.**

- [ ] **Step C6.4: Commit** — `git add -A; git pull --rebase; git commit -m "feat: task recommendations and analytics panels"; git push`

## Task C7: Library tab + versioned edit mode (build only if on schedule — first cut after Analytics)

**Files:** Create: `src/components/LibraryPanel.tsx`; Modify: `src/app/page.tsx` (add tab), `src/components/NodeDrawer.tsx` (add edit mode)
**Interfaces:** Consumes `POST /api/edit` (B6), `graph` + `setSelectedNodeId` from C1.

- [ ] **Step C7.1: Write `src/components/LibraryPanel.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { ASSET_TYPES, type KGNode, type KGEdge, type NodeType } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
  workflow: 'Workflows', prompt: 'Prompts', lesson: 'Lessons',
  agent_config: 'Agent configs', decision: 'Decisions', standard: 'Standards',
};

export default function LibraryPanel({ graph, onSelect }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<NodeType>('workflow');
  const assets = graph.nodes
    .filter(n => n.type === filter && n.status !== 'superseded')
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {ASSET_TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: '4px 10px', borderRadius: 999, fontSize: 12, border: '1px solid #334155',
            background: filter === t ? '#4f46e5' : 'transparent',
            color: filter === t ? 'white' : '#94a3b8',
          }}>{TYPE_LABELS[t] ?? t}</button>
        ))}
      </div>
      {assets.length === 0 && <p style={{ fontSize: 13, color: '#64748b' }}>Nothing of this type yet.</p>}
      {assets.map(n => (
        <button key={n.id} onClick={() => onSelect(n.id)} style={{
          display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: 10,
          background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0',
        }}>
          <div style={{ fontSize: 13 }}><b>{n.label}</b>
            <span style={{ marginLeft: 8, fontSize: 11, color: n.status === 'approved' ? '#22c55e' : n.status === 'flagged' ? '#ef4444' : '#eab308' }}>● {n.status}</span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{n.content.slice(0, 100)}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>by {n.author ?? 'unknown'}</div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step C7.2: Modify `src/app/page.tsx`** — three small edits:
  1. Add import: `import LibraryPanel from '@/components/LibraryPanel';`
  2. Change the tabs line to: `const TABS = ['Capture', 'Council Log', 'Start a task', 'Library', 'Analytics'] as const;`
  3. Add to the tab render block: `{tab === 'Library' && <LibraryPanel graph={graph} onSelect={setSelectedNodeId} />}`

- [ ] **Step C7.3: Replace `src/components/NodeDrawer.tsx`** with this version (same as C3 plus an edit mode — editing calls `/api/edit`, then jumps the drawer to the new version):

```tsx
'use client';
import { useEffect, useState } from 'react';
import { ASSET_TYPES, type KGNode, type KGEdge } from '@/lib/types';

const EDGE_LABELS: Record<string, string> = {
  derived_from: 'Derived from', authored_by: 'Authored by', used_in: 'Used in',
  supports: 'Supports', contradicts: 'Contradicts', superseded_by: 'Superseded by',
  reviewed_by: 'Reviewed', governs: 'Cites standard',
};

export default function NodeDrawer({ graph, nodeId, onClose, onJump }: {
  graph: { nodes: KGNode[]; edges: KGEdge[] };
  nodeId: string;
  onClose: () => void;
  onJump: (id: string) => void;
}) {
  const node = graph.nodes.find(n => n.id === nodeId);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [editor, setEditor] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEditing(false);
    setContent(node?.content ?? '');
    setContext(node?.context ?? '');
  }, [nodeId, node?.content, node?.context]);

  if (!node) return null;
  const editable = ASSET_TYPES.includes(node.type) && node.status !== 'superseded';
  const related = graph.edges
    .filter(e => e.from_node === nodeId || e.to_node === nodeId)
    .map(e => {
      const otherId = e.from_node === nodeId ? e.to_node : e.from_node;
      const other = graph.nodes.find(n => n.id === otherId);
      const dir = e.from_node === nodeId ? '→' : '←';
      return other ? { edge: e, other, dir } : null;
    })
    .filter(Boolean) as { edge: KGEdge; other: KGNode; dir: string }[];

  async function save() {
    if (!content.trim() || !editor.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/edit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, content, context, editor }),
      });
      const json = await res.json();
      if (json.ok && json.createdNodeIds?.[0]) {
        setEditing(false);
        onJump(json.createdNodeIds[0]);
      }
    } finally { setBusy(false); }
  }

  const inputStyle = {
    width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
    color: '#e2e8f0', padding: 8, fontSize: 13, marginBottom: 8,
  };

  return (
    <aside style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 360, zIndex: 20,
      background: '#0f172a', borderLeft: '1px solid #1e293b', padding: 16, overflowY: 'auto',
    }}>
      <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', color: '#64748b', fontSize: 18 }}>✕</button>
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b' }}>{node.type} · {node.status}</div>
      <h2 style={{ fontSize: 16, margin: '6px 0 12px' }}>{node.label}</h2>

      {editing ? (
        <div>
          <div style={{ fontSize: 11, color: '#64748b' }}>CONTENT</div>
          <textarea style={{ ...inputStyle, height: 120 }} value={content} onChange={e => setContent(e.target.value)} />
          <div style={{ fontSize: 11, color: '#64748b' }}>WHY (CONTEXT)</div>
          <textarea style={{ ...inputStyle, height: 70 }} value={context} onChange={e => setContext(e.target.value)} />
          <input style={inputStyle} placeholder="Your name" value={editor} onChange={e => setEditor(e.target.value)} />
          <button onClick={save} disabled={busy} style={{
            width: '100%', padding: 10, background: busy ? '#334155' : '#4f46e5', color: 'white',
            border: 'none', borderRadius: 6, fontSize: 13, marginBottom: 6,
          }}>{busy ? 'Saving — Auditor reviewing…' : 'Save as new version'}</button>
          <button onClick={() => setEditing(false)} style={{ width: '100%', padding: 8, background: 'none', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', fontSize: 12 }}>Cancel</button>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>Saving creates a new version. The old one stays viewable, and the Auditor reviews your change against firm standards.</p>
        </div>
      ) : (
        <>
          {node.content && (<>
            <div style={{ fontSize: 11, color: '#64748b' }}>CONTENT</div>
            <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: '4px 0 12px', color: '#cbd5e1' }}>{node.content}</p>
          </>)}
          {node.context && (<>
            <div style={{ fontSize: 11, color: '#64748b' }}>WHY (CONTEXT)</div>
            <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: '4px 0 12px', color: '#a5b4fc' }}>{node.context}</p>
          </>)}
          {node.author && <p style={{ fontSize: 12, color: '#64748b' }}>By {node.author}{node.source ? ` · from ${node.source.name}` : ''}</p>}
          {editable && (
            <button onClick={() => setEditing(true)} style={{
              marginTop: 8, padding: '6px 14px', background: 'none', border: '1px solid #4f46e5',
              borderRadius: 6, color: '#818cf8', fontSize: 12,
            }}>✏️ Edit (creates new version)</button>
          )}
        </>
      )}

      <div style={{ fontSize: 11, color: '#64748b', marginTop: 12 }}>PROVENANCE & CONNECTIONS</div>
      {related.map(({ edge, other, dir }) => (
        <button key={edge.id} onClick={() => onJump(other.id)} style={{
          display: 'block', width: '100%', textAlign: 'left', margin: '6px 0', padding: 8,
          background: '#1e293b', border: 'none', borderRadius: 6, color: '#e2e8f0', fontSize: 12,
        }}>
          <span style={{ color: '#f472b6' }}>{EDGE_LABELS[edge.type] ?? edge.type} {dir}</span> {other.label}
        </button>
      ))}
    </aside>
  );
}
```

- [ ] **Step C7.4: Verify** — Library tab lists workflows with status dots; filter chips switch types; clicking opens the drawer. Edit `wf-content-qa` to remove the senior-review step → save → drawer jumps to the new version, which flips to red (flagged) within seconds, old version shows gray in Library only when its filter includes it (it won't — superseded is hidden; confirm via the graph, where the gray node and `superseded_by` edge are visible). `npm run seed` to restore.

- [ ] **Step C7.5: Commit** — `git add -A; git pull --rebase; git commit -m "feat: library tab and versioned edit mode"; git push`

---

## FINAL PHASE (ALL): Integration, snapshot, rehearsals (T+6:30 →)

- [ ] **F1:** `npm run seed` → `npm run smoke` → expect `SMOKE PASS` → `npm run seed` again.
- [ ] **F2:** `npm run snapshot` → commit `public/fallback-snapshot.json`. Test fallback: set `NEXT_PUBLIC_USE_FALLBACK=1` in `.env.local`, restart dev server, graph renders from the file; then remove the flag.
- [ ] **F3: Full demo rehearsal ×2, timed at 5:00**, following spec §7 beat by beat: seeded graph → paste conversation fixture (Sarah Chen) → council log walkthrough → upload memo fixture (An Tran) → **Run Council → wf-fasttrack flips red citing the memo** → Start a task ("market-entry study for a retail client") → Analytics → close. Between rehearsals: `npm run seed`. If any beat is flaky, tune the relevant prompt in `prompts.ts` only.
- [ ] **F4:** Final commit + push. Prepare the two fixture files open in Notepad tabs for fast paste during the pitch.

## Plan self-review notes (done at authoring time)

- **Spec coverage:** §1 concept→B1-B4; §2 architecture→0/A1/F2; §3 model→0.5 (uuid→text deviation noted); §4 agents→B2-B4 (Run Council = auditor-only sweep, deviation noted with rationale); §5 UI→C1-C7 (Library tab + versioned edit → B6/C7); §6 seed→A2 (26 nodes vs "~50" — every category and both demo hooks present; flesh out only if time allows); §7 script→F3; §8 order/cuts→timeline table; §9 smoke→A4/F1; §10 exclusions respected.
- **Type consistency:** all cross-track names verified — `runIngestPipeline`, `runCouncilReview`, `runCurator`, `runAuditor`, `llmJson`, `logAction`, `getGraph`, `insertNodes`, `insertEdges`, `setNodeStatus`, `newId`, route paths and payload shapes match `types.ts`.
- **Known risk:** `curator: merge`/`auditor: flagged` label prefixes are load-bearing for A3's analytics counts — they come from `logAction(agent, action, …)` producing `` `${agent}: ${action}` ``; B3 passes `act.action` (`'merge'`/`'link'`) and B4 passes `'flagged'`/`'approved'`, so prefixes hold.
