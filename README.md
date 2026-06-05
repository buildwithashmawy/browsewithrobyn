# Robyn — a super-smart browser agent

Type a task in plain English and watch **Robyn** drive a real browser to do it — every
step streamed live with a screenshot view, a glowing highlight over the element it's
touching, and a calm amber "recovery" state when reality diverges from the plan.

> Built as a take-home for [Robyn](https://www.meetrobyn.com/).

**Stack:** Next.js 15 · Tailwind v4 · Convex (realtime) · Playwright · OpenRouter (LLM, model-portable)

```
apps/web     Next.js 15 split-view UI — subscribes to Convex, never calls the LLM
apps/agent   long-lived Node/TS service: Playwright + the observe→plan→act loop
convex/      realtime state bus (sessions · steps · frames) shared by both
```

---

## How it works

```
 ┌────────────┐  createSession + /api/start   ┌──────────────┐
 │  apps/web  │ ───────(Next route proxy)────▶ │  apps/agent  │
 │  Next 15   │                                │  Playwright  │
 │ (subscribe)│ ◀──── reactive queries ─ Convex ─── (writes) ─┤  + LLM loop  │
 └────────────┘    sessions · steps · frames   └──────────────┘
```

- **The web app only subscribes.** Reactive `useQuery` against Convex renders the
  thread, the step cards, and the live screenshot. It never talks to the LLM and holds
  no secrets.
- **The agent only writes.** It owns the browser and the planning loop, and streams rows
  into Convex as it works. The web reacts.
- **Convex is the contract.** The `steps` row shape mirrors the finalized design exactly,
  so the UI renders real agent output unchanged.

### Why a separate agent service

Playwright needs a long-lived process that owns a real, persistent Chromium — it can't
live inside Next's serverless request model. Splitting it out also means the browser/LLM
loop can crash, retry, or run for minutes without affecting the web tier. The browser runs
**headless by default** (you watch every action via the app's live screenshot stream); each
run gets its own browser profile, so **multiple tasks run concurrently** and are tracked in
a **collapsible sessions sidebar** (left rail) you can switch between at any time.

### Why Convex for realtime

The agent emits a stream of state (status, steps, screenshots) that the UI must reflect
the instant it changes. Convex gives reactive queries + file storage out of the box, so
"the agent writes a row, the browser updates" needs zero websockets, polling, or glue.
The web subscribes; the agent writes; neither knows about the other.

### The observe → plan → act → self-check loop (priority #1)

Each turn the agent:

1. **Observes** — captures the page's accessibility tree + a screenshot + the URL.
2. **Plans** — sends the goal, a running scratchpad of what it's tried, and the
   observation to the LLM, which returns **one** structured action
   (`{ kind, target_description, selector_strategy, value, reasoning, expected_outcome }`)
   via OpenRouter tool-calling. Every response is validated against a Zod schema; malformed
   output is re-prompted, never crashed.
3. **Acts** — executes via Playwright using an **accessibility-first selector ladder**
   (role/name → label → text → placeholder → testid → CSS last).
4. **Self-checks** — re-observes and asks the LLM "did that achieve the expected outcome?"
   If not, it re-plans. A scratchpad with observation hashes stops it from looping.

Smartness/robustness levers:

- Accessibility tree + role/name selectors over brittle CSS.
- Cookie/consent banners and modals are auto-dismissed before acting.
- Waits on `networkidle` / element visibility — **never fixed sleeps**.
- Element-not-found → re-observe and re-plan instead of crashing.
- Per-step retry cap + global step cap.
- **CAPTCHA / bot-walls are detected and the run stops cleanly** with an honest report.
- **Conversational** — when it needs information only you have, it uses an `ask` action: the run pauses (status _Waiting for you_, browser kept open), you reply in the same session, and it resumes from where it was. Follow-up messages mid-run are honored too.
- Recoverable hiccups map to the amber **`recover`** step state with a human note; the
  Robyn character shifts amber too. Hard blocks map to a calm `failed` (never red-screen).
- Before each screenshot the agent computes the acted element's bounding box and stores it
  as `highlightRect`, so the UI can draw the glowing overlay + traveling cursor.

### Why OpenRouter

One OpenAI-compatible endpoint, many models. The model is **chosen in the UI per run** and
ridden along on the session; the agent reads `session.model` for every call. This makes it
trivial to tune the agent's intelligence against cost without touching code. The header
**model picker** is populated from OpenRouter's live `/models` list and flags
vision-capable models — text-only models are disabled with a warning, since the loop sends
screenshots. `OPENROUTER_MODEL` is only the default/fallback for the picker.

---

## Run it locally

**Prereqs:** Node ≥ 20, `pnpm`, and an [OpenRouter API key](https://openrouter.ai/keys)
(your own — Robyn uses it for all model calls).

```bash
pnpm install
pnpm --filter agent exec playwright install chromium
```

### 1. Start Convex (the realtime backend)

Easiest — a local deployment, no account needed:

```bash
CONVEX_AGENT_MODE=anonymous npx convex dev
```

…or the standard cloud dev deployment (prompts you to log in):

```bash
npx convex dev
```

Either way Convex prints a deployment URL (e.g. `http://127.0.0.1:3210` for local, or
`https://<name>.convex.cloud` for cloud) and writes it to `.env.local`. Copy that URL into
the two env files below.

### 2. Configure env

`apps/web/.env.local`

```ini
NEXT_PUBLIC_CONVEX_URL=<the Convex URL from step 1>
NEXT_PUBLIC_AGENT_URL=http://localhost:8787
```

`apps/agent/.env`

```ini
CONVEX_URL=<the same Convex URL from step 1>
OPENROUTER_API_KEY=<your OpenRouter key>
OPENROUTER_MODEL=anthropic/claude-sonnet-4   # default/fallback for the picker
PORT=8787
```

(See `.env.example` for the full list.)

### 3. Start the agent and the web app

In separate terminals (keep `convex dev` running):

```bash
pnpm --filter agent dev   # Playwright service on :8787
pnpm --filter web dev     # UI on http://localhost:3000
```

Or run all three at once:

```bash
pnpm dev:all
```

Open <http://localhost:3000>, pick a model, and click a demo chip.

### Env vars

| Var                      | Used by      | Purpose                                                    |
| ------------------------ | ------------ | ---------------------------------------------------------- |
| `NEXT_PUBLIC_CONVEX_URL` | web          | Convex deployment URL (browser-safe)                       |
| `NEXT_PUBLIC_AGENT_URL`  | web (server) | where the start/stop proxy forwards to                     |
| `CONVEX_URL`             | agent        | same Convex deployment URL                                 |
| `OPENROUTER_API_KEY`     | agent        | **your** key; all LLM calls (never shipped to the browser) |
| `OPENROUTER_MODEL`       | agent        | default/fallback model (the picker overrides per run)      |
| `PORT`                   | agent        | agent HTTP port (default 8787)                             |

Optional: `HEADLESS=0` (show the Chromium window — **headless by default**), `PW_CHANNEL=chrome`
(use real Chrome), `VIEWPORT_W` / `VIEWPORT_H` (browser size, default 1280×1000),
`GLOBAL_STEP_CAP`, `PER_STEP_RETRY`.

---

## Demo tasks (login-free)

The empty-state chips seed three tasks that get to a result without any account:

1. **Summarize this weekend's weather in San Francisco** — the most reliable demo.
2. **Find a one-way SFO→JFK flight under $300** (Google Flights / Kayak).
3. **Find a Park Slope 1BR rental under $3,500** (StreetEasy).

Robyn is general-purpose, so you can type anything — these are just starting points.

### See the UI without any backend

`http://localhost:3000/preview` replays a scripted run through the real components — no
Convex, no agent, no API key. Useful for reviewing the design and animations.

---

## Known limitations (honest scope)

- **CAPTCHA / bot detection.** The agent searches with **Google** (as requested). Google
  _search_ aggressively blocks automated browsers — it serves a `/sorry` CAPTCHA page, and a
  spoofed user-agent isn't enough to avoid it. Google _Flights_ and most ordinary sites work
  fine; weather has a direct `wttr.in` path. When Robyn hits a CAPTCHA it can't pass, it
  **stops cleanly with an honest report**. For reliable Google _search_, run against a real,
  logged-in Chrome profile (`PW_CHANNEL=chrome` + a persistent user-data dir).
- **Auth-gated tasks are out of scope.** No logins, payments, or account creation — if a
  task needs them, Robyn reports `failed` and says why.
- **Pause has a timeout.** When Robyn pauses to ask, it waits ~4 minutes for your reply, then
  gives up (send another message to pick it back up). Continuing a session that already
  _finished_ re-opens a fresh browser, so it re-navigates rather than restoring exact state.
- **Screenshots** live in Convex file storage (size/retention untuned).
- **No auth.** Single anonymous user — intentional for a take-home.

---

## Layout

```
apps/web/src/
  app/            layout, providers (Convex), globals.css (ported design tokens),
                  page.tsx (live), preview/ (fixtures), api/{models,start,stop}/
  components/     ChatPanel, StepCard, Composer, EmptyState, Thread, BrowserPanel,
                  ResultCard, RobynCharacter, Icon, ModelPicker, TweaksPanel, …
  hooks/          useSession (Convex subs), useImageScale (overlay math), useTweaks, useTheme
  lib/            deriveView (DB → playback state), curatedModels, fixtures, types
apps/agent/src/
  loop.ts         the observe→plan→act→self-check orchestrator + all Convex writes
  llm/            OpenRouter client + tool/action schemas (Zod-validated) + prompts
  browser/        Playwright controller (consent dismissal, screenshots, bot-wall detect)
  executor.ts     action → Playwright (accessibility-first selector ladder)
  convex.ts       Convex writer + screenshot upload    server.ts   POST /session, /:id/stop
convex/           schema.ts + sessions/steps/frames functions
```

Built with Claude Code.
