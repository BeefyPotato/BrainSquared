# MANUAL_STEPS.md — The Human Checklist

This is the stuff **you** have to do with your own hands — accounts, keys, and clicking buttons in dashboards. AI agents can't do these for you. It also tells you exactly what prompt to give your AI agent afterwards, and the git rules that stop us from wrecking each other's work.

Written simply on purpose. Follow it top to bottom.

---

## Part 1 — Setup EVERYONE does (15 min, do this first)

### 1.1 Install the basics

- [ ] Install **Node.js 20 or newer** → https://nodejs.org (check with `node -v`)
- [ ] Install **Git** → https://git-scm.com (check with `git -v`)
- [ ] Have an AI coding agent ready (Claude Code, Cursor, etc.)

### 1.2 Clone the repo

```
git clone https://github.com/Luigi-Simon/BrainSquared.git
cd BrainSquared
```

- [ ] Make sure you can `git push` (you may need to be added as a collaborator on the GitHub repo — ask the repo owner to add you under Settings → Collaborators).

### 1.3 Read these two things (10 min, seriously)

- [ ] `AGENTS.md` — what we're building and how the pieces fit.
- [ ] Your track's section in `docs/superpowers/plans/2026-07-11-brainsquared-mvp.md` — it has the **complete code** for every file you own. You're mostly checking the AI's work against it.

---

## Part 2 — Accounts & keys (humans only — agents must NEVER do this)

Only **ONE person** (suggest: Engineer A) creates the accounts. Then they share the keys with the team **privately** (group DM, not in git, not in the public repo).

### 2.1 Supabase (our database) — Engineer A does this

- [ ] Go to https://supabase.com → sign up (GitHub login is fastest) — free tier is fine.
- [ ] Click **New project**. Name: `brainsquared`. Region: **Singapore** (closest to Saigon). Set a database password (save it somewhere, though we won't need it much).
- [ ] Wait ~2 min for the project to spin up.
- [ ] Go to **SQL Editor** (left sidebar) → paste the whole contents of `supabase/schema.sql` from the plan (Step 0.3) → click **Run**. You should see "Success".
- [ ] Go to **Project Settings → API** and copy two values:
  - **Project URL** (looks like `https://abcdefgh.supabase.co`)
  - **anon public key** (long string starting `eyJ...`)

### 2.2 OpenAI (the agents' brain) — whoever has the key

- [ ] Go to https://platform.openai.com → API keys → **Create new secret key**. Copy it (starts `sk-...`).
- [ ] Make sure the account has some credit (Settings → Billing). A few dollars is plenty for one night.

### 2.3 Every engineer: create your `.env.local`

In the repo root, each person creates a file called `.env.local` (exactly that name) with the four lines below, using the shared values:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1
```

Rules:
- [ ] **NEVER commit this file.** It's already in `.gitignore` — leave it there.
- [ ] **NEVER paste the keys into an AI agent chat, an issue, or the README.**
- [ ] If a key leaks, tell the team, delete it in the dashboard, make a new one.

---

## Part 3 — Phase 0: one-time project setup (do TOGETHER, ~30 min)

Do this **on one laptop** (suggest: Engineer A's), with everyone watching. It follows plan Task 0.

- [ ] Run the create-next-app scaffold steps from plan **Step 0.1** (it scaffolds in a temp folder and copies files in — the repo already has our skeleton, so follow it exactly, don't freestyle).
- [ ] Add the `seed` / `smoke` / `snapshot` lines to `package.json` scripts (plan Step 0.2).
- [ ] Create `src/lib/types.ts` by copying the code from plan Step 0.5 (or let the AI do it — see prompt below).
- [ ] Check it works: `npm run dev` → open http://localhost:3000 → page loads.
- [ ] Commit and push: `git add -A`, `git commit -m "chore: scaffold"`, `git push`.
- [ ] Everyone else: `git pull`, create your own `.env.local` (Part 2.3), run `npm i`, run `npm run dev`, confirm it loads. ✅ Phase 0 done — split up.

**Prompt you can give the AI for Phase 0** (after the human did Step 0.1 manually):

> Read AGENTS.md and docs/superpowers/plans/2026-07-11-brainsquared-mvp.md. Do Task 0 steps 0.2 and 0.5 exactly as written: add the seed/smoke/snapshot npm scripts and create src/lib/types.ts with the exact code from the plan. Don't do any other tasks. Verify with `npx tsc --noEmit`, then commit.

---

## Part 4 — Your track: manual steps + the prompt to give your AI

Each engineer owns ONE track. Don't touch files outside your track (the plan's task headers say who owns what). Work through your tasks IN ORDER — later tasks need earlier ones.

### Engineer A — Backend / Data (Tasks A1 → A2 → A3 → A4)

Your manual jobs:
- [ ] You made the Supabase project (Part 2.1). You're also the one who checks the **Supabase Table Editor** when we need to eyeball data (dashboard → Table Editor → nodes/edges).
- [ ] After Task A2, announce in the group chat: **"S1 — graph has data"** so Engineer C can render it.
- [ ] Near the end of the night, you run: `npm run seed` → `npm run smoke` → `npm run snapshot`, and commit the snapshot (final phase F1/F2).

Prompt for your AI (run tasks one at a time, in order):

> Read AGENTS.md, then open docs/superpowers/plans/2026-07-11-brainsquared-mvp.md and implement Task A1 exactly as written, including the verification step. I am Engineer A — only touch Track A files. When verification passes, commit with the message from the plan and stop so I can review.

Then repeat with "Task A2", "Task A3", "Task A4". Between tasks: skim the diff, run the verify command yourself once, push.

### Engineer B — AI / Agents (Tasks B1 → B2 → B3 → B4 → B5)

Your manual jobs:
- [ ] Confirm the OpenAI key works before starting: after Task B2, the curl test in plan Step B2.4 must return `"ok":true`. If you get an auth error, the key or billing is the problem — fix that in the dashboard (human job).
- [ ] After Task B2, announce: **"S2 — /api/ingest is live"**.
- [ ] After Task B4, personally run the **memo moment** check (plan Step B4.3) and announce: **"S3 — memo moment works"**. This is the demo's showpiece — a human must see it work tonight, not just trust the AI's word.
- [ ] If an agent behaves weirdly during rehearsal (bad merges, wrong flags), the fix is editing the prompt text in `src/lib/agents/prompts.ts` — small wording changes, test again. Don't let the AI restructure code to fix a prompt problem.

Prompt for your AI:

> Read AGENTS.md, then open docs/superpowers/plans/2026-07-11-brainsquared-mvp.md and implement Task B1 exactly as written. I am Engineer B — only touch Track B files. Use the exact prompts from the plan's prompts.ts code block. When `npx tsc --noEmit` passes, commit with the plan's message and stop so I can review.

Then repeat for B2, B3, B4, B5, and B6 (the edit feature — only if the night is on schedule). For B2–B4 and B6, run the curl verification yourself with `npm run dev` running, and reseed after (`npm run seed`).

### Engineer C — Frontend (Tasks C1 → C2 → C3 → C4 → C5 → C6)

Your manual jobs:
- [ ] You're the eyes: after every task, look at http://localhost:3000 yourself. Does the graph render? Do colors match (yellow pending, green approved, red flagged, gray superseded)? Does clicking feel okay on a projector?
- [ ] C2 needs seed data — wait for Engineer A's **"S1"** message (build C1 meanwhile).
- [ ] C4 needs the ingest API — wait for Engineer B's **"S2"** message (build C2/C3 meanwhile).
- [ ] After C6, announce: **"S4 — all tabs live"**.

Prompt for your AI:

> Read AGENTS.md, then open docs/superpowers/plans/2026-07-11-brainsquared-mvp.md and implement Task C1 exactly as written, including the placeholder components. I am Engineer C — only touch Track C files. Verify the app compiles and the tabs switch, commit with the plan's message, and stop so I can review.

Then repeat for C2 → C7 in order (C7 is the Library/edit tab — only if the night is on schedule; it needs Engineer B's Task B6 first).

---

## Part 5 — Git workflow (the rules that keep 3 people from colliding)

We all work on **one branch: `master`**. No feature branches tonight — they're overkill for 8 hours and 3 people who own separate files. The safety comes from file ownership.

**The golden loop — every time you finish a task:**

```
git add -A
git pull --rebase        ← get teammates' work FIRST
git commit -m "feat: <what you did>"
git push
```

The five rules:

1. **Only edit files your track owns.** The plan's task headers and the placeholder comments in each file say whose it is. If you think you need to change someone else's file — you don't, you need to ask them.
2. **Pull before you commit, push right after.** Small commits, often (at least one per task). The longer you sit on work, the scarier the merge.
3. **If `git pull --rebase` shows a conflict:** don't panic, don't force-push, don't let the AI "fix" it blind. Shout in the group chat — 99% of the time it means two people edited the same file, which means rule 1 was broken. Resolve it together (usually: keep both changes or take the file owner's version), then `git rebase --continue`.
4. **Never commit `.env.local`** or any file with a key in it. If you're not sure, run `git diff --staged` and read what you're about to commit.
5. **Broken code doesn't get pushed.** Before pushing, your task's verify step must pass (`npx tsc --noEmit` at minimum). A teammate pulling your broken code loses 20 minutes we don't have.

---

## Part 6 — How the night flows (the plan, simply)

1. **Everyone together (30 min):** Part 2 keys + Part 3 setup. Don't split before this works on all three laptops.
2. **Split into tracks.** Work your tasks in order. One task at a time: AI implements → you verify → commit → push → next task.
3. **Watch for the four announcements:** S1 (data), S2 (ingest live), S3 (memo moment works), S4 (all tabs live). They're the handoff points — if you're blocked waiting for one, help the person producing it instead of starting something new.
4. **Running late?** Cut in this order (already decided, don't debate at 3 AM): Analytics tab → Library/edit feature (B6+C7). **Never cut** the agents pipeline, the memo moment, or Start a task — they're the pitch.
5. **Last 90 minutes — all together again:** `npm run seed` → `npm run smoke` (must print SMOKE PASS) → `npm run snapshot` → commit. Then run the full 5-minute demo **twice**, timed, following the script in the spec (§7). Reseed between runs. Fix only what breaks the demo; resist polishing.
6. **Before you sleep:** push everything, and have `data/fixtures/claude-conversation.txt` and `data/fixtures/leadership-memo.txt` open in Notepad tabs on the demo laptop, ready to paste on stage.

**Demo-day morning:** `git pull` on the demo laptop, `npm run seed`, `npm run dev`, one final run-through before 9:00 AM submission. If the venue wifi dies: set `NEXT_PUBLIC_USE_FALLBACK=1` in `.env.local`, restart the dev server — the graph renders from the saved snapshot and you narrate the capture beats over the pre-recorded/backup material.

Good luck. Ship the memo moment. 🚢
