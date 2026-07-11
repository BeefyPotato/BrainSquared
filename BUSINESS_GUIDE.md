# BUSINESS_GUIDE.md — The Business Team's Handbook

Everything the business side needs, in plain English, no tech talk. The whole guide is built around one idea: **we are answering the judges' problem statement line by line, and every feature in our product exists to solve a specific sentence of it.** If you internalize the mapping in sections 2–3, you can answer any judge question.

---

## 1. What is our product? (say it in one breath)

**BrainSquared is a company's memory for everything it learns about using AI — a memory that fills itself, cleans itself, and follows the company's rules.**

Longer spoken version:

> "Every company is learning how to use AI right now — the perfect instructions, the routines that work, the mistakes to avoid. But that learning lives in employees' heads, and when they leave, it leaves with them. BrainSquared captures that know-how automatically as people work, organizes it into a living map everyone can see, and a team of AI librarians keeps the map clean, current, and compliant with company rules. Individual learning becomes permanent company capability."

**The name:** Brain² — a smart memory (the company's brain) looked after by another brain (the AI librarians).

---

## 2. The problem statement, decoded — and the feature that answers each pain

The judges wrote a problem statement (Founders Track, Problem 5). Here is every pain they named, in plain words, next to the feature we built to kill it. **This table is your pitch's skeleton and your Q&A cheat sheet.**

| Their pain (in plain words) | Our feature that solves it | The proof moment in the demo | The line you say |
|---|---|---|---|
| "AI skill is developed by individuals, not kept by the company" | **Effortless capture**: paste any AI conversation, chat thread, or notes — the Scribe librarian pulls out only the valuable AI know-how | A messy real conversation is pasted; three glowing knowledge dots appear on the map in seconds | "Nobody wrote documentation. This is a byproduct of work they already did." |
| "When people leave, prompt libraries, workflows, agent setups, and experience disappear" | **The living map**: every piece of know-how is stored with its author, its origin, and its story — it stays when the person goes | Click any dot: you see who made it, where it came from, and why it's trusted | "When Sarah leaves, Sarah's know-how stays — with her name on it." |
| "…and the *context* disappears too — why things worked" | **Why-capture**: every saved item stores not just the thing itself, but why it works, when it fails, what was tried before | Open a saved prompt: next to the prompt is its story — "we added this rule because old reports kept inflating the numbers" | "We don't just save the recipe. We save why the recipe works." |
| "Teams keep reinventing the same thing" (repeated reinvention) | **The Curator librarian**: automatically spots duplicates across teams and merges them into one best version — old versions kept | The Curator catches that a new prompt duplicates one from another team last month, and merges them, live | "Two teams solved the same problem twice. Now there's one best version — and nobody had to notice it manually." |
| "Practices are fragmented; no rules hold across teams" (uneven adoption, weak governance) | **The Auditor librarian**: checks every piece of knowledge against company rules — and leadership updates those rules just by writing a normal memo | THE showpiece: the boss uploads a memo; the Auditor re-reviews everything and *reverses one of its own earlier decisions*, pointing at the memo | "Nobody configured anything. Leadership wrote a memo — and the system learned it." |
| "Nobody can see what already works inside the organization" (limited visibility) | **Start a task**: type what you're about to do, and the company's best relevant know-how appears, with a visible trust-trail | An employee types "market study for a retail client" → the firm's best prompt and routine appear, each traceable to its source | "Day one on the job, you inherit everything the firm ever learned about this task." |
| "Knowledge goes stale, and improving it is nobody's job" (implied by 'improved… across teams') | **Library + safe editing**: browse all workflows and prompts in a simple list; edit any of them — the old version is kept, and the Auditor checks the edit against the rules | Someone edits a workflow to skip a required step → seconds later it's flagged red with the rule it broke | "Anyone can improve the memory. Nobody can quietly break the rules." |
| "Capture should happen where the work happens" (their vision of a memory *layer*) | **The MCP capture tool** (our bridge into AI chat tools): while chatting with an AI assistant, the employee just says "save what we learned" — it lands in the company memory without leaving the chat | (Live or 20-sec video) an employee says "save this to org memory" inside their AI chat → dots bloom on the map | "The employee never leaves their AI tool. The knowledge saves itself." |

**Memorize the right-hand column.** Those eight lines, in that order, ARE the pitch.

---

## 3. Their scorecard — the five things they said a winning product should have

The problem statement lists a five-point "product vision." Judges will consciously or unconsciously score against it. Here's our answer to each — say these back to them in their own words:

1. **"A searchable memory layer for prompts, workflows, agents, and reusable AI patterns"** → That's the living map plus the Library tab (browse by type) plus Start-a-task (search by intent). ✅
2. **"Context capture for WHY a workflow or decision worked, not just the final artifact"** → Every single item in our memory has a mandatory "why" attached. Not optional — structural. ✅
3. **"Governance and versioning for organizational AI assets"** → The Auditor enforces rules automatically; nothing is ever deleted or overwritten — old versions stay viewable forever. And uniquely: leadership governs by writing memos, not by configuring software. ✅
4. **"Recommendations that surface relevant prior work when employees start a new task"** → Literally our "Start a task" feature, named after their sentence. ✅
5. **"Analytics that show where AI capability is growing, duplicated, or missing"** → Our dashboard uses exactly those three words: growing (what's being added, by which team), duplicated (what the Curator merged), missing (which teams lack which kinds of know-how). ✅

If a judge asks "how do you address X from the brief" — the answer always exists in this list. No feature we built is off-brief, and no line of their brief is unanswered. Say that plainly at the end of the pitch: *"You asked for five things. Here are all five, live."*

**One boundary worth stating proudly:** you can throw ANY document at BrainSquared, but it only keeps what makes the organization better at using AI — everything else falls through. We are not another document dump; we are the **AI capability layer**, which is the exact phrase in their build challenge.

---

## 4. The user journey (a story that walks through the features in order)

Meet **Sarah**, a consultant at a mid-sized firm.

1. **Sarah works normally.** She spends an afternoon with an AI chatbot perfecting a research routine — a great set of instructions, a step-by-step process, and a lesson about a mistake the AI kept making.
2. **Capture, zero effort.** She either pastes the chat into BrainSquared, or — if her AI tool is connected — just says "save what we learned." Ten seconds. *(Features: effortless capture + MCP tool.)*
3. **The Scribe** reads the messy conversation and keeps only the three valuable things — each with its "why" and Sarah's name attached. *(Features: AI-only filter + why-capture.)*
4. **The Curator** notices another team saved a nearly identical instruction last month and merges them into one best version. The old one stays viewable. *(Feature: de-duplication + versioning.)*
5. **The Auditor** checks everything against company rules and flags one routine that skips a required review step — in red, pointing at the exact rule. *(Feature: automatic governance.)*
6. **The boss steers without touching software.** She uploads a normal memo — "from now on, everything gets senior review" — and the Auditor starts enforcing it immediately, even re-judging things it approved before. *(Feature: leadership-by-memo — our biggest differentiator.)*
7. **Tom reuses.** Next Monday, Sarah's colleague types what he's about to do and receives the firm's best know-how — including Sarah's — with a visible trail of where it came from. *(Feature: Start a task.)*
8. **Tom improves.** He spots an outdated step in a workflow, opens it in the Library, edits it — a new version is created, the old one preserved, and the Auditor checks his change. *(Feature: Library + safe editing.)*
9. **The partners** open the dashboard: where AI capability is growing, where teams duplicated effort, where the gaps are. *(Feature: analytics.)*

The loop: **work → capture → clean → govern → reuse → improve → repeat.** Every trip around the loop makes the company permanently smarter — that's the "compounding" the challenge statement asks for.

---

## 5. Look and feel (what people see)

- One screen, **dark background** — mission control, not spreadsheet.
- Left side, the star: a **living map of glowing dots and connecting lines**. Dots are pieces of AI know-how; lines show relationships (who made it, what it came from, which rule judged it).
- **Colors tell the story:** yellow = just arrived, being checked · green = approved and trusted · red = breaks a rule · gray = old version, replaced.
- You *watch the librarians work live*: new dots bloom yellow, then flip green or red as they're judged. The product feels alive — that's the emotional hook.
- Right side, five simple tabs: **Capture** (drop knowledge in) · **Council Log** (the librarians' activity feed — every decision explained) · **Start a task** (get the firm's best know-how) · **Library** (browse and edit workflows/prompts) · **Analytics** (the dashboard).
- Click any dot and you get its full story: what it is, **why it works**, who made it, and every decision made about it. **Nothing is a black box** — this transparency is a selling point, not a design detail.

---

## 6. The 5-minute pitch (feature-proof structure)

**The one memory to leave in judges' heads: the AI librarians run the memory — and leadership steers them just by writing memos.**

| Minute | What happens | Which pain it proves solved (section 2) |
|---|---|---|
| 0:00–0:45 | **The problem, in their words.** "When your best person leaves, everything they learned about AI leaves with her. You asked how to turn individual learning into permanent capability — here's the answer, live." | Frames pains 1–2 |
| 0:45–1:45 | **Capture.** Paste a real messy AI conversation → three dots bloom, each with its "why" and author. | Pains 1, 2, 3 |
| 1:45–2:45 | **The librarians.** Curator merges a cross-team duplicate; Auditor flags a rule-breaker with the rule named. | Pains 4, 5 |
| 2:45–3:30 | **THE MOMENT.** Boss's memo goes in → one button → the Auditor reverses its own earlier decision, citing the memo. Slow down. This is the applause line. | Pain 5 (governance) — the differentiator |
| 3:30–4:15 | **The payoff.** Start-a-task recommendation with trust-trail → dashboard (growing/duplicated/missing). If built: the edit demo or the MCP save ("the knowledge saves itself"). | Pains 6, 7, 8 |
| 4:15–5:00 | **Business close.** "You asked for five things — you just saw all five." Then: who pays, why they stay, what's next. | Section 3 checklist |

Pitch mechanics: rehearse twice, timed. One person drives, one talks — never both. If the screen misbehaves, stay calm: there's a backup version of the map and a recorded clip of the MCP capture; narrate over them. Judges said clarity beats ambition — cut anything you can't explain in one sentence.

---

## 7. Who pays, and why they keep paying (business model, tied to the problem)

**Customer:** medium and large companies pushing AI adoption where knowledge *is* the business — consulting, banking, agencies, professional services. We sell to **leadership**, because the pains in section 2 (knowledge walking out, no visibility, no governance) are felt at the top, and our flagship feature (steering by memo) is literally built for them.

**Pricing:** per employee per month (the standard workplace-software model), three tiers — small-team (cheap entry), business (the money-maker: full librarian council, governance, analytics), enterprise (custom: advanced controls, support, security reviews).

**Why they never leave (the compounding moat):** the longer a company uses BrainSquared, the more of its accumulated AI capability lives inside. Ripping it out would mean corporate amnesia — abandoning years of compounded know-how. The problem statement's own goal ("compound their AI knowledge") is also our retention engine. Investors love the word "compounding" — use it.

**Value math for the pitch:** if a 200-person firm loses two experienced people a year, and each takes months of accumulated AI know-how with them, re-learning costs vastly more than a subscription. **We're cheaper than amnesia.**

---

## 8. How to finance the company (realistic path)

**Step 0 — this weekend:** the hackathon organizer, **GenAI Fund**, is an investor that runs this event partly to find teams to back; winners move into deployment conversations with the enterprise partners in the room. The pitch IS fundraising. Collect every card — enterprise partners here are potential **pilot customers**, and a pilot impresses investors more than any slide.

**Step 1 — pilots before money (1–3 months):** get 2–3 companies to try it free or cheap. You want **proof**, not revenue: "Firm X captured 500 pieces of AI know-how in 30 days and reused 40% of them." Investors fund evidence.

**Step 2 — pre-seed (~first 6 months):** in rough order of ease: hackathon/ecosystem prizes → government startup grants (Singapore and Vietnam both have generous AI-startup schemes) → accelerators (small money + mentorship + introductions for a small ownership slice) → angel investors → early funds like GenAI Fund itself. Typical pre-seed here: enough to pay a small team ~a year, for roughly 10–20% ownership. Don't give more this early.

**Step 3 — seed:** once pilots convert to paying customers, raise properly to hire and sell faster.

**The three questions investors WILL ask — with answers rooted in the feature map:**
- *"Why won't the big AI companies build this?"* → They build general tools for individuals. We build the **organization's** memory with **leadership steering** and full traceability — and whoever holds a company's memory first is nearly impossible to displace (see: compounding moat).
- *"How is this different from a wiki or shared drive?"* → Wikis rot because humans must maintain them and nobody does. Our memory **maintains itself** — de-duplicated by the Curator, policed by the Auditor, improved through governed edits. That's the entire point.
- *"What if the AI saves something wrong?"* → Three answers, all live in the demo: everything is traceable to its source; the Auditor checks everything against company rules; and any human can edit anything — with the old version preserved and the edit itself re-checked. Trust is a feature, not a hope.

---

## 9. Competition (know it, don't fear it)

- **The category validator:** Garry Tan (famous Silicon Valley investor) publicly described "G-brain," an internal tool mapping his firm's knowledge. Smart money believes in this category. **Our twist:** his idea maps knowledge; ours adds AI librarians that *maintain* the map and take direction from leadership's own memos. Cite him as proof of the trend, then state the difference.
- **Big workplace tools** (wikis, company search): store and find documents, but don't clean themselves, don't capture the *why*, don't enforce rules automatically — and aren't AI-capability-specific.
- **AI note-takers:** capture individual conversations into *personal* memory. No company-wide de-duplication, no governance, no leadership steering.

One-liner: **"Everyone else stores knowledge. We keep it alive, honest, and on-policy."**

---

## 10. Words to use / words to avoid on stage

Use (simple, vivid): "company memory" · "knowledge walks out the door" · "AI librarians" · "the memory maintains itself" · "leadership steers by writing memos" · "the knowledge saves itself" · "we save why the recipe works" · "cheaper than amnesia" · "nothing is a black box" · "compounding."

Avoid (jargon): tool or brand names of what it's built with, "knowledge graph" (say "living map"), "pipeline" (say "process"), "MCP" on stage (say "our bridge into AI chat tools"), "agentic" alone (say "AI agents that act on their own"), acronyms of any kind.

Technical question from a judge? Hand it over with a smile: "Great question — [name] built exactly that part."

---

## 11. Your checklist

- [ ] Learn the section-2 table until you can recite the right-hand column from memory — it's the pitch AND the Q&A cheat sheet.
- [ ] Rewrite the pitch script (section 6) in your own words.
- [ ] Two slides only: the problem (opening, using THEIR words) and business/vision (closing). The middle is the live product.
- [ ] Attend both timed rehearsals; time them; cut overruns.
- [ ] Drill the three investor questions (section 8) — judges will ask at least one.
- [ ] Close the pitch with: *"You asked for five things. You just saw all five."*
- [ ] Demo-day morning: know who talks, who drives, and where the backup map and backup video live.
- [ ] Collect contacts — pilots and funding both start with a conversation tomorrow.
