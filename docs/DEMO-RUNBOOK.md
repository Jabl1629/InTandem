# Demo Runbook — InTandem

Everything needed to run either demo. **Bookmark this file, not the URLs.**

---

## The links

| What | URL |
|---|---|
| **Demo chooser** (front door) | https://jabl1629.github.io/InTandem/ |
| **EMR Demo** (projector screen) | https://jabl1629.github.io/InTandem/#/emr |
| **Console** (your laptop — controls) | https://jabl1629.github.io/InTandem/#/console |
| **Huddle Dashboard** | https://jabl1629.github.io/InTandem/#/huddle |
| Backend health check | https://intandem-emr-backend.onrender.com/api/health |
| Repo | https://github.com/Jabl1629/InTandem |
| Render dashboard | service `intandem-emr-backend` |

---

## Huddle Dashboard demo — zero setup

Open the link. That's it. No backend, no config, all data is seeded and fictional.

**Reset between runs:** "Reset demo data" in the footer.

Run of show: Rounding Board (Eleanor tops it, hover the Change Score) → click Eleanor → delta bands + overdue PT eval → "Generate pre-meeting brief" → "Start conference" → check items, capture a decision, assign an action item → "End conference" → Family Summary → "Preview family view".

---

## EMR Demo (real AI phone call) — 3-minute setup

### 1. Wake the backend first ⚠️
The Render free tier **sleeps after ~15 min idle**, and the first request after a nap takes **~50 seconds**.

**Before any demo, load the health check and wait for a response:**
https://intandem-emr-backend.onrender.com/api/health

You want `{"ok":true,"mode":"live"}`.
- `mode: "live"` → real calls armed.
- `mode: "mock"` → the API key isn't being read; check Render env vars.
- Times out / error → the service is asleep; wait and reload.

### 2. Open the console on your laptop
https://jabl1629.github.io/InTandem/#/console

Fill in the **Setup** panel:

| Field | Value |
|---|---|
| **Backend URL** | `https://intandem-emr-backend.onrender.com` → **Save & connect** |
| **Target phone** | E.164, e.g. `+17205551234` — **whoever's phone should ring** |
| **Contact first name** | the name the AI greets ("Is this ___?") |

The status pill top-right should read a green **live**. (Blank backend URL = simulation mode, which still works with no phone call — good for practice.)

The backend URL persists in that browser's localStorage, so you only do this once per machine/browser. **A new laptop or a cleared browser = redo this step.**

### 3. Open the EMR on the projector
Click **Open /emr ↗** in the console header — pops it into its own tab. Put that on the TV/projector; keep the console on your laptop.

### 4. Run it
Fire **S2 · The Clinical Change** (the hero). Phone rings → speakerphone → transcript streams into both windows → hang up → the progress note writes itself into the chart.

**Reset between runs:** "Reset demo" in the console.

---

## Scenarios

| | What | Length |
|---|---|---|
| **S2** | **The Clinical Change** — new lisinopril order. **The hero.** | ~3 min |
| **S1** | Even Tylenol — PRN administered. Proves mandate × volume. | ~45 s |
| **S3a** | The IV, Delayed → **opens a commitment badge** | ~90 s |
| **S3b** | The IV, Started → **closes it**. Locked until S3a completes. | <60 s |

The **S3a → S3b** pair is the emotional peak: the system made a promise and kept it, visibly.

---

## Run of show (5 min)

1. **Cold open** — narrate the current 12–20 min manual workflow. No screens.
2. **S2** — save the order in `/emr` → toast → phone rings → speakerphone → transcript on the projector → hang up → **the note renders**. Beat. Then the positioning line: *"Family Link asks your nurses to adopt something. This asks them to stop doing something."*
3. **S1** (optional) — the 45-second Tylenol call. *"This call is mandated, and it currently costs 15 minutes."*
4. **S3a** mid-conversation, then **S3b** unannounced later — the commitment badge closes on screen.
5. **Print the note** — Progress Notes tab → "Print / save PDF". The compliance leave-behind.
6. **Close on the Huddle Dashboard** if you want the platform story.

**The highest-impact move:** hand the DON the phone and let *them* be the daughter. Let them ask something hostile or off-script. If the agent holds its boundary and offers the nurse callback, the product is proven.

---

## If something breaks

| Symptom | Fix |
|---|---|
| First call is slow / nothing happens | Cold start — hit `/api/health`, wait for a response, retry |
| Status pill says `mock` | API key not read → check Render → Environment → `ELEVENLABS_API_KEY` |
| Status pill says `unreachable` | Backend asleep or URL typo'd. Load the health URL directly |
| Phone doesn't ring | Target phone must be **E.164** (`+1…`, no spaces/dashes/parens) |
| Note renders with blank fields | ElevenLabs agent's data-collection field IDs don't match — see below |
| Everything is broken | Console → **Reset demo**. Worst case, fall back to simulation mode (blank the Backend URL) — no calls, but the full on-screen flow still runs |

**Total-failure fallback:** clear the Backend URL → simulation mode. The chart, transcript, note, and commitment badge all still work with a canned call. Nobody in the room can tell unless a phone was supposed to ring.

**Progress-note field IDs** (must match the ElevenLabs agent's data-collection config):
`contact_identity_confirmed` · `call_outcome` · `acknowledgment_received` · `nurse_callback_requested` · `callback_topic` · `summary_for_chart`

---

## Caller ID

The outbound number may still show as unregistered until the Twilio Trust Hub / Voice Integrity clearance lands. **Pre-save it on the demo phone as "Frasier Updates"** — and narrate that as the production onboarding step rather than hiding it.

---

## Local development

```bash
cd ~/Documents/InTandem
npm install          # first time only
npm run dev          # → http://localhost:5199
```

Backend locally (optional — the deployed one works fine):
```bash
cd server
npm install
MOCK=1 npm start     # mock mode, no key needed → :3001
```

Push to `main` → GitHub Actions redeploys the site in ~1 min. Render auto-redeploys the backend on the same push.

---

*All demo data is fictional. Not a medical device. See also: [voice-vendor-hipaa-assessment.md](./voice-vendor-hipaa-assessment.md), [pcc-sandbox-integration-spec.md](./pcc-sandbox-integration-spec.md).*
