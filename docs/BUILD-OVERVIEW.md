# InTandem — Build Overview

**What exists, how it works, and what deliberately doesn't.**
GoSteady LLC · July 2026 · repo [github.com/Jabl1629/InTandem](https://github.com/Jabl1629/InTandem)

> For *running* a demo, see **[DEMO-RUNBOOK.md](./DEMO-RUNBOOK.md)**. This document is the architectural picture.

---

## 1. At a glance

Two independent demo applications served from one static site, plus one backend service.

| | **EMR Demo** | **Huddle Dashboard Demo** |
|---|---|---|
| Route | `/#/emr` + `/#/console` | `/#/huddle` |
| Proves | Chart action → **real AI phone call** → self-writing progress note | One objective record across staff, conference, and family views |
| Backend | Yes — Express on Render, real ElevenLabs calls | None — fully client-side |
| Data | Fictional resident (Margaret Hollis) | 10 fictional residents, deterministically generated |
| Source spec | `demo-build-handoff-claude-code.md` *(gitignored — contains a real phone number)* | `care-conference-dashboard-spec-v1.md` |

**Scale:** ~6,800 lines TypeScript/JS · 25 unit tests (passing) · 20 commits.

**Live:** https://jabl1629.github.io/InTandem/ — a chooser page routes to either demo.

---

## 2. Architecture

```
                    GitHub Pages (static)
   ┌──────────────────────────────────────────────────┐
   │  Chooser  ──►  EMR Demo        Huddle Demo       │
   │                (/emr,/console)  (/huddle/*)      │
   └───────────────────┬──────────────────────────────┘
                       │  HTTPS out only (POST + SSE)
                       ▼
              Render — Express backend
              holds ELEVENLABS_API_KEY
                       │
                       ▼
              ElevenLabs Conversational AI ──► Twilio ──► 📞
```

**Two deliberate architectural choices:**

1. **Outbound-HTTPS only.** The browser POSTs to the backend and subscribes to Server-Sent Events; the backend *polls* ElevenLabs. Nothing requires an inbound tunnel or webhook, so it survives locked-down facility guest WiFi.
2. **Hash routing** (`/#/emr`). GitHub Pages has no SPA fallback, so hash routes let deep links survive a refresh without server config.

---

## 3. EMR Demo

**The claim:** a nurse saves a medication order; the family's phone rings with a recorded AI call; the chart documents itself. The compliance work that costs 15 minutes today, done in one.

### 3.1 The chart (`/emr` — projector view)
`src/emr/EmrDemo.tsx` (552 lines)

- **Generic "Demo EHR" styling** — dense, utilitarian, blues/greys. Deliberately *not* PointClickCare trade dress. Banner reads `DEMO ENVIRONMENT — fictional residents`.
- **Census → chart** for Margaret Hollis (214-A), with patient banner: allergies, code status, diet, attending, contact.
- **Orders tab** — sign a new medication order. Signing fires the toast *and* triggers the call.
- **Vitals tab** — three recent BP readings with above-baseline flags. **These are the same numbers the agent quotes on the call**, sourced from one constant so the projector and the phone can't disagree.
- **Progress Notes tab** — where the receipt lands. Print/save-PDF for the leave-behind.

### 3.2 The console (`/console` — laptop view)
`src/emr/Console.tsx` (214 lines)

Dark, compact, founder-facing. Backend URL (pre-filled, clickable status pill to re-check after a cold start), target phone, contact first name, four scenario fire buttons, live transcript, commitment badge, reset.

### 3.3 The scenarios
`src/emr/constants.ts` (294 lines) — each carries an EMR trigger, `first_message`, a structured facts block, note title, plus a simulated transcript and extraction for offline mode.

| | Scenario | Beat |
|---|---|---|
| **S2** | The Clinical Change — lisinopril order | **The hero.** ~3 min |
| **S1** | Even Tylenol — PRN administered | Mandate × volume. ~45s |
| **S3a** | The IV, Delayed | **Opens a commitment** |
| **S3b** | The IV, Started | **Closes it.** Locked until S3a completes |

**S2's facts block** is the most developed: exact BP readings with instructions to state them verbatim (no rounding, no inventing trends), a prepared answer for *"is that dangerous?"* that refuses to characterize clinical risk and defers to the nurse, and an explicit out-of-scope list.

**S3a→S3b** is the emotional peak — the system made a promise and visibly kept it.

### 3.4 The receipt
A clinical-format progress note renders from the call's extraction fields: who was notified, relationship, what was communicated, acknowledgment status, nurse-callback flag, and the full transcript in an expandable section. This is the compliance artifact and the money screen.

Fields map from ElevenLabs `analysis.data_collection_results` via `mapExtraction()` in `server/index.js`. **Field IDs must match the agent's dashboard config** or lines render blank:
`contact_identity_confirmed` · `call_outcome` · `acknowledgment_received` · `nurse_callback_requested` · `callback_topic` · `summary_for_chart`

### 3.5 The backend
`server/index.js` (192 lines)

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | `{ok, mode}` — also the dyno warmer |
| `GET /api/events` | SSE stream to both windows |
| `POST /api/calls` | Fire a scenario |
| `POST /api/reset` | Clear state |

Fires `POST /v1/convai/twilio/outbound-call`, then polls `GET /v1/convai/conversations/{id}` every 2s for status, transcript turns, and extraction — broadcasting each new turn over SSE.

**MOCK mode:** with no API key (or `MOCK=1`), it replays the client-supplied simulated transcript over the same SSE pipeline. The entire flow is exercisable with no key and no phone call.

### 3.6 Call-vendor abstraction
`src/emr/backend.ts` isolates every vendor-specific detail — URL resolution, dynamic-variable construction, SSE subscription. Swapping ElevenLabs for **Retell** (see [voice-vendor-hipaa-assessment.md](./voice-vendor-hipaa-assessment.md)) is a one-file change in `server/index.js`; the front end doesn't move.

---

## 4. Huddle Dashboard Demo

**The claim:** care conferences should be about *what changed*. One objective record, three audiences, commitments families can actually see.

### 4.1 The four surfaces
| Route | View | Job |
|---|---|---|
| `/huddle` | **Rounding Board** | "Who moved most since we last looked?" |
| `/huddle/resident/:id` | **Conference View** (hero) | Zone A status · Zone B plan · Zone C commitments |
| `/huddle/resident/:id/conference` | **Conference Mode** | Live 20-minute meeting runner |
| `/huddle/family/:id` | **Family View** | Same record, plain language, mobile-first |
| `/huddle/summary/:id` | **Family Summary** | The printable one-pager |

### 4.2 The signature device — the delta band
Every sensor card stamps the change *since the last conference* (`▼ 17.7% ▼ 0.14 m/s since May 11`), with that conference date etched as a dashed reference line in the 90-day sparkline. It's the product's entire argument, rendered identically everywhere.

### 4.3 Deterministic clinical logic
`src/domain/` — pure, unit-tested functions. **25 tests, all passing.**

- `thresholds.ts` — CMS-meaningful cutoffs: **≥5% weight loss/30d** or ≥10%/180d → alert; **>0.1 m/s gait decline/30d** → alert; hydration, nutrition, wellness, activity rules.
- `changeScore.ts` — weighted sum with **every contributing factor exposed** for the hover breakdown. No black box.
- `deltas.ts` — since-last-conference math with adverse-direction awareness per domain.
- `assess.ts` — composes it all per resident, including the **significant-change trigger** (≥2 alerts, or 1 alert + a fall in 30d).

### 4.4 Deterministic data generation
`src/data/generate.ts` + `lib/rng.ts` — a seeded mulberry32 PRNG produces 190 days of readings per resident per domain (90 displayed; the extra tail makes the 180-day CMS weight threshold computable). **Never `Math.random()`** — the demo renders identically on every machine and reload. "Today" is pinned so the authored narratives don't drift.

**Three authored arcs**, validated by tests:
- **Eleanor Vance** — decline. Gait + weight cross alert, significant-change fires, tops the board, one overdue PT eval.
- **Frank Osei** — post-rehab success. Proves it isn't only a decline detector.
- **Marguerite Delacroix** — data gap. Rich sensor data, stale manual domains ("updated 41 days ago").

### 4.5 Session state
Zustand + `localStorage`. Decisions, action items, answered questions and generated summaries captured live during a conference persist across refresh. "Reset demo data" restores the seed.

---

## 5. Shared foundations

**Design system** — CSS-variable tokens in `src/index.css`. Paper white surfaces, deep spruce ink, desaturated status colors (moss/ochre/brick) used *only* for status, and glacier blue reserved exclusively for the "Families see this" trust system. Fraunces display + Inter UI, tabular figures on all metrics. WCAG AA, visible focus, reduced-motion respected.

The two demos are **visually distinct on purpose**: the EMR is cold enterprise blue-grey; Huddle is warm clinical.

**Provenance icons** — three glyphs (waveform = sensor, clipboard = staff, house = family) used identically everywhere, with a footer legend. Provenance is a product principle, not decoration.

**Deployment** — push to `main` → GitHub Actions builds and publishes to Pages (~1 min); Render auto-redeploys the backend on the same push. `render.yaml` blueprint at repo root; secrets live only in Render's env store.

---

## 6. Deliberately NOT built

| | Why |
|---|---|
| **Live transcript during the call** | ElevenLabs' conversation REST endpoint doesn't populate the transcript until the call ends. True live captions need their WebSocket or Twilio Media Streams — an inbound connection that fights the outbound-only design. Shelved as high-risk/low-reward for a demo. |
| **Platform teaser** (`/board`, `/family` for EMR) | Handoff step 9 — "one record, three surfaces." Not started. |
| **`?replay` mode** | Handoff step 10 — replay a recorded event log for the backup video. **The highest-value remaining item** (demo insurance). |
| **S5 blank/improv scenario** | Live-editable fact block for "could it handle a room change?" |
| **Any PCC integration** | Research only — see [pcc-sandbox-integration-spec.md](./pcc-sandbox-integration-spec.md). No account, no application submitted. |
| **Auth, roles, real PHI, HIPAA infra** | Out of scope. All data fictional; disclaimer on every screen. |
| **Live SMS** | Simulated only, per the handoff's hard constraint. |

---

## 7. Known seams

- **Free-tier cold start.** Render sleeps after ~15 min idle; first wake ~50s. Wake it before any demo. (Status pill is clickable to re-check.)
- **Multi-place scenario edits.** Changing a clinical value in S2 touches `RECENT_VITALS`, the facts block, the spoken-format example, the sim transcript, and the chart summary. A generator could collapse these to one source — not yet done.
- **Extraction coupling.** The progress note depends on ElevenLabs dashboard field IDs matching the code. A mismatch fails silently as blank lines.
- **Bundle size** ~690KB (198KB gzipped), Recharts-dominated. Fine for a laptop demo; would want code-splitting for production.
- **`localStorage` only.** No server-side persistence. Different browser = fresh state.
- **ElevenLabs is demo-only.** Its HIPAA mode requires Zero Retention, which deletes the transcript and analysis the progress note is built from. Production requires the Retell migration.

---

## 8. File map

```
src/
  Chooser.tsx           demo front door
  emr/                  ── EMR Demo ──
    EmrDemo.tsx         chart: census, orders, vitals, notes
    Console.tsx         founder controls
    constants.ts        scenarios, facts, vitals, sim transcripts
    emrStore.ts         state; routes real vs simulated calls
    backend.ts          vendor-isolating client + SSE
    useEmrEvents.ts     subscribes both windows
  views/                ── Huddle Demo ──
    RoundingBoard · ResidentConference · ConferenceMode
    FamilyView · FamilySummaryPage
  components/           Huddle UI (delta band, sparkline, zones, drawer…)
  domain/               pure logic + tests (thresholds, changeScore, deltas, assess)
  data/                 seed generator, residents, authored content
  store/                Zustand + selectors
  lib/                  dates, format, status, agenda, plain language, rng
server/
  index.js              Express + ElevenLabs + SSE
  DEPLOY.md             Render setup checklist
docs/                   this file, runbook, specs, research
```

---

## 9. Where to change things

| To change… | Edit |
|---|---|
| What the AI says (opener) | `src/emr/constants.ts` → `fm()` + each `firstMessage` |
| What the AI knows | `constants.ts` → each scenario's `facts` |
| BP readings | `RECENT_VITALS` **and** the S2 facts block |
| Progress-note format | `ProgressNote` in `EmrDemo.tsx` |
| Call vendor | `server/index.js` only |
| Alert thresholds | `src/domain/thresholds.ts` (+ tests) |
| Resident narratives | `src/data/residents.ts` → `PLANS` |
| Colors / type | `src/index.css` tokens |

---

*All resident data is fictional. Not a medical device; no diagnostic claims. General-wellness positioning consistent with GoSteady's regulatory posture.*
