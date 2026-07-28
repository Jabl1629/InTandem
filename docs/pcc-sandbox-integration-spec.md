# PointClickCare Integration — Research & Spec v1

**For:** GoSteady LLC (Jace) · AI Family Notification demo (`/emr`)
**Date:** July 2026
**Status:** Research complete, spec proposed — no PCC account/agreement in place yet
**Question this answers:** *"What does it actually take to run this demo against real PointClickCare data instead of our fake chart — and what can we show at Frasier along the way?"*

---

## 1. The headline finding

PointClickCare has **two different API surfaces with very different access models.** Nearly every planning mistake here comes from conflating them.

| | **USCDI Connector (FHIR)** | **Partner / Marketplace APIs ("Amplify")** |
|---|---|---|
| Portal | `fhir.pointclickcare.com` | `developer.pointclickcare.com` |
| Why it exists | ONC / Cures Act regulatory mandate | Commercial partner ecosystem (200+ integrations) |
| Standard | SMART on FHIR, OAuth2, US Core 3.1.1 / USCDI v1 | Proprietary REST |
| Scope | **Read** of a defined clinical dataset | Patient data, **write-back**, UI tools, **webhooks/notifications** |
| Sandbox | **Shared sandbox; "Development" apps are auto-approved** | Gated behind partner status |
| Access gate | Developer Portal account + 2FA + app registration | **Execute Partner Network Agreement + be accepted** (tiered program) |
| Realistic time to access | Days–weeks | Months (commercial + security review) |

**The consequence for us:**

- The **read** half of our demo (resident, contact, med order) maps to the FHIR sandbox — reachable **soon**.
- The **write** half — posting the family-notification progress note into the chart, *our money screen* — is **not** in the USCDI FHIR read API. It requires partner-tier API access.

> Evidence that write-back exists at partner tier: third-party ambient-scribe vendors integrate by API to write into PointClickCare "progress notes, assessments, interdisciplinary notes, and care plans." So the capability is real — it's an access question, not a technical one.

**Strategic read:** we can get a *genuinely PCC-connected* demo far sooner than we can get a *fully round-tripping* one. Plan the demo narrative around that seam rather than waiting on partner status.

---

## 2. What the demo actually needs from PCC

Four capabilities, in dependency order:

| # | Capability | Why | Surface | Reachable in sandbox? |
|---|---|---|---|---|
| **A** | **Trigger** — detect a new med order / eMAR admin | Fires the call; the "chart action → phone rings" magic | Webhook (partner) or FHIR polling | ⚠️ Polling yes, webhook no |
| **B** | **Clinical context** — med, dose, route, ordering physician, reason | Populates `scenario_facts` for the agent | FHIR `MedicationRequest`, `Practitioner` | ✅ Yes |
| **C** | **Who to call** — responsible party name, relation, **phone** | Without this there is no call | FHIR `Patient.contact` / `RelatedPerson` | ⚠️ **Biggest unknown — verify first** |
| **D** | **Write-back** — file the progress note into the chart | The compliance artifact; the demo's closing beat | Partner API only | ❌ No |

**C is the sleeper risk.** USCDI v1 is oriented around the *patient*, not their emergency contact. Whether PCC's FHIR sandbox exposes a usable responsible-party **phone number** determines whether an end-to-end automated trigger is even possible without partner access. **This is the single highest-value thing to test in week one** — it's cheap to check and it gates the architecture.

---

## 3. Trigger options (A), compared

| Option | Latency | Access needed | Verdict |
|---|---|---|---|
| **PCC webhooks** | Seconds | Partner tier | ✅ The production answer. PharMerica's Marketplace integration uses PCC's webhook service for real-time census events, so the mechanism is proven. |
| **FHIR polling** (`MedicationRequest` since *t*) | ~30–60s | **Sandbox** | ✅ Good enough to *prove the pattern* now. Not the production answer. |
| **Data Relay** | ~1 hour (scheduled incremental extracts) | Licensed product | ❌ Wrong tool — it's an analytics/BI feed. Hourly kills the demo's causality. |
| **HL7 v2 interface** (ORM/ADT via interface engine) | Seconds | Facility-side, not PCC-partner | 🤔 Underrated fallback. Many LTPAC sites already run an interface engine; this can sidestep the partner queue entirely. Worth asking Frasier's IT what exists. |

**Recommendation:** poll in the sandbox to prove it; design the adapter so webhooks drop in later without touching app code; keep HL7 in the back pocket as the "we don't have to wait for PCC" answer.

---

## 4. Architecture: put an EHR adapter in now

The single most valuable engineering change, and it's cheap today.

Right now `/emr` is both the **UI** and the **data source** (fake chart + local store). Before touching PCC, split them:

```
                    ┌───────────────────────────────┐
                    │  EhrAdapter (interface)       │
                    │  ─────────────────────────    │
   /emr UI ───────► │  listResidents()              │
   backend  ───────►│  getResident(id)              │
                    │  getResponsibleParty(id)      │  ← the risky one (C)
                    │  getRecentOrders(id)          │
                    │  onChange(cb)  // poll|webhook │  ← trigger (A)
                    │  postProgressNote(note)       │  ← write-back (D)
                    └───────────────────────────────┘
                        ▲            ▲            ▲
                 ┌──────┴─────┐ ┌────┴──────┐ ┌───┴────────┐
                 │  demo      │ │ pcc-      │ │ pcc-       │
                 │ (today,    │ │ sandbox   │ │ production │
                 │  fictional)│ │ (FHIR RO) │ │ (partner)  │
                 └────────────┘ └───────────┘ └────────────┘
```

Rules:
- **The adapter lives server-side only.** PCC OAuth tokens must never reach the browser — same discipline as the ElevenLabs key.
- `postProgressNote()` returns a **status**, not just success: `filed` | `queued_for_review` | `unsupported`. That single design choice is what lets Phase 2 (below) degrade gracefully instead of looking broken.
- The demo adapter stays forever — it's the offline/backup path when facility WiFi fails.

**Why now:** doing this before PCC access means Phase 2 is a config change, not a rewrite. Doing it after means threading FHIR through UI code.

---

## 5. Phased plan

### Phase 0 — today (done)
Fictional `Demo EHR`, self-contained, real AI calls. **Keep this as the demo default** — it never fails on stage.

### Phase 1 — "Connected to PointClickCare Sandbox" (weeks, no partner agreement)
1. Register on the Developer Portal → select **USCDI Connector** → 2FA → create a **Development** app (auto-approved into the shared FHIR sandbox).
2. Implement `pcc-sandbox` adapter: SMART on FHIR OAuth2 → read `Patient`, `RelatedPerson`/`contact`, `MedicationRequest`, `Practitioner`.
3. Poll `MedicationRequest` for new orders → fire the existing call pipeline unchanged.
4. Note write-back → `queued_for_review` (Phase 2 flips it to `filed`).

**What this earns at Frasier:** the chart on screen is populated by *real PointClickCare API responses over real OAuth*, not our JSON. That is a large, visible credibility jump — and it's honest about the remaining gap.

**Demo device worth building:** a "**View source payload**" toggle that shows the raw FHIR JSON behind a chart field. For a technical DON or an IT stakeholder, watching real `MedicationRequest` JSON resolve into the order that triggered the call is more persuasive than any slide.

### Phase 2 — partner write-back (months, gated)
1. Submit "Become a Partner" → execute the **Partner Network Agreement** → acceptance.
2. Security/architecture review (assume they ask about the AI-voice subprocessor — see §7).
3. Implement `postProgressNote()` against the partner API; `queued_for_review` → `filed`.
4. Marketplace listing if we go commercial.

**Accelerant:** PCC partner queues move faster with a **named provider sponsor** pulling the integration through. Frasier asking their PCC rep for this carries more weight than a vendor cold-applying. If the demo lands, *that ask is the real conversion event* — worth naming explicitly in the debrief.

---

## 6. Data mapping (Phase 1 target)

| Our field | FHIR source | Confidence |
|---|---|---|
| `resident_full_name`, `resident_first_name` | `Patient.name` | High |
| `resident_room` | `Patient` extension / `Location` | ⚠️ Med. LTPAC room/bed is often non-standard |
| `contact_full_name`, `contact_relation` | `Patient.contact` / `RelatedPerson.relationship` | Med |
| **`target_phone`** | `Patient.contact.telecom` / `RelatedPerson.telecom` | ⚠️ **Low — verify first (§2C)** |
| Medication, dose, route, frequency | `MedicationRequest.medication*`, `.dosageInstruction` | High |
| Ordering physician | `MedicationRequest.requester` → `Practitioner` | High |
| Documented reason | `MedicationRequest.reasonCode` / `reasonReference` | ⚠️ Med. Frequently unpopulated in practice |
| `facility_name` | `Organization` | High |

**Design consequence:** the agent's `scenario_facts` block must tolerate **missing fields**. Our current scenarios are hand-authored and complete; real orders will not be. The agent prompt already has the right instinct ("say so once, offer callback, never guess") — but we'd need a **fact-completeness gate**: if reason or dose is missing, either don't auto-call or route to a human to complete it. *A call that says "I don't know why" is worse than no call.* This is a genuine product requirement, not an edge case.

---

## 7. Compliance — the thing that actually bites

Phase 0 has a hard constraint: **no PHI, ever.** Phase 1 keeps that (sandbox data is synthetic). **Phase 2 breaks it**, and that changes the project's nature:

- **PCC sandbox = synthetic data.** Safe. No BAA needed to *test*.
- **Any production PCC data = PHI.** Triggers HIPAA Security Rule, a **BAA with the facility**, and vendor due diligence.
- **⚠️ The AI voice vendor becomes a subprocessor handling PHI.** The call itself contains resident name + medication + clinical reason. Recordings and transcripts are PHI at rest. **We would need a BAA with ElevenLabs** (and to confirm their HIPAA posture/tier supports one) before a single production call. **Verify before promising anything to Frasier** — this is the most likely hard blocker in the whole plan, and it's not a PCC problem.
- **The recorded-call disclosure** already in the agent's opener is good practice and should survive to production; two-party consent states make it mandatory.
- **The note is a legal record.** Auto-filing AI-generated text into a chart that surveyors read is a real risk posture. Which leads to:

**A limitation worth reframing as the design:** `queued_for_review` — the note renders complete, a nurse reviews and co-signs, *then* it files. That's not a Phase-1 compromise, it's arguably the correct clinical design, and it's a strong answer to the surveyor question in the debrief ("what would your surveyor say about this note?"). **Lead with it as intentional.**

---

## 8. Open questions — to resolve, in priority order

**Test in the sandbox (cheap, fast, gates architecture):**
1. **Does `Patient.contact`/`RelatedPerson` expose a usable responsible-party phone?** ← *do this first*
2. Is `MedicationRequest.reasonCode` populated in sandbox data? (drives the fact-completeness gate)
3. Is room/bed retrievable in a usable form?
4. Polling latency + rate limits on `MedicationRequest`.

**Ask PointClickCare:**
5. Which partner tier unlocks progress-note write-back, and what's the realistic approval timeline?
6. Are webhooks available for **medication/order** events, or only census/ADT?
7. Any AI-specific partner requirements (disclosure, model governance, subprocessors)?
8. Fees — partner program and/or per-customer integration.

**Ask Frasier:**
9. Do they run an **interface engine** (HL7) today? Could sidestep the partner queue entirely.
10. Would they sponsor the partner request with their PCC rep? *(the real conversion ask)*

**Ask ElevenLabs:**
11. **Will they sign a BAA, and at what tier?** (blocks all production)

---

## 9. Recommendation

1. **Build the EHR adapter seam now** (~half a day). Cheap, and it de-risks every later phase.
2. **Register for the FHIR sandbox this week** and answer question #1. It's a days-long task that determines whether the automated trigger is even viable pre-partnership.
3. **Do not gate the Frasier demo on any of this.** Phase 0 already works and never fails on stage. Show the fictional chart; if Phase 1 lands in time, add the "Connected to PCC Sandbox" badge and the FHIR payload toggle as the technical-credibility beat.
4. **Convert the demo into the partner ask.** The most valuable outcome of the Frasier meeting isn't a pilot — it's Frasier telling their PCC rep they want this integration. That's what collapses the Phase 2 timeline.
5. **Resolve the ElevenLabs BAA question before promising production.** It's the likeliest hard stop, and it's better to know now.

---

*All data in the current prototype is fictional. No PHI has been or will be wired into this codebase without a BAA and a documented security review.*

**Sources:** [PCC Developer Program](https://developer.pointclickcare.com/spa/why-pcc) · [PCC FHIR API / USCDI Connector](https://fhir.pointclickcare.com/) · [PCC Marketplace — Become a Partner](https://marketplace.pointclickcare.com/s/become-a-partner) · [Partner Network Agreement T&C](http://pages.pointclickcare.com/rs/wescomsolutions/images/PointClickCare%20Partner%20Network%20Agreement%20-%20Terms%20and%20Conditions.pdf) · [PharMerica PCC API integration (webhooks)](https://pharmerica.com/pccapi/) · [PCC Data Relay](https://pointclickcare.com/products/data-relay-senior-living/) · [Ambient scribe write-back precedent](https://www.sully.ai/blog/how-to-add-an-ai-scribe-to-pointclickcare-ehr)
