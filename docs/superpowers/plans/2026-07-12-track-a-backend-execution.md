# Track A (Backend/Infra/Data) Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all of Engineer A's deliverables for BrainSquared — data access layer, seed data + demo fixtures, analytics API, smoke script, and the fallback snapshot — exactly as specified in the master plan, so Tracks B (agents) and C (frontend) can build against frozen contracts.

**Architecture:** `src/lib/supabase.ts` is the ONLY module that talks to the database; every other file (agents, API routes, scripts, UI) reads/writes the graph through its six exports. Seed data lives in `data/seed.json` with two planted demo hooks that the pitch depends on. Analytics is computed on-the-fly from the graph (no separate store). The smoke script is the entire test suite.

**Tech Stack:** Next.js 15+ (App Router, TypeScript), `@supabase/supabase-js`, `tsx` + `dotenv` for scripts. No test framework — the smoke script is the deliberate test strategy (spec §9), so this plan uses verify-steps with exact expected output instead of TDD.

**Source of truth:** All code below is copied **verbatim** from `docs/superpowers/plans/2026-07-11-brainsquared-mvp.md` (Tasks A1–A4, F1–F2). Do not deviate from it. This plan adapts only: (1) shell commands to macOS/zsh (the master plan used PowerShell), (2) adds a preflight step because `node_modules` is not yet installed on this machine.

## Global Constraints

- Env vars live in `.env.local` (already present, never committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4.1`).
- Node statuses/colors, verbatim everywhere: `pending` #eab308 · `approved` #22c55e · `flagged` #ef4444 · `superseded` #64748b.
- All shared types come from `src/lib/types.ts` (already committed, frozen). Never redefine `KGNode`/`KGEdge`/payload shapes locally.
- IDs are human-readable text (`wf-fasttrack`), not uuid — deliberate, for stable demo fixtures.
- File ownership: Track A owns ONLY `src/lib/supabase.ts`, `data/**`, `scripts/**`, `src/app/api/analytics/route.ts`, `public/fallback-snapshot.json`. Never edit Track B files (`src/lib/agents/**`, other API routes) or Track C files (`src/components/**`, `src/app/page.tsx`).
- Git: trunk-based on `master`; `git pull --rebase` before EVERY commit; commit after every task minimum.
- The two planted demo hooks in seed data must never be altered casually: `pr-client-research` (Curator live-merge beat) and `wf-fasttrack` (Auditor memo-reversal beat — the showpiece). If seed content changes, both hooks must be re-verified end-to-end and the snapshot re-generated.
- Analytics counts agent actions by label prefix: `curator: merge` and `auditor: flagged`. These prefixes come from Track B's `logAction(agent, action, …)` producing `` `${agent}: ${action}` `` labels. **Load-bearing — do not change the prefix strings in the analytics route.**

## Cross-track contracts this plan produces (frozen once shipped)

Tracks B and C code against these exact names. Changing any of them after Task 1 breaks two other engineers:

```ts
// from src/lib/supabase.ts (Task 1)
export const supabase: SupabaseClient
export function newId(prefix: string): string
export async function getGraph(): Promise<{ nodes: KGNode[]; edges: KGEdge[] }>
export async function insertNodes(nodes: KGNode[]): Promise<void>
export async function insertEdges(edges: KGEdge[]): Promise<void>
export async function setNodeStatus(id: string, status: NodeStatus): Promise<void>
```

- `GET /api/analytics` → `AnalyticsSummary` (Task 3; Track C's AnalyticsPanel renders it).
- Seeded graph = 27 nodes / 24 edges from `data/seed.json` (Task 2; Track C renders it at sync point S1).
- `scripts/smoke.ts` imports `runIngestPipeline` from `src/lib/agents/pipeline` — Track B's exact export name (Task 4; runnable only after their Task B2/B4 land).

---

### Task 1: Preflight + Supabase data access layer (master plan Task A1)

**Files:**
- Create: `src/lib/supabase.ts` (replace one-line placeholder)
- Create then delete: `scripts/ping.ts` (throwaway connectivity check)

**Interfaces:**
- Consumes: `src/lib/types.ts` (`KGNode`, `KGEdge`, `NodeStatus`) — already committed, frozen.
- Produces: the six exports listed in "Cross-track contracts" above. Track B's runner/agents and Track C's `page.tsx` import them by these exact names.

- [ ] **Step 1: Install dependencies**

```bash
npm install
```

Expected: completes without errors; `node_modules/` appears. (All deps are already declared in `package.json` — `@supabase/supabase-js`, `openai`, `react-force-graph-2d`, `dotenv`, `tsx`.)

- [ ] **Step 2: Verify `.env.local` has all four keys**

```bash
grep -c -E '^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|OPENAI_API_KEY|OPENAI_MODEL)=' .env.local
```

Expected: `4`. If fewer, fill in the missing values (Supabase dashboard → Settings → API) before continuing — nothing below works without them.

- [ ] **Step 3: Write `src/lib/supabase.ts`** (replaces the placeholder; code verbatim from master plan Step A1.1)

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

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exits 0. (Placeholder files in other tracks are comment-only, so they compile.)

- [ ] **Step 5: Verify connectivity with a throwaway ping script.** Create `scripts/ping.ts`:

```ts
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });
import('../src/lib/supabase').then(async ({ getGraph }) => {
  const g = await getGraph();
  console.log(`OK: ${g.nodes.length} nodes, ${g.edges.length} edges`);
});
```

Run:

```bash
npx tsx scripts/ping.ts
```

Expected: `OK: 0 nodes, 0 edges` (or non-zero counts if the DB already has rows — either proves connectivity; an error means env vars or the Supabase schema are wrong, fix before continuing).

- [ ] **Step 6: Delete the ping script**

```bash
rm scripts/ping.ts
```

- [ ] **Step 7: Commit**

```bash
git add -A && git pull --rebase && git commit -m "feat: supabase data access layer" && git push
```

---

### Task 2: Seed data, demo fixtures, seed & snapshot scripts (master plan Task A2)

**Files:**
- Create: `data/seed.json` (replace placeholder)
- Create: `data/fixtures/claude-conversation.txt` (replace placeholder)
- Create: `data/fixtures/leadership-memo.txt` (replace placeholder)
- Create: `scripts/seed.ts` (replace placeholder)
- Create: `scripts/snapshot.ts` (replace placeholder)

**Interfaces:**
- Consumes: `supabase` client and `getGraph` from Task 1.
- Produces: the seeded graph (27 nodes, 24 edges) that Track C renders at sync point S1; the two demo fixtures used in demo beats 2 and 4; `npm run seed` (demo reset command) and `npm run snapshot` (fallback generator). Planted hooks: `pr-client-research` (the conversation fixture contains a near-duplicate → Curator merge beat) and `wf-fasttrack` (approved now; the memo fixture contradicts it → Auditor reversal beat, the showpiece).

- [ ] **Step 1: Write `data/seed.json`** (verbatim from master plan Step A2.1 — fictional firm Meridian Advisory, teams Strategy/Diligence/Digital):

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

- [ ] **Step 2: Write `data/fixtures/claude-conversation.txt`** (demo beat 2 — contains one near-dup of `pr-client-research`, one workflow, one lesson; the demo uploader is Sarah Chen). Exact content:

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

- [ ] **Step 3: Write `data/fixtures/leadership-memo.txt`** (demo beat 4 — contradicts `wf-fasttrack`; the demo uploader is An Tran). Exact content:

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

- [ ] **Step 4: Write `scripts/seed.ts`** (wipes both tables, loads seed — the demo reset command):

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

(If the `import seed from '../data/seed.json'` line errors, add `"resolveJsonModule": true` to `tsconfig.json` compilerOptions — it is usually already set by create-next-app. Keep the env-config-before-dynamic-import order: scripts must load `.env.local` BEFORE importing `src/lib/supabase`.)

- [ ] **Step 5: Write `scripts/snapshot.ts`** (dumps live graph → the venue-wifi disaster plan):

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

- [ ] **Step 6: Run seed and verify**

```bash
npm run seed
```

Expected output exactly: `Seeded 27 nodes, 24 edges`

- [ ] **Step 7: Verify idempotency** (the demo depends on reseeding between rehearsals)

```bash
npm run seed
```

Expected: same output again, no duplicate-key errors.

- [ ] **Step 8: Run snapshot and verify**

```bash
npm run snapshot
```

Expected output: `Snapshot: 27 nodes, 24 edges` and `public/fallback-snapshot.json` now exists.

- [ ] **Step 9: Commit — this is SYNC POINT S1**

```bash
git add -A && git pull --rebase && git commit -m "feat: seed data, demo fixtures, seed/snapshot scripts" && git push
```

Then **tell Engineer C the graph has data** (they verify GraphView against it).

---

### Task 3: Analytics API (master plan Task A3)

**Files:**
- Create: `src/app/api/analytics/route.ts` (replace placeholder)

**Interfaces:**
- Consumes: `getGraph` from Task 1; `ASSET_TYPES`, `AnalyticsSummary` from `src/lib/types.ts`.
- Produces: `GET /api/analytics` → `AnalyticsSummary` (`{ assetsByType, assetsByTeam, mergeCount, flagCount, gaps }`). Track C's AnalyticsPanel fetches it. Merge/flag counts are parsed from Track B's `agent_action` labels by prefix — `curator: merge` and `auditor: flagged` — these strings must match Track B's `logAction` output exactly.

- [ ] **Step 1: Write `src/app/api/analytics/route.ts`**

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

- [ ] **Step 2: Start the dev server** (leave it running in a separate terminal, or background it)

```bash
npm run dev
```

Expected: Next.js dev server on http://localhost:3000.

- [ ] **Step 3: Verify the endpoint against seeded data**

```bash
curl -s http://localhost:3000/api/analytics
```

Expected: JSON where `assetsByType` matches the seed — `{"prompt":4,"workflow":3,"agent_config":1,"lesson":4,"standard":3,"decision":3}` — `mergeCount` and `flagCount` are `0` (no agent actions yet), and `gaps` includes `"Digital team has no workflows in the memory"`.

- [ ] **Step 4: Commit**

```bash
git add -A && git pull --rebase && git commit -m "feat: analytics API" && git push
```

---

### Task 4: Smoke script (master plan Task A4)

**Files:**
- Create: `scripts/smoke.ts` (replace placeholder)

**Interfaces:**
- Consumes: `getGraph` from Task 1; `runIngestPipeline` from `src/lib/agents/pipeline` — **Track B's export, exact name, defined in their Task B2.** Until B2 lands, this script typechecks against the placeholder module but cannot run.
- Produces: `npm run smoke` → `SMOKE PASS` — the whole project's Definition-of-Done item 1.

- [ ] **Step 1: Write `scripts/smoke.ts`**

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

- [ ] **Step 2: Typecheck** (full run is blocked until Track B ships `runIngestPipeline` in Task B2)

```bash
npx tsc --noEmit
```

Expected: exits 0 — but ONLY after B2 has replaced the pipeline placeholder. If B2 hasn't landed, `runIngestPipeline` doesn't exist yet and tsc fails on this import; in that case skip to Step 3 and note the pending verification. Coordinate with Engineer B.

- [ ] **Step 3: Commit**

```bash
git add -A && git pull --rebase && git commit -m "feat: smoke script" && git push
```

- [ ] **Step 4 (deferred — run the moment Track B announces sync point S3):** full smoke cycle

```bash
npm run seed && npm run smoke
```

Expected: ends with `SMOKE PASS` (typical: `assets created: 3, agent actions logged: 4+`). Then restore clean demo state:

```bash
npm run seed
```

---

### Task 5: Final-phase backend duties (master plan F1/F2 — after all tracks integrate, T+6:30)

**Files:**
- Modify: `public/fallback-snapshot.json` (regenerate and commit)
- Modify: `.env.local` (temporarily, for fallback test — not committed)

**Interfaces:**
- Consumes: everything — this is the whole-system verification Track A owns.
- Produces: Definition-of-Done items 1 (`SMOKE PASS`) and 3 (committed snapshot + fallback mode renders).

- [ ] **Step 1: Full smoke cycle on the integrated system**

```bash
npm run seed && npm run smoke && npm run seed
```

Expected: `SMOKE PASS` in the middle, clean reseed after.

- [ ] **Step 2: Regenerate and commit the fallback snapshot** (must be from the clean seeded state)

```bash
npm run snapshot
git add public/fallback-snapshot.json && git pull --rebase && git commit -m "chore: fallback snapshot of seeded demo state" && git push
```

- [ ] **Step 3: Test fallback mode.** Add `NEXT_PUBLIC_USE_FALLBACK=1` to `.env.local`, restart the dev server, open http://localhost:3000.

Expected: the graph renders from `public/fallback-snapshot.json` (27 nodes) with no Supabase traffic. Ingest won't work in this mode — that's accepted.

- [ ] **Step 4: Remove the flag.** Delete the `NEXT_PUBLIC_USE_FALLBACK=1` line from `.env.local`, restart the dev server, confirm the live graph loads again.

- [ ] **Step 5: Support the two timed rehearsals.** Run `npm run seed` between every rehearsal run. If any demo beat is flaky, prompt tuning happens in `src/lib/agents/prompts.ts` — that's Track B's file; flag it to Engineer B, don't edit it.

---

## Coordination map (what the other tracks are waiting on from you)

| When | Who is blocked | On what |
|---|---|---|
| Task 1 done | Engineer B (all of B1–B6) and Engineer C (`page.tsx` Realtime + `getGraph`) | `src/lib/supabase.ts` exports |
| Task 2 done (S1) | Engineer C's GraphView verification | seeded graph in Supabase |
| Task 3 done | Engineer C's AnalyticsPanel | `GET /api/analytics` |
| Track B's S3 | You | run Task 4 Step 4 (smoke) |
| Everyone integrated | You | Task 5 (F1/F2) |

## Plan self-review notes

- **Spec coverage (Track A scope):** spec §2 storage/resilience → Tasks 1, 2, 5; §6 seed dataset with both planted hooks → Task 2; §5 analytics inputs → Task 3; §9 testing strategy → Task 4. Master-plan Tasks A1–A4 and F1/F2 all mapped 1:1; nothing in Track A's lane is uncovered.
- **Type consistency:** all names cross-checked against the committed `src/lib/types.ts` and the master plan's contracts — `getGraph`/`insertNodes`/`insertEdges`/`setNodeStatus`/`newId`, `AnalyticsSummary` field names, `runIngestPipeline` signature (`IngestInput` → `PipelineResult`), and the `curator: merge`/`auditor: flagged` label prefixes.
- **Deviations from the master plan:** none in code. Commands adapted from PowerShell to zsh; preflight `npm install` added (this machine has no `node_modules`); analytics verification expectation spelled out with the exact seed-derived counts.
