# Care Conference Dashboard — V1 Prototype Spec

**Working title:** Roundtable (placeholder — GoSteady sub-brand TBD)
**Author:** Jace / GoSteady LLC
**Date:** July 2026
**Status:** Ready for build (Claude Code)
**Deliverable type:** Clickable front-end prototype with seeded mock data. No backend, no real device ingestion. Built to be demoed live to the Frasier Meadows care team and iterated on during the EIR program.

---

## 1. Context & problem

Discovered during EIR discovery at a full-continuum CCRC: quarterly "care conference" meetings between the interdisciplinary team (IDT) and families are producing **inconsistent understanding of the care plan across stakeholders**, which is escalating into near-crisis loss of family trust. Root causes observed:

1. Resident status data is scattered across the EHR, paper, a Word doc (nutrition alerts), and staff memory. No shared objective record.
2. The plan itself lives in EHR care-plan language families never see and staff paraphrase differently.
3. Commitments made in conferences ("we'll start PT twice a week," "we'll notify you if her weight drops") have no tracked owner, due date, or visible status. Families discover lapses on their own — this is where trust dies.
4. Meetings are short (often 15–20 min), unprepared, and undocumented; families leave without a written summary.

**Thesis:** a lightweight layer *outside* the EHR that (a) unifies sensor + staff-observed status into trends, (b) holds one plain-language plan, and (c) runs the conference workflow with tracked commitments — turns care conferences from a trust liability into the facility's trust engine. Sensor streams (GoSteady mobility, smart water bottle, connected scales, structured meal intake, voice check-ins) are the objective backbone.

**What V1 is testing (discovery goals):**
- Does the IDT see this replacing their current prep ritual (EHR spelunking + Word doc + sticky notes)?
- Which domains/cards do they gravitate to or ignore?
- Does the "tracked commitments visible to family" concept excite or terrify them?
- Does the significant-change trigger (sensors proposing an off-cycle conference) land as valuable or as alarm fatigue?

---

## 2. Goals & non-goals

### V1 goals
- Three audiences, one data source: multi-resident **Rounding Board** (staff), single-resident **Conference View** (IDT, hero screen), and **Family View**.
- A live **Conference Mode** for running the meeting: agenda, decision log, action-item capture, auto-generated family summary.
- Deterministic, defensible alert logic on seeded data (no ML, no black box).
- A believable demo narrative: one resident in visible decline triggering a significant-change conference; one post-rehab success story.
- Feels like a real product, not a slide. Polished enough that an ED or DON projects it in a room.

### Non-goals (V1)
- No EHR / PointClickCare integration, no HL7/FHIR.
- No real device ingestion; all data is seeded.
- No auth, roles, or HIPAA infrastructure (all resident data is fictional — state this in the footer).
- No real notifications (email/SMS); the notification log is seeded + appendable in-session.
- No multi-facility, no admin/config screens.
- No care-plan *editing* workflow beyond action items and decisions (plan content is seeded).

---

## 3. Users & views

| User | View | Primary job |
|---|---|---|
| IDT lead (DON, wellness director, care coordinator) | Rounding Board | "Who changed most? Who needs a conference?" |
| Full IDT (nursing, PT/rehab, dining, activities, social work) | Resident Conference View + Conference Mode | Prep in 5 min, run the meeting in 20, capture commitments |
| Family member (adult child, usually remote) | Family View | "How is Mom actually doing, what's the plan, and are you doing what you said?" |

Same underlying data in every view. The family view is a plain-language projection of the IDT view, never a separate dataset. That is the core trust mechanic — make it visibly true in the UI (e.g., a "Families see this" eye icon on shared elements).

---

## 4. Information architecture & screens

```
/                       Rounding Board (all residents)
/resident/:id           Resident Conference View  ← HERO SCREEN
/resident/:id/conference   Conference Mode (live meeting)
/family/:id             Family View
```

Global shell: left rail nav (Rounding Board, Residents, demo switcher to Family View), top bar with facility name ("Fraser Pines" — fictional stand-in), date, and view-as toggle.

### 4.1 Rounding Board (`/`)

Multi-resident triage table/cards for the daily or weekly stand-up.

- One row/card per resident: name, photo, room, care level (IL / AL / MC / SNF — full continuum), **Change Score** (see §6), top active alerts as chips, days until next scheduled conference, count of overdue action items.
- Default sort: Change Score descending ("who moved most since we last looked").
- Filters: care level, alert domain, "conference due in 30 days," "has overdue commitments."
- Row click → Resident Conference View.
- Banner slot at top for significant-change triggers: "⚠ Eleanor Vance has crossed 2 thresholds — significant-change conference recommended. [Schedule]".

### 4.2 Resident Conference View (`/resident/:id`) — hero screen

Three vertical zones matching the three-layer model.

**Header:** resident identity card (name, age, room, care level, admit date, primary contact w/ relationship), last conference date, next conference date, significant-change banner when triggered.

**Zone A — Status (the objective record).** Grid of domain cards. Each card:
- Domain name + source icon + **provenance tag**: `sensor` / `staff-observed` / `family-reported` (small, consistent iconography — this distinction is a product principle, render it everywhere).
- Current value + unit.
- 90-day sparkline with last-conference date marked as a vertical reference line — **delta since last conference is the hero metric**, rendered large (e.g., "▼ 7.2% since Apr 14").
- Status: `stable` / `watch` / `alert` (see §6 for thresholds). Color-code the left border, not the whole card — avoid alarm-wall.
- Linked goal chip if a plan goal targets this domain (e.g., "Goal: 400 steps/day → 62% of days met").
- Click → expanded drawer: full trend chart, reading log, threshold annotations.

Domain cards, V1 set:

| Domain | Source | Provenance | Key metrics |
|---|---|---|---|
| Mobility | GoSteady walker sensor | sensor | daily steps/distance, gait speed trend, usage consistency, sedentary-day flags |
| Hydration | Smart bottle | sensor | daily intake vs goal (mL), 7-day goal-hit rate |
| Weight | Connected scale (wheelchair-inclusive) | sensor | weight trend, 30d/180d % change |
| Nutrition | Structured meal-intake entry by dining staff | staff-observed | % eaten per meal, 3-day intake average, diet/allergy/texture flags shown on card |
| Wellness & cognition | Voice check-in | sensor | check-in completion rate, self-reported mood (1–5), anxiety-flag frequency |
| Falls & incidents | Manual entry | staff-observed | count in 90d, last incident, type |
| Medications | Manual entry | staff-observed | active med count, changes since last conference (list) |
| Sleep | Manual (V1) | staff-observed | qualitative flag: normal / disrupted |
| Pain | Manual | staff-observed + family-reported | last reported score, trend arrow |
| ADL function | Manual | staff-observed | assistance level per ADL, changes flagged |
| Social engagement | Manual (activities attendance) | staff-observed | activities/week, trend |
| Skin integrity | Manual | staff-observed | status flag |

The five sensor domains get full trend cards; the manual domains render as a compact "clinical checklist" strip below them (value + trend arrow + last-updated). Don't give a hand-entered qualitative flag the same visual weight as 90 days of sensor data.

**Zone B — The Plan (single source of truth).** One row per active goal:
- Plain-language goal ("Walk to the dining room without assistance by September").
- Linked domain + target metric, with live progress bar fed by Zone A data.
- Interventions (bulleted, short) + **owner** (name + role chip).
- "Families see this" indicator — the whole zone is family-visible.

**Zone C — Commitments & history.**
- Action items table: description, owner, due date, status (`open` / `done` / `overdue` — overdue gets the strongest treatment on the page). Add-item inline.
- Decision log: dated entries from past conferences.
- Notification log: "Family notified of [event] on [date] via [phone/portal] by [staff]" — seeded entries + one-click "log a notification" affordance. This directly answers the #1 ombudsman complaint category (families learning about events late).
- Buttons: **"Generate pre-meeting brief"** (renders a modal: deltas since last conference, open/overdue items, family-submitted questions, suggested agenda) and **"Start conference →"**.

### 4.3 Conference Mode (`/resident/:id/conference`)

Full-screen, projector/tablet-friendly meeting runner. Optimized for a 20-minute meeting.

- Left column: agenda checklist (auto-built from the pre-meeting brief: each `watch`/`alert` domain, each overdue commitment, each family question). Check items off as covered.
- Center: the current agenda item's domain card, enlarged.
- Right column, always visible: **capture panel** — add decision, add action item (description, owner picker, due date), answer/log a family question. Everything captured here appends live to Zone C.
- Footer: elapsed timer; **"End conference"** → generates the **Family Summary**: a clean one-pager (in-app page + print stylesheet) in plain language — what we reviewed, what changed, what we decided, who's doing what by when, your questions & answers, next conference date. Evidence-backed practice: families who receive a written copy of what was discussed respond more positively, so this is the money screen for the demo.

### 4.4 Family View (`/family/:id`)

Mobile-first, plain language, warm but not saccharine.

- "How is Eleanor doing" summary strip: 3–5 domain tiles with plain wording ("Walking a bit less than last month," "Drinking water consistently") + simple trend glyphs. Same data as the IDT view, relabeled — never a fork.
- The Plan, verbatim from Zone B.
- **Commitments tracker**: every action item with status. Overdue items are *not hidden* — that's the trust feature. (Expect facility pushback; that reaction is discovery data.)
- Notification history.
- Latest Family Summary (from Conference Mode) + archive.
- "Submit a question for the next conference" input → appears in the IDT pre-meeting brief.
- Next conference date + attendee list.

---

## 5. Data model (TypeScript types, seeded JSON)

```ts
type CareLevel = 'IL' | 'AL' | 'MC' | 'SNF';
type Provenance = 'sensor' | 'staff' | 'family';
type DomainStatus = 'stable' | 'watch' | 'alert';

interface Resident {
  id: string; name: string; photoUrl: string; age: number; room: string;
  careLevel: CareLevel; admitDate: string;
  primaryContact: { name: string; relationship: string };
  lastConferenceDate: string; nextConferenceDate: string;
  significantChangeFlag: boolean;
}

interface Reading { residentId: string; domainId: string; date: string; value: number; provenance: Provenance; }

interface Domain {
  id: string; label: string; unit: string; provenance: Provenance;
  sensorBacked: boolean; // full card vs. checklist strip
}

interface Goal {
  id: string; residentId: string; domainId: string;
  plainLanguage: string; targetMetric: string; targetValue: number;
  interventions: string[]; owner: StaffMember; familyVisible: true;
}

interface ActionItem {
  id: string; residentId: string; description: string;
  owner: StaffMember; dueDate: string;
  status: 'open' | 'done' | 'overdue';
  createdInConferenceId?: string;
}

interface Conference {
  id: string; residentId: string; date: string;
  type: 'routine' | 'significant-change' | 'admission';
  decisions: Decision[]; actionItemIds: string[];
  familyQuestions: { question: string; askedBy: string; answer?: string }[];
  summaryGenerated: boolean;
}

interface NotificationLogEntry {
  residentId: string; date: string; event: string;
  channel: 'phone' | 'portal' | 'in-person'; loggedBy: string;
}

interface StaffMember { id: string; name: string; role: 'DON' | 'RN' | 'PT' | 'Dining' | 'Activities' | 'SocialWork' | 'ED'; }
```

State: seed JSON → in-memory store (Zustand). Persist session mutations (new action items, decisions, checked agenda items) to `localStorage` so a demo survives a refresh. A "Reset demo data" control lives in the nav footer.

---

## 6. Alert logic & Change Score (deterministic)

All thresholds computed at load from seeded readings. Keep the functions pure and unit-testable — these will be quoted to clinicians.

| Domain | `watch` | `alert` |
|---|---|---|
| Weight | 3–4.9% loss in 30d | ≥5% loss in 30d or ≥10% in 180d (CMS-meaningful thresholds) |
| Mobility (gait speed) | 0.05–0.1 m/s decline over 30d | >0.1 m/s decline over 30d (clinically meaningful change) |
| Mobility (activity) | daily distance down >25% vs prior 30d avg | down >40%, or 3+ zero-use days in a week |
| Hydration | <70% of goal on 3+ of last 7 days | <70% on 5+ of last 7 days |
| Nutrition | <75% avg intake over 3 days | <50% intake for 3 consecutive days |
| Wellness | check-in completion <60% weekly | 3+ anxiety flags in 7 days, or mood avg ≤2 for a week |

**Change Score** (Rounding Board sort): weighted sum of normalized 30-day deltas across sensor domains + 10 pts per new `alert` + 5 per new `watch` + 5 per overdue action item. Display as a number with the contributing factors on hover. No opacity about how it's computed.

**Significant-change trigger:** ≥2 domains at `alert`, or 1 `alert` + a fall in 30d → set `significantChangeFlag`, surface the banner on Rounding Board + resident header with "Schedule significant-change conference" CTA. This encodes the stability→instability meeting-type transition from the care-conference literature and is the sensors' headline value claim.

---

## 7. Seed data requirements

10 residents across the continuum (2 IL, 4 AL, 2 MC, 2 SNF). 90 days of daily readings per sensor domain, generated with realistic noise (script the generation; don't hand-write arrays). Three authored narratives, the rest background-stable:

1. **Eleanor Vance, 84, AL — the decline arc (demo centerpiece).** Gait speed drifting down ~0.12 m/s over 6 weeks; weight −4.8% in 30d and crossing −5% *this week*; hydration goal-hit rate slipping; 2 anxiety flags. Result: significant-change flag fires, she tops the Rounding Board, her pre-meeting brief writes itself. One overdue action item ("Schedule PT eval — due 6 days ago") to make the commitment-tracking sting visible.
2. **Frank Osei, 79, SNF→AL — the rehab success arc.** Post-hip-replacement: gait speed and daily distance climbing steadily for 8 weeks, goal progress bar near 100%, all domains stable. Ties to the PT/rehab buyer thesis; gives the room a positive story and shows the dashboard isn't only a decline-detector.
3. **Marguerite Delacroix, 88, MC — the data-gap story.** Rich sensor data but stale manual domains ("Pain: last updated 41 days ago") — makes the provenance/freshness principle tangible and seeds the conversation about staff data-entry burden.

Every resident gets: 1–2 past conferences with decisions, 2–4 action items in mixed states, 3–6 notification log entries, 1–3 active goals, and (for two residents) a pending family question.

All names, photos (use illustrated avatars or a CC0 set), and data are fictional; footer disclaimer on every screen.

---

## 8. Design direction

Follow a two-pass process: write the token system below into a `tokens.(css|ts)` first, critique it against this brief, then build. One aesthetic risk, everything else disciplined.

- **Register:** calm clinical software with warmth — closer to a well-designed medical instrument than a consumer wellness app. Absolutely not: dark-mode dashboard with neon accents, cream-and-terracotta editorial, or newspaper broadsheet. This is a working tool for a 20-minute meeting in a fluorescent-lit conference room.
- **Palette (proposal, refine in build):** paper white `#FAFAF7` surfaces; deep spruce `#1E3A34` for primary text/nav (nods to GoSteady's mobility-outdoors adjacency without being literal); slate `#5C6B68` secondary; status colors desaturated and used *only* for status — moss `#4C8A5C` stable, ochre `#C98A2B` watch, brick `#B3402F` alert; one accent, glacier blue `#2E6E8E`, reserved for the "Families see this" system and family-view identity — the trust color is its own color.
- **Type:** a characterful but sober display face for resident names and zone headers (e.g., Fraunces or Newsreader at restrained weights), a highly legible UI face for everything else (e.g., Inter or Public Sans), tabular figures mandatory for all metrics. Large type scale — this gets projected and read by 60-year-old eyes at distance.
- **Signature element:** the **delta band** — every sensor card's since-last-conference delta rendered as a consistent, prominent stamp (arrow + % + "since Apr 14") with the conference date etched as a reference line in every sparkline. The product's whole argument ("care conferences should be about what changed") lives in this one repeated device. Spend the boldness here; keep the rest quiet.
- **Provenance icons:** three tiny consistent glyphs (waveform = sensor, clipboard = staff, house = family) used identically everywhere, with a legend in the footer.
- Accessibility floor: WCAG AA contrast, visible focus states, reduced-motion respected, print stylesheet for the Family Summary.
- Motion: one orchestrated moment only — cards settling in on Conference Mode load. Nothing ambient.

---

## 9. Tech stack & build order

- Vite + React 18 + TypeScript, Tailwind (tokens as CSS variables), React Router, Zustand, Recharts for sparklines/trends. No backend.
- Structure: `/src/data` (seed generator script + generated JSON), `/src/domain` (pure functions: thresholds, change score, deltas — with unit tests), `/src/components`, `/src/views`.

Build order (each step demoable):
1. Tokens, shell, seed generator, domain logic + tests.
2. Resident Conference View, Zone A (hero screen first — most demo value).
3. Zones B & C.
4. Rounding Board.
5. Conference Mode + Family Summary (incl. print styles).
6. Family View.
7. Polish pass: motion moment, empty/edge states, demo reset, disclaimer footer.

---

## 10. Demo script (5 min, Frasier care team)

1. Open Rounding Board: "This is Monday morning. Eleanor moved to the top — here's why, in numbers you can defend."
2. Click into Eleanor: delta bands since her April conference; the overdue PT eval staring at us.
3. "Generate pre-meeting brief" — 5 minutes of prep, done.
4. Run 90 seconds of Conference Mode: check an agenda item, capture a decision, assign an action item to a named owner with a date.
5. End conference → Family Summary. "This is what her daughter takes home."
6. Switch to Family View on a phone: "And this is what her daughter sees Tuesday — including whether we did what we said."
7. Close on Frank: "It also shows your rehab wins. This is the same data your PT team brags with."

Watch for: which cards they lean into, who flinches at family-visible overdue items, whether dining staff sees the nutrition entry as relief or burden.

---

## 11. Open questions (decide before or during build)

- Naming/branding: GoSteady sub-brand vs. neutral working name for discovery? (Neutral recommended — don't let the walker sensor anchor the conversation.)
- Should V1 include a lightweight "log a meal %" entry screen for dining staff, or is showing the resulting card enough for discovery?
- Family View in first Frasier demo, or hold it for meeting #2? (Build it regardless; decide live.)
- Voice/wellness card: mood + anxiety flags only, or include a transcript-snippet mock? (Snippets are compelling but raise "are you recording my mother" questions — probably defer.)
- Print vs. PDF for Family Summary in V1: print stylesheet is enough.

---

*All resident data in this prototype is fictional. Not a medical device; no diagnostic claims. General-wellness positioning consistent with GoSteady's regulatory posture (motion/activity/engagement data only).*
