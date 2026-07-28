# InTandem — by GoSteady

**Care Conference Dashboard · V1 clickable prototype**

A lightweight trust layer *outside* the EHR that turns quarterly care-conference
meetings from a trust liability into a facility's trust engine. It (a) unifies
sensor + staff-observed status into trends, (b) holds one plain-language plan,
and (c) runs the conference with tracked commitments visible to families.

Built to be projected in a room and iterated on live with the care team. **All
data is fictional and seeded — no backend, no real device ingestion, not a
medical device.**

**▶ Live demo: https://jabl1629.github.io/InTandem/**

**▶ Running a demo? → [docs/DEMO-RUNBOOK.md](docs/DEMO-RUNBOOK.md)** — links, setup, run of show, and what to do when something breaks.

The site hosts two demos: the **EMR Demo** (AI family notification, real outbound phone calls) and the **Huddle Dashboard Demo** (the care-conference dashboard described below).

---

## The four surfaces

| Route | Surface | Job |
|---|---|---|
| `/` | **Rounding Board** | "Who changed most? Who needs a conference?" — sorted by a transparent Change Score. |
| `/resident/:id` | **Resident Conference View** (hero) | Zone A status cards · Zone B the plan · Zone C commitments & history. Prep in 5 minutes. |
| `/resident/:id/conference` | **Conference Mode** | Full-screen meeting runner: agenda, live decision/action capture, timer → generates the family summary. |
| `/family/:id` | **Family View** | The same objective record, in plain language. Overdue commitments are *not hidden* — that's the trust feature. |
| `/summary/:id` | **Family Summary** | The one-page takeaway (print / save-PDF). |

The family view is a **projection of the same data**, never a separate dataset —
that is the core trust mechanic.

## The signature device

Every sensor card carries a **delta band** — the change *since the last
conference* (`▼ 17.7% ▼ 0.14 m/s since May 11`), with the conference date etched
as a reference line in every sparkline. The product's whole argument ("care
conferences should be about what changed") lives in this one repeated stamp.

## Deterministic, defensible logic

All alert thresholds and the Change Score are **pure, unit-tested functions**
(`src/domain/`) using CMS-meaningful thresholds (≥5% weight loss / 30d, >0.1 m/s
gait decline, …). Hover any Change Score to see exactly how it was computed — no
black box.

## The demo narrative (seeded)

- **Eleanor Vance, 84, AL** — the decline arc. Gait + weight cross alert →
  significant-change conference fires, she tops the board, her pre-meeting brief
  writes itself, an overdue PT eval stings.
- **Frank Osei, 79, AL** — the post-rehab success. Everything climbing; shows the
  tool isn't only a decline-detector.
- **Marguerite Delacroix, 88, MC** — the data-gap story. Rich sensor data, stale
  manual domains ("Pain: updated 41 days ago").

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:5199
```

| Script | What |
|---|---|
| `npm run dev` | Vite dev server (port 5199) |
| `npm run build` | Type-check + production build |
| `npm test` | Domain-logic + seed unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |

The seed is deterministic (seeded RNG), so the demo renders identically on every
load. Session edits (captured decisions, action items, answered questions)
persist to `localStorage`; **"Reset demo data"** in the footer restores the seed.

## Deploying

Hosted on **GitHub Pages** and **auto-deploys on every push to `main`** via
`.github/workflows/deploy.yml` — edit, commit, `git push`, and the change is
live at the URL above in about a minute. Routing uses `HashRouter` so deep links
survive a refresh on Pages; the Vite `base` is `/InTandem/` for production builds.

## Stack

Vite · React 18 · TypeScript · Tailwind (design tokens as CSS variables) · React
Router · Zustand · Recharts.

## Structure

```
src/
  data/       seed generator (deterministic RNG) + authored residents/content
  domain/     pure logic: thresholds, deltas, Change Score, assessment (+ tests)
  store/      Zustand store (localStorage-persisted) + selectors
  components/  design-system primitives + zone components
  views/      Rounding Board, Resident Conference, Conference Mode, Family View, Summary
  lib/        formatting, dates (pinned demo "today"), status, agenda, plain language
```

## Demo script (5 min)

1. **Rounding Board** — "It's Monday. Eleanor moved to the top; here's why, in numbers you can defend." (hover the Change Score)
2. **Into Eleanor** — the delta bands since her May conference; the overdue PT eval staring back.
3. **Generate pre-meeting brief** — five minutes of prep, done.
4. **Conference Mode** — check an agenda item, capture a decision, assign an action item to a named owner with a date.
5. **End conference → Family Summary** — "This is what her daughter takes home." (Print / save PDF)
6. **Family View on a phone** — "And this is what her daughter sees Tuesday — including whether we did what we said."
7. **Close on Frank** — "It also shows your rehab wins."

---

*All resident data in this prototype is fictional. Not a medical device; no
diagnostic claims. General-wellness positioning consistent with GoSteady's
regulatory posture.*
