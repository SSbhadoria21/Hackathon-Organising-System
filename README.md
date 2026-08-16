# Hackathon Evaluator Engine
### System Design, Architecture & Build Report — v2

An end-to-end platform to organize, run, and AI-assist the evaluation of hackathons.

**Prepared for:** Sumit Singh Bhadoria & Rishika Khandelwal — Team size: 2

> **v2 changelog:** Fixed a phase-lettering gap (Phase E was missing in v1) and a numbered-list bug in Section 3.3. Section 3 (AI Evaluation Engine) rewritten with the finalized implementation approach — Gemini free tier as primary model, Stagehand for the live-demo evaluator, single-shot calls for PPT/GitHub, and a new cost/accuracy section. Tech stack table updated to match.

---

## Contents

1. Executive Summary
2. Complete Product Flow (End-to-End)
3. AI Evaluation Engine — Technical Deep Dive
4. System Architecture
5. Roles & Permissions
6. Database Schema
7. Tech Stack
8. Features You May Be Missing
9. MVP Roadmap for a 2-Person Team
10. Where to Start — This Week

---

## 1. Executive Summary

The Hackathon Evaluator Engine is a platform that does two things existing tools (Devfolio, Unstop, HackerEarth) split across manual effort and disconnected spreadsheets: it lets an organizer fully compose a hackathon out of configurable rounds and rubrics, and it evaluates submissions with an AI-assisted pipeline before a human ever opens a project. Every existing platform treats judging as a manual scoring form. None of them offer a workflow-level customization system, and none offer a genuine first-pass AI evaluator that reads a PPT, audits a GitHub repo, and actually operates a live demo the way a human reviewer would.

This report formalizes the exact flow you described, fills in the gaps, and lays out the architecture, schema, tech stack, and a realistic build order for a two-person team building this around college deadlines.

---

## 2. Complete Product Flow (End-to-End)

### Phase A — Event Setup (Organizer)

- Basic info: name, theme, banner, dates, mode (online / offline / hybrid).
- Rounds builder: organizer adds any number of rounds, in any order, and picks a type for each — Submission (PPT/Deck), Prototype (repo + live link + description), Quiz, or Pitch/Video. This is the composable core of the platform — no fixed template.
- Per round: organizer attaches a rubric (criteria + weightage, e.g. Innovation 25%, Technical Depth 30%, UI/UX 20%, Impact 25%) before the round opens. This rubric drives both the AI evaluator and the human judge scorecard, so both are scoring on the same axes.
- Rules: team size min/max, eligibility, tech stack restrictions.
- Tracks/problem statements, prizes, sponsors.
- Full timeline: registration deadline, hacking start/end, per-round submission deadlines, judging windows, result date.
- Judges are created here too — see Phase E.

### Phase B — Registration & Team Formation

- Signup, team creation, join-via-invite-code.
- Once a team is formed, members get a dashboard showing full event details, timeline, and current round status.
- Automated deadline reminders: email (and optionally SMS via MSG91, reusing your TruXero stack) fires at configurable intervals before every deadline — registration close, submission close, round-advance announcement.

### Phase C — Round Execution (the core loop)

This loop repeats for every round the organizer configured in Phase A:

1. Round opens → participants see the round type and requirements (submission form / quiz / prototype fields).
2. Team submits. For a Submission round, that's a PPT/deck upload. For a Prototype round, it's GitHub repo link + live demo link + demo credentials + a short written description **and a "what to check" verification checklist** (see Section 3.3 — this checklist is what makes the live-demo evaluator affordable). For a Quiz round, it's answers to organizer-built questions (MCQ, timed, auto-scored — no AI needed here).
3. Next to every submitted artifact, an "Evaluate" / "Run AI Analysis" button appears in the admin view — e.g. one next to the GitHub repo, one next to the live link, one next to the PPT. Each triggers its own AI evaluation job against that round's rubric (full mechanics in Section 3).
4. AI evaluation completes → the team lands in a Staging Area. This is admin-only — participants never see staging, only their final round result once it's published.
5. Submissions scoring below a configurable minimum threshold are auto-filtered out at this stage. Submissions where the AI evaluator reports **low confidence** are flagged for mandatory human review rather than filtered automatically (see Section 3.5).
6. Everything that clears the threshold goes to human Judges for the real scoring pass (Phase E).
7. Once judging closes, Final Score = weighted blend of AI score + Judge score → Leaderboard is generated → organizer advances the top N teams (e.g. "top 100 of Round 2") into the next round.
8. Repeat until the final round.

### Phase D — Live Event Operations

- Broadcast announcements to all participants at once.
- Mentor allocation + a doubt/query channel.
- QR-code check-in / attendance for offline events.
- Optional live leaderboard (organizer can choose to hide it for suspense, as many real hackathons do).

### Phase E — Judging (Human Layer)

- Judges are added during Event Setup, one by one or in bulk (name + email).
- Each judge gets a unique, auto-generated passwordless login link sent to their email — no shared logins, and it works identically for online and offline events.
- Organizer assigns judges to specific teams/tracks so no judge is overloaded and conflicts of interest can be managed.
- Judges see: the AI's score + reasoning per rubric criterion (as a first-pass reference) side by side with a blank scorecard for their own score and comments — this is assistive, not authoritative, exactly as planned.
- Score aggregation: per team, per criterion — combine every judge's score (averaged or weighted) with the AI score using an organizer-configurable blend ratio (e.g. 60% judges / 40% AI).

### Phase F — Results & Closure

- Final round winner is computed automatically but requires explicit Admin approval before anything goes live — a human always has the last word.
- On publish: result goes live on the platform, and every team member gets an email.
- Offline prizes: logistics/collection details are emailed. Online prizes: auto-generated e-certificates are attached and a congratulatory email is sent.
- Paid registration (if the organizer enables it): the platform collects payment via Razorpay at registration, generates an invoice/ticket, and can handle refunds if an event is cancelled.

### Standalone Mode — "Evaluation Only"

A second product mode for organizers who don't want to run a full hackathon on the platform — they just need submissions evaluated. The organizer defines a custom rubric, uploads or links a list of submissions (repos, PPTs, live links), and gets the same AI evaluation pipeline run against them, with an optional human-review pass, producing a ranked report. This reuses the entire evaluation engine with the event-management layer switched off — useful for internal project reviews, mini-hackathons, or even sponsor-side screening, and it's a good secondary revenue path since it's much lower-effort for an organizer to adopt than a full event.

---

## 3. AI Evaluation Engine — Technical Deep Dive

This is the hardest and most differentiated part of the platform. It has three independent evaluators feeding one aggregator, and they are **not equally expensive** — the build order in Section 9 deliberately goes cheapest-first.

### 3.1 PPT / Deck Evaluation (cheapest of the vision-based evaluators)

- Convert every slide to an image (LibreOffice headless → PDF → pdftoppm/pdf2image).
- Send all slide images, **in a single request**, to the model with the round's rubric embedded in the prompt — this is a one-shot call, not a multi-turn loop, so it stays cheap and fast.
- Primary model: **Gemini 2.5 Flash** (free tier, generous enough for this workload since it's one call per submission). Force a structured JSON response (schema-constrained output) — one score + one short justification per rubric criterion, plus a separate note on visual/design quality. Never free text, so scores stay machine-aggregable.
- Upgrade path: if budget allows later, swap in Claude for this step for stronger qualitative reasoning — the prompt/schema stays identical, only the API client changes.

### 3.2 GitHub Repository Evaluation (cheapest overall — no vision needed)

This is not a browsing task — no UI to navigate, just data to fetch and read. It should be the simplest and fastest evaluator to build.

- Pull commit history via the GitHub API — timestamps, contributor spread, commit message quality. This is a pure API call, no AI involved.
- Authenticity heuristics (rule-based, not AI): flag a burst of commits right before the deadline, a single giant "code dump" commit, or timestamp patterns consistent with backdating.
- Clone the repo, run cheap static signals (linting, cyclomatic complexity, file/folder structure) as objective inputs — also rule-based.
- Feed the README, entry points, and the static-analysis summary to **Gemini Flash (text-only, free tier)** for a qualitative code-quality review scored against the rubric — one call, no images, so it's the lightest possible load on the free-tier token/request quota.

### 3.3 Live Demo Evaluation — the finalized agentic-browsing approach

This is what "an AI agent that actually opens the link and uses the product" means in practice. It does **not** need full desktop computer-use — a browser-scoped agent loop is lighter, cheaper, and sufficient. This is also the slowest, most expensive, and least accurate of the three evaluators, so the design below exists specifically to keep its cost and error rate under control.

**Orchestration layer: Raw Playwright + Gemini Flash.** The agent is built directly on [Playwright](https://playwright.dev/) (headless Chromium) with Gemini Flash as the AI backbone. No wrapper libraries — this gives full control, zero vendor lock-in, and the cheapest possible path. The agent uses the **accessibility tree** (`page.accessibility.snapshot()`) rather than screenshots for AI decision-making, which is both cheaper (text vs. images) and more reliable.

**Hybrid design — rule-based first, AI only as fallback.** The team-submitted checklist is structured into typed steps, not free text:

```typescript
type ChecklistStep =
  | { type: "navigate"; url: string; description: string }
  | { type: "login"; email: string; password: string }
  | { type: "click"; targetHint: string }
  | { type: "type"; targetHint: string; value: string }
  | { type: "verify"; description: string }
  | { type: "screenshot"; label: string };
```

For `login`, `click`, and `type` steps, try deterministic Playwright locators first (`getByLabel`, `getByRole`, `getByText`) — most hackathon prototypes use standard form/button patterns, so this resolves 60–70% of steps with **zero AI calls**. Only on a timeout/failure does the step fall through to an AI fallback: the accessibility tree is sent to Gemini Flash, which returns a suggested selector and action. `verify` steps always require AI judgment (screenshot + description sent to Gemini vision), since they're inherently a visual/functional judgment call.

**Guardrails (required, not optional):**
- Hard step budget per team (e.g. max 8 turns) and a per-team AI-cost cap, enforced in the event config — an organizer-wide AI budget cap sits above this.
- Every `verify` result must include a **confidence score**, not just pass/fail. Low-confidence results are routed to mandatory human review instead of being auto-scored.
- The end-to-end scratchpad (steps taken + key screenshots + reasoning) is stored and shown to the judge as evidence, never presented as a final verdict.
- Sandbox enforcement: browser navigation is restricted to the submitted domain only.

### 3.4 Score Aggregation

Because every evaluator returns structured JSON (score 0–100 or 0–10 per criterion, never prose), aggregation is deterministic:

```
Round Score  = Σ (criterion_score × criterion_weight)
             — computed separately for the AI pass and for each judge

Final Score  = (AI_score × ai_weight) + (avg(Judge_scores) × judge_weight)
             — ai_weight + judge_weight = 1, both set per-event by the organizer
```

### 3.5 Cost, Free-Tier Reality, and Accuracy Expectations

This subsection exists because "use a free API" is not a single well-defined thing across providers — the finalized decisions below were reached by checking each option directly.

**Model choice:**
- **Gemini Flash (Google AI Studio)** is the only provider with a genuinely ongoing free tier (rate-limited by requests/minute and requests/day, no permanent credit card requirement). This is the default model for all three evaluators.
- **OpenAI (ChatGPT) API** does **not** have a reliable ongoing free tier as of 2026 — automatic signup credits have become unreliable/discontinued for many accounts, and any credit that is granted expires in ~3 months. Do not depend on it as a cost-free option.
- **Local models via Ollama** are a genuinely free option (compute cost only, no per-token billing) but are constrained by hardware. On a 4GB-class laptop GPU (e.g. RTX 3050), only small vision models (moondream, quantized Qwen2-VL 2B) fit reasonably, and per-screenshot inference is noticeably slower than a hosted API (~5–15s). Best used for local development/testing and as an **overnight batch fallback** if the Gemini free-tier daily quota is exhausted mid-event — not as the primary live-judging-day engine.

**Cost-reduction levers, in order of impact:**
1. Reduce total AI calls needed per submission (the rule-based-first design in 3.3 is the single biggest lever — it applies before any model/provider choice).
2. Use single-shot calls (PPT, GitHub) instead of multi-turn loops wherever the task allows it.
3. Cap steps/cost per team so one broken or unusually complex submission can't consume a disproportionate share of the event's quota.
4. Spread evaluation over the judging window via the job queue rather than firing all submissions at once, to stay under per-minute/per-day rate limits.

**Accuracy — set expectations honestly, do not oversell this to organizers:**
- Rule-based navigation on well-structured markup: **~70–85%** success.
- Rule-based navigation on rushed/non-semantic hackathon markup: **~40–60%** — falls through to AI fallback.
- AI vision fallback (click targeting, `verify` judgments): roughly **~60–75%**, and this is the harder subset of cases by construction, since it's exactly what the rule-based pass couldn't resolve.
- Multi-step checklists compound this — a 70% per-step success rate across 5–6 dependent steps means a much lower chance of the *entire* checklist completing cleanly end-to-end. Track and score partial completion per step; never treat a checklist as pass/fail as a whole.
- This system should be communicated internally and to organizers as a **~60–75% reliable first-pass filter**, not an automated judge. That is precisely why the human-judge layer in Phase E is structurally required, not optional — recalibrate this section once real numbers are collected from a pilot run (see Section 10).

---

## 4. System Architecture

Four layers, kept deliberately decoupled so the AI evaluation layer (the slow, expensive one) never blocks the core web app:

**Layer 1 — Client.** Next.js app serving three surfaces from one codebase: the public event microsite, the participant dashboard, and the organizer/judge admin console — route-gated by role.

**Layer 2 — API / Core Backend.** Node.js (NestJS recommended over plain Express at this scale, given how many modules you have: events, teams, rounds, rubrics, submissions, judges) exposing REST endpoints, plus a Socket.io gateway for live leaderboard, announcements and round-status updates.

**Layer 3 — Evaluation Worker Queue** (the part most teams skip and regret). Evaluation jobs (PPT / repo / live-demo analysis) must not run inline inside an API request — they take anywhere from seconds to minutes. Push each "Evaluate" click onto a job queue (BullMQ + Redis) and have separate worker processes consume it, write results back to the DB, and notify the admin UI over the same Socket.io channel when done. This is what makes the "Evaluate" button feel responsive instead of hanging the browser tab.

**Layer 4 — Data & Storage.** PostgreSQL (core relational data) + pgvector extension (embeddings for plagiarism/similarity) + object storage for PPTs/screenshots (Supabase Storage or Cloudflare R2).

**Textual flow for one evaluation:**
Organizer clicks "Evaluate" → API enqueues job (type: repo/ppt/demo, submission id, rubric id) → Worker picks job → Worker calls GitHub API (repo) / Gemini single-shot vision call (PPT) / Stagehand + rule-based-first loop (demo) as appropriate → Worker writes structured scores to `scores` table → Worker emits socket event → Admin UI updates the Staging Area row live, no refresh needed.

---

## 5. Roles & Permissions

| Role | Can do |
|---|---|
| Super Admin | Approve final results, manage organizer accounts, platform-level settings |
| Organizer | Create/configure events, rounds, rubrics, judges; run AI evaluation; view staging area; advance rounds |
| Judge | Passwordless login scoped to one event; see AI score + assigned teams only; submit scores/comments |
| Mentor | Access doubt/query channel for assigned teams; no scoring access |
| Participant / Team | Register, form team, submit per round, view own results only after publish |

---

## 6. Database Schema

Core tables (Postgres + Prisma). Not exhaustive on columns, but this is the relational backbone:

| Table | Purpose / key fields |
|---|---|
| events | name, theme, mode, dates, ai_weight, judge_weight, min_threshold |
| rounds | event_id, type (submission/quiz/prototype/pitch), order, opens_at, closes_at |
| rubrics / rubric_criteria | round_id, criterion name, weight |
| teams / team_members | event_id, invite_code, member ↔ team mapping |
| submissions | team_id, round_id, repo_url, live_url, demo_credentials, deck_file, description, verification_checklist |
| ai_evaluations | submission_id, evaluator_type (ppt/repo/demo), raw_scores(json), reasoning, confidence, status |
| scores | submission_id, criterion_id, source (ai/judge), judge_id (nullable), value |
| judges | event_id, name, email, magic_link_token, assigned_teams[] |
| announcements | event_id, message, sent_at |
| payments | event_id, team_id, amount, status, gateway_ref |
| organizers / admins | role, event ownership |

---

## 7. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui, Framer Motion for polish | One codebase for microsite + dashboard + admin; matches your existing stack |
| Form/Rubric builder | react-hook-form + dnd-kit | Drag-drop round/rubric composition |
| Backend API | NestJS (Node.js/TypeScript) | Modular structure suits many domains (events, rounds, judging) better than plain Express at this scale |
| Real-time | Socket.io | Live leaderboard, staging updates, announcements |
| Job queue | BullMQ + Redis (Upstash) | Keeps slow AI evaluation off the request/response path |
| Database | PostgreSQL (Supabase or Railway) + Prisma ORM | Consistent with TruXero stack you already know |
| Vector search | pgvector extension | Plagiarism / submission-similarity detection |
| AI evaluation (PPT, repo) | Gemini 2.5 Flash (free tier), single-shot structured-output calls | Zero/low cost, sufficient for one-shot scoring tasks; Claude as an optional paid upgrade path |
| Agentic browser (live demo) | Raw Playwright (headless Chromium) + Gemini Flash, hybrid rule-based-first with AI fallback via accessibility tree | Zero vendor lock-in, full control, cheapest path; rule-based-first keeps AI calls (and cost) low |
| Local/offline AI fallback | Ollama (moondream / quantized Qwen2-VL) | Free compute-only option for dev/testing and overnight batch overflow if free-tier quota is hit |
| Repo analysis | GitHub REST API + basic static analysis tooling | Commit authenticity + code-quality signal |
| Auth | NextAuth or Clerk, magic-link for judges | Multi-role, passwordless judge access |
| Payments | Razorpay (Route, as in TruXero) | Paid registration + refunds |
| Notifications | Resend (email) / MSG91 (SMS) | Deadline reminders, results, certificates |
| File storage | Supabase Storage or Cloudflare R2 | PPT uploads, generated screenshots/certificates |
| Hosting | Vercel (frontend) + Railway (API, workers, websockets) | Matches your Track Reframe deployment pattern |

---

## 8. Features You May Be Missing

| Feature | Why it matters |
|---|---|
| Plagiarism / duplicate detection | pgvector similarity search across this event's submissions and your own historical database — catches recycled projects, not just copied code. |
| Anti-gaming signals | Backdated-commit detection, near-duplicate PPT flags, generic-AI-pitch detection — surfaced as a flag for judges, not an auto-reject. |
| Dispute / re-evaluation appeal | A team can flag a score they think is wrong; it routes to a human for a second look instead of AI having silent final say — builds trust in the system. |
| Judge conflict-of-interest flag | Judge self-declares if they know a team; organizer reassigns — protects fairness, which is the whole value proposition of this product. |
| Sponsor / co-host dashboard | A limited, read-only view for sponsors who co-fund a track — opens a B2B angle beyond the college use case. |
| Organizer funnel analytics | Registered → submitted → shortlisted → winner, with drop-off at each stage — organizers/sponsors want this for post-event reports. |
| Bulk certificate generation | Auto-fill and batch-generate a PDF certificate per participant on result publish. |
| Per-event AI cost governor | Hard cap on AI spend per event/team — protects you financially once the platform is used by other clubs, and stops one messy live-demo evaluation from ballooning cost. |
| Multi-tenant growth path | Nothing here is MITS-specific — this is structurally the same product as Devfolio/Unstop. Once it works for one college, other colleges/clubs are the natural next customers, and "Evaluation-Only" mode is the low-friction way to get them in. |

---

## 9. MVP Roadmap for a 2-Person Team

Build order matters more than feature count here. Ship a fully working hackathon platform with manual judging first — it is already useful and demoable without a single line of AI code. Layer the AI evaluators in afterward, cheapest and simplest first.

| Weeks | Focus | Exit criteria |
|---|---|---|
| 1–2 | Schema + auth + Event Setup UI (rounds, rubrics, rules) | Organizer can fully configure an event end to end |
| 3–4 | Registration, team formation, participant dashboard, email reminders | A test team can sign up, form a team, and see the timeline |
| 5–6 | Submission flows for all round types (PPT, Prototype, Quiz) + manual staging + manual judge scoring + leaderboard | A full hackathon can run start-to-finish with zero AI — this is your real MVP |
| 7 | AI evaluator #1: GitHub repo scoring (cheapest, text-only, no vision) | "Evaluate" button on a repo returns rubric-based scores |
| 8 | AI evaluator #2: PPT scoring (single-shot vision call) | "Evaluate" button on a PPT returns rubric-based scores |
| 9–10 | AI evaluator #3: live-demo evaluator via Stagehand — rule-based-first, AI fallback (hardest — budget the most time here) | Agent can log in with demo creds, complete a guided checklist, and produce a scored scratchpad with confidence flags |
| 11 | Score aggregation, judge dashboard polish, dispute flow | Final score = configurable AI+judge blend, end to end |
| 12 | Payments, certificates, pilot on a real/mock event at MITS | One real hackathon run on the platform — your strongest proof point, and the source of real accuracy numbers to replace the estimates in Section 3.5 |

> **Note vs. v1:** GitHub and PPT evaluators are now sequenced before the live-demo evaluator, and swapped relative to each other (GitHub first, since it's pure API + one text call — the single cheapest evaluator to validate the worker pipeline against).

---

## 10. Where to Start — This Week

1. Set up a monorepo (pnpm workspaces): `apps/web` (Next.js), `apps/api` (NestJS), `apps/worker` (BullMQ consumer), `packages/db` (Prisma schema shared by api + worker).
2. Write the Prisma schema from Section 6 first — everything else hangs off it. Get it reviewed by your teammate before writing UI.
3. Split work along the seam that already exists in your plan: one of you owns Event Setup + Registration + core admin UI (Sections 2A/2B), the other owns the Submission → Staging → Judging pipeline (Sections 2C/2E) — you'll meet in the middle at the rubric/scores tables.
4. Do not touch the AI evaluators until the manual-judging MVP (end of Week 6 in the roadmap) actually works — it's tempting to build the flashy part first, but a working non-AI platform is both your fallback demo and the thing the AI layer plugs into.
5. Once you reach Week 7, build the GitHub evaluator end-to-end (queue → worker → Gemini text call → DB → socket update) before touching PPT or the live-demo evaluator — it validates the whole worker pipeline on the simplest, cheapest case.
6. Once the Stagehand-based live-demo evaluator (Weeks 9–10) is working on a handful of real submissions, run it against 10–15 real projects from your last hackathon (Black-Box Protocol) and manually check the results — use that to replace the estimated accuracy ranges in Section 3.5 with real numbers.

---

*This report is meant as a living reference — update the rubric weights, table columns, and roadmap dates as you actually build and the scope shifts.*
