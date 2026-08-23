# Brevitas — Complete Backend Implementation Plan

> **Project:** Hackathon organizing platform with AI-assisted rubric evaluation  
> **Team:** Sumit (backend) + Rishika (frontend, React Vite)  
> **Backend stack:** Next.js 16 (App Router, API Routes only) · MongoDB + Mongoose · Zod · JWT + bcrypt · Socket.io · BullMQ + Redis · Cloudinary · Nodemailer · Gemini 2.5 Flash · Playwright  

---

## 🆕 Addendum — New Features Added

### A. Email Verification After Signup
**Flow:**
1. User registers → account created with `isEmailVerified: false`
2. 6-digit OTP generated → stored in `EmailVerification` collection (TTL: 10 min)
3. OTP sent via Gmail Nodemailer
4. User submits OTP at `/verify-email` → account marked verified → JWT tokens issued → logged in
5. Resend OTP available with 60s rate limit
6. Login is **blocked** for unverified users with clear error message

**New model:** `EmailVerification.ts` — TTL index auto-deletes expired tokens from MongoDB.

---

### B. Username Uniqueness (Real-Time Check)
- `GET /api/users/check-username?username=johndoe` — public, no auth
- Returns `{ available: true }` or `{ available: false, reason: 'taken' | 'invalid_format' }`
- Frontend calls this debounced (e.g. 400ms after user stops typing)
- Also enforced server-side in the register route — both layers always

---

### C. Team Invite via Username/Name Search
**Flow:**
1. User searches by `@username` or name → `GET /api/users/search?q=@johndoe`
2. Clicks "Invite to team" → `POST /api/teams/:teamId/invite` with `{ targetUsername }`
3. Backend creates a `Notification` doc for the target user:
   - `type: 'TEAM_INVITE'`
   - `actionStatus: 'PENDING'`
   - `metadata: { teamId, hackathonId, hackathonName, inviterName, inviteCode }`
4. Target user sees notification in-app with **Accept / Decline** buttons
5. On Accept → `POST /api/notifications/:id/respond` with `{ action: 'ACCEPT' }` → user joins team
6. On Decline → same route with `{ action: 'DECLINE' }` → notification marked declined
7. Real-time: notification also emitted via Socket.io to `user:{targetUserId}` room instantly

**New route:** `POST /api/notifications/:id/respond` — handles ACCEPT/DECLINE

---

### D. Plagiarism Detection

#### When Does It Run?
- **Automatic:** Triggered when a submission is made (background job via BullMQ)
- **Manual:** Organizer can re-trigger from staging area

#### How It Works (Layer by Layer):

| Layer | What it checks | Technology |
|---|---|---|
| **PPT/Deck** | Text similarity across all submissions in the same hackathon | Gemini Embedding API → cosine similarity in MongoDB |
| **PPT/Deck** | External plagiarism (content from internet) | Pass extracted text to Gemini with prompt: "Is this content original or copied from known sources?" |
| **GitHub Repo** | Forked from public repo | GitHub API: check `fork` field + compare tree SHA against parent |
| **GitHub Repo** | Identical code across submissions | Generate code embedding → compare against other teams' submissions |
| **GitHub Repo** | Anti-gaming flags | Rule-based: single commit dump, last-minute burst, timestamp anomalies |

#### Storage:
Add `PlagiarismCheck` model:
```ts
interface IPlagiarismCheck {
  submissionId: ObjectId;
  hackathonId: ObjectId;    // Scope comparisons to same hackathon
  roundId: ObjectId;
  textEmbedding?: number[]; // Stored for comparison against future submissions
  similarTo?: {            // Other submissions this is similar to
    submissionId: ObjectId;
    similarity: number;    // 0.0 to 1.0
  }[];
  flags: {
    highSimilarityDetected: boolean; // > 0.85 cosine similarity
    suspectedExternalCopy: boolean;  // Gemini flagged as copied
    repoIsForked: boolean;
    antiGamingFlags: boolean;        // From AIEvaluation.flags
  };
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
}
```

#### Implementation Phase: Week 7 (build alongside GitHub evaluator)
- Use `@google/generative-ai` `embedContent()` method with `text-embedding-004` model
- Store embedding in MongoDB as `number[]` array
- Cosine similarity computed in JS (no Atlas Vector Search needed for hackathon scale)
- Threshold: similarity > 0.85 → flag as suspected plagiarism (shown to organizer, never auto-reject)

---

### E. PPT Evaluation — Grammar Check + Problem Statement Alignment

Added to the PPT evaluator prompt in `src/workers/evaluators/ppt.ts`:

**Grammar Check:**
- Included as a rubric criterion: `{ name: 'Communication Quality', description: 'Grammar, spelling, clarity of writing across slides' }`
- Gemini Flash already reads all slide text — just add this to the evaluation prompt
- Score 0–100 per criterion, so grammar gets its own score

**Problem Statement Alignment:**
- When organizer creates a round with a `problemStatementPdfUrl`, the PDF text is extracted and injected into the PPT evaluator prompt:
  ```
  Problem statement: <extracted text>
  Evaluate how well the team's solution addresses this problem statement. Score 0-100.
  ```
- This becomes a separate criterion: `{ name: 'Problem Alignment', description: 'How directly does the solution address the stated problem?' }`
- This criterion is **only included** if the round has a problem statement attached

**Implementation:** These are prompt-level additions in Week 8 (PPT evaluator phase) — no schema changes needed.

---

## 📦 Current Codebase Status

### ✅ Already Done
| File | Notes |
|---|---|
| `src/lib/mongodb.ts` | Cached connection — correct |
| `src/models/User.ts` | Core fields present |
| `src/models/Hackathon.ts` | Very complete, conditional required fields |
| `src/models/Round.ts` | Embedded criteria — correct |
| `src/models/Team.ts` | Basic, functional |
| `src/models/Submission.ts` | Covers all round types |
| `src/models/AIEvaluation.ts` | Good structure |
| `src/models/JudgeScore.ts` | Good |
| `src/models/Result.ts` | AI + human score totals |
| `src/utils/tokens.ts` | Access + refresh JWT generation |
| `src/utils/ApiResponse.ts` | successResponse + errorResponse |
| `src/app/api/test-db/route.ts` | DB connectivity test |

### ❌ Not Started (Everything Else)
All API routes, middleware, Zod schemas, Cloudinary, email, Socket.io, BullMQ, AI workers.

---

## 🐛 Model Bugs to Fix First

> [!CAUTION]
> Fix these before writing any route handlers — routes depend on correct model shapes.

| Model | Bug | Fix |
|---|---|---|
| `Team.ts` | `ref: 'Event'` — model is named `Hackathon` | Change to `ref: 'Hackathon'` |
| `User.ts` | `password?` optional in interface, `required: true` in schema | Remove `?` from interface |
| `User.ts` | `teamId: ObjectId` — single team, but users join multiple hackathons | Remove field; track membership via `Team.members[]` only |
| `Hackathon.ts` | `minThreshold` in interface, **missing from schema** | Add `minThreshold: { type: Number, default: 0 }` |
| `Hackathon.ts` | `judges` embedded in hackathon — judges need magic_link_token + may not be platform users | Move to new `Judge` model |
| `Submission.ts` | `verificationChecklist: any[]` | Type as `ChecklistStep[]` (see Phase 6) |

### New Models to Create
- `src/models/Judge.ts` — passwordless judge with magic link
- `src/models/Notification.ts` — in-app notifications
- `src/models/Payment.ts` — Razorpay payment records
- `src/models/Announcement.ts` — organizer broadcasts

---

## Phase 1 — Auth Foundation (Week 1)

### 1.1 — Zod Schemas (`src/schemas/`)
```
auth.schema.ts       → register, login
hackathon.schema.ts  → create/update hackathon
round.schema.ts      → create round + criteria[]
team.schema.ts       → create, join
submission.schema.ts → per round type
```

### 1.2 — Auth Helper (`src/lib/withAuth.ts`)
Next.js App Router has no `req.user`. Use this pattern in every protected route:
```ts
export function getAuthUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), process.env.ACCESS_TOKEN_SECRET!) as { _id: string };
  } catch { return null; }
}
```

### 1.3 — Auth Routes
| Route | Method | What it does |
|---|---|---|
| `/api/auth/register` | POST | Hash password (bcrypt), create User, issue tokens, set httpOnly refresh cookie |
| `/api/auth/login` | POST | Compare bcrypt hash, issue tokens |
| `/api/auth/refresh` | POST | Verify refresh cookie, check matches DB, rotate both tokens |
| `/api/auth/logout` | POST | Clear refreshToken on User doc + clear cookie |
| `/api/auth/me` | GET | Return auth user profile (no password/refreshToken) |

---

## Phase 2 — User & Hackathon CRUD (Week 2)

### 2.1 — User Routes
- `GET/PATCH /api/users/profile` — own profile
- `GET /api/users/search?q=username` — for team invites
- `GET /api/users/:username` — public profile

### 2.2 — Hackathon Routes
- `POST /api/hackathons` — create (auth required, becomes organizer)
- `GET /api/hackathons` — paginated public list (filter: mode, eligibility, search)
- `GET/PATCH/DELETE /api/hackathons/:id` — organizer only for PATCH/DELETE
- `GET /api/hackathons/my/created|participated|judging` — user's hackathons

### 2.3 — Round Routes (nested)
- `POST/GET /api/hackathons/:hackathonId/rounds` — create/list rounds
- `PATCH/DELETE /api/hackathons/:hackathonId/rounds/:roundId`
- Creating a round pushes its `_id` into `hackathon.roundIds`

### 2.4 — Judge Routes + Magic Link
- `POST /api/hackathons/:hackathonId/judges` — add judge (organizer)
  - Creates `Judge` doc
  - Generates `magic_link_token` (JWT, 30d expiry, JUDGE_TOKEN_SECRET)
  - Emails: `https://brevitas.com/judge-login?token=<token>`
- `GET/PATCH/DELETE /api/hackathons/:hackathonId/judges/:judgeId`
- `POST /api/auth/judge-login` — verify token, return scoped judge access token

### 2.5 — Cloudinary Setup
> [!IMPORTANT]
> Next.js App Router does NOT support Express multer middleware. Always use `req.formData()`.

```ts
// src/lib/upload.ts
export async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err || !result) return reject(err);
      resolve(result.secure_url);
    }).end(buffer);
  });
}
```

### 2.6 — Nodemailer Setup (`src/lib/mailer.ts`)
Gmail transport. Email queue (in order of priority):
1. Judge magic link (Phase 2)
2. Team invite (Phase 3)
3. Registration confirmation (Phase 3)
4. Round deadline reminder (Phase 4)
5. Results published (Phase 5)
6. Certificate PDF attachment (Phase 7)

**New env vars needed:**
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
JUDGE_TOKEN_SECRET=
NODEMAILER_EMAIL=
NODEMAILER_PASS=
GEMINI_API_KEY=
REDIS_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

---

## Phase 3 — Teams & Registration (Week 3)

### 3.1 — Team Routes
- `POST /api/hackathons/:hackathonId/teams` — create team, generate `inviteCode` (nanoid), if paid → initiate Razorpay order
- `POST /api/teams/join` — join via invite code, check teamMaxSize, if paid → initiate payment
- `GET /api/hackathons/:hackathonId/teams` — organizer list view
- `GET /api/teams/:teamId` — team detail + member profiles
- `DELETE /api/teams/:teamId/leave` — member removes self

### 3.2 — Notifications
Create `Notification` model with types: `TEAM_INVITE | ROUND_OPEN | RESULT_PUBLISHED | ANNOUNCEMENT`
- `GET /api/notifications` — auth user's notifications
- `PATCH /api/notifications/:id/read`
- `POST /api/teams/:teamId/invite` — sends invite email + creates notification

### 3.3 — Razorpay Payments
- `POST /api/payments/create-order` — creates Razorpay order, returns `{ orderId, amount, currency, key }`
- `POST /api/payments/verify` — verify HMAC signature, create Payment doc, officially register team (push into round.teams)

---

## Phase 4 — Submissions & Manual Judging (Week 4-5)

### 4.1 — Submission Routes
- `POST /api/hackathons/:hackathonId/rounds/:roundId/submit`
  - Check round is open, team is eligible for round
  - Validate fields per `roundType` (SUBMISSION needs deck, PROTOTYPE needs repoUrl+liveUrl+checklist)
  - Upsert submission (allow resubmit before deadline)
- `GET /api/hackathons/:hackathonId/rounds/:roundId/submissions` — organizer/judge view
- `GET /api/submissions/:submissionId` — single detail

### 4.2 — Organizer Staging Area
- `GET /api/hackathons/:hackathonId/rounds/:roundId/staging` — submissions joined with AI eval status + judge scores
- `POST /api/hackathons/:hackathonId/rounds/:roundId/advance` — advance selected teams to next round, reject rest, send emails

### 4.3 — Judge Scoring
- `GET /api/judge/submissions` — judge's assigned submissions + AI scores side-by-side
- `POST /api/judge/submissions/:submissionId/score` — upsert JudgeScore
- `GET /api/judge/submissions/:submissionId/score` — get own scores

### 4.4 — Result Computation
- `POST .../rounds/:roundId/compute-results` — organizer triggers
  - Average judge scores per criterion
  - Weight AI + judge per organizer config
  - `finalScore = (aiWeightedScore × aiWeight) + (humanWeightedScore × judgeWeight)`
  - Assign ranks, upsert Result docs
- `GET .../rounds/:roundId/leaderboard` — round leaderboard
- `GET /api/hackathons/:hackathonId/leaderboard` — final published leaderboard

---

## Phase 5 — Real-time (Week 5-6)

### 5.1 — Custom Next.js Server with Socket.io

> [!IMPORTANT]
> App Router route handlers cannot use Socket.io. You need a custom `server.ts` at the backend root.

```ts
// server.ts
import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';

const app = next({ dev: process.env.NODE_ENV !== 'production' });
app.prepare().then(() => {
  const httpServer = createServer(app.getRequestHandler());
  (global as any).io = new Server(httpServer, { cors: { origin: '*' } });
  (global as any).io.on('connection', (socket: any) => {
    socket.on('join:hackathon', (id: string) => socket.join(`hackathon:${id}`));
    socket.on('join:staging', (id: string) => socket.join(`staging:${id}`));
  });
  httpServer.listen(3000);
});
```

### 5.2 — Socket Events
| Event | Room | When Emitted |
|---|---|---|
| `announcement` | `hackathon:{id}` | Organizer posts announcement |
| `round:opened` | `hackathon:{id}` | Round status changes |
| `eval:complete` | `staging:{roundId}` | AI eval worker finishes |
| `leaderboard:update` | `hackathon:{id}` | Results published |
| `notification` | `user:{userId}` | Team invite, result |

Emit from route handlers: `(global as any).io.to(room).emit(event, payload)`

---

## Phase 6 — AI Evaluation Workers (Week 7-10)

### 6.1 — BullMQ Setup (`src/lib/queue.ts`)
```ts
import { Queue } from 'bullmq';
import Redis from 'ioredis';
export const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
export const evalQueue = new Queue('ai-evaluation', { connection });
```

Trigger route: `POST /api/submissions/:submissionId/evaluate`
- Creates AIEvaluation doc (status: `pending`)
- Enqueues: `evalQueue.add('evaluate', { submissionId, evaluatorType, roundId })`

### 6.2 — Worker Process (`src/workers/eval.worker.ts`)
Separate Node process. Picks jobs → runs evaluator → writes scores → emits socket event.

### 6.3 — GitHub Repo Evaluator (Build First — Text Only, Cheapest)
1. Parse owner/repo from `repoUrl`
2. GitHub API: commit history, README, repo metadata
3. Authenticity heuristics (rule-based, no AI): single giant commit, last-minute dump, backdated timestamps
4. Feed README + commit summary + round rubric to `gemini-2.0-flash` — **one text call**
5. Force structured JSON output: `[{ criteriaId, score, reasoning, confidence }]`

### 6.4 — PPT Evaluator (Build Second — Vision)
1. Download PDF from Cloudinary
2. Convert pages to PNG buffers (`pdf2pic`)
3. Send ALL slides + rubric to Gemini Flash in **one multimodal call**
4. Same JSON output schema

### 6.5 — Live Demo Evaluator (Build Last — Hardest)
Install: `npm i playwright` + `npx playwright install chromium`

Architecture: **rule-based first, AI only as fallback**
```
ChecklistStep types: navigate | login | click | type | verify | screenshot
```
- `navigate/login/click/type`: try deterministic Playwright locators first (`getByRole`, `getByLabel`, `getByText`)
- On timeout → send accessibility tree (`page.accessibility.snapshot()`) to Gemini Flash for selector suggestion
- `verify` always sends screenshot to Gemini vision: `{ passed, confidence, reasoning }`
- Hard limits: max 8 steps per team, confidence < 0.6 → flag for human review
- Sandbox: restrict navigation to submitted domain only
- Store full scratchpad (steps + screenshots + reasoning) as evidence for judges

---

## Phase 7 — Results, Certificates, Analytics (Week 11-12)

### 7.1 — Result Publication
- `POST /api/hackathons/:hackathonId/publish-results` — organizer/super admin
- Requires explicit approval before anything goes live
- Emits `leaderboard:update` socket event
- Triggers email notifications to all teams

### 7.2 — Certificate Generation Worker
- BullMQ `certificate` queue
- For each winner: render HTML template → Puppeteer PDF → upload to Cloudinary → email with attachment

### 7.3 — Analytics
`GET /api/hackathons/:hackathonId/analytics` returns:
- Registration count, impressions
- Submissions + advances per round (funnel)
- Drop-off rate
- Top teams leaderboard

---

## Complete API Route Map

```
/api/auth/         register · login · refresh · logout · me · judge-login
/api/users/        profile (GET/PATCH) · search · :username
/api/notifications/  GET / · PATCH :id/read

/api/hackathons/
  POST /                      create
  GET  /                      public list
  GET  my/created|participated|judging
  GET|PATCH|DELETE  :id
  POST :id/publish-results
  GET  :id/analytics
  GET|POST :id/announcements
  GET  :id/leaderboard

/api/hackathons/:hackathonId/rounds/
  POST|GET /
  PATCH|DELETE :roundId
  POST :roundId/submit
  GET  :roundId/submissions
  GET  :roundId/staging
  POST :roundId/advance
  POST :roundId/compute-results
  GET  :roundId/leaderboard

/api/hackathons/:hackathonId/judges/
  POST|GET /  ·  PATCH|DELETE :judgeId

/api/hackathons/:hackathonId/teams/
  POST|GET /

/api/teams/
  POST join
  GET|PATCH :teamId
  POST :teamId/invite
  DELETE :teamId/leave

/api/submissions/
  GET  :submissionId
  POST :submissionId/evaluate

/api/judge/
  GET  submissions
  POST|GET submissions/:id/score

/api/payments/
  POST create-order  ·  POST verify
```

---

## 12-Week Build Order

| Week | Milestone | Exit Criteria |
|---|---|---|
| 1 | Fix models · Zod schemas · Auth routes | Register/login/refresh/logout via Postman |
| 2 | User routes · Hackathon CRUD · Round CRUD · Judge model + magic link | Organizer creates full hackathon end-to-end |
| 3 | Cloudinary · Team routes · Razorpay · Notifications | Team registers, pays, invites member |
| 4 | Submission routes · Staging area · Judge scoring | Submission submitted, judge scores manually |
| 5 | Result computation · Round advance · Announcements | Full hackathon run without any AI |
| 6 | Socket.io custom server · Real-time events | Staging updates live, no refresh needed |
| 7 | BullMQ + Redis · GitHub repo evaluator | "Evaluate" on repo → rubric JSON scores |
| 8 | PPT evaluator (PDF → images → Gemini vision) | "Evaluate" on deck → rubric JSON scores |
| 9-10 | Live demo evaluator (Playwright + Gemini) | Agent completes checklist, returns scratchpad |
| 11 | Score aggregation end-to-end · Dispute/flag flow | Final score = configurable AI + human blend |
| 12 | Certificates · Analytics · Real pilot hackathon | One actual hackathon runs on Brevitas |
