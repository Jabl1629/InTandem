# PointClickCare Integration — Research & Spec **v2**

**For:** GoSteady LLC (Jace) · AI Family Notification demo (`/emr`)
**Date:** July 2026 · supersedes v1
**Status:** Research complete incl. primary contract texts. No PCC account or agreement in place.
**Purpose:** Know exactly what PCC will require *before* walking into a room where someone asks — and decide whether the write-back path is worth taking at all.

> **v2 changed the conclusion.** v1 treated partner status as "months, gated — get there eventually." Having now read the actual Marketplace Partner Program Agreement, that path carries a **take-or-pay minimum** and a **non-compete at PCC's sole discretion**, against a company that shipped an AI suite for skilled nursing in June 2026. The recommendation is no longer "get to Path B." It is **"design the product so you don't need Path B."**

---

## 1. There is one front door

Both `become-a-partner` and `data-access-and-partnership-inquiries` render the **same intake form**. **You do not self-select a path — PCC routes you.** *(Verified by rendering the live page.)*

The form asks: company, website, address, employee count (buckets start at "1 to 5" — solo founders aren't filtered), description, **Solution Category** (~55 options), **"Do we have a mutual customer?"**, and target market.

It does **not** ask for revenue, references, SOC 2, or a security questionnaire. The real gate is qualitative and happens *after* intake.

**Two consequences:**
- **Category fit is a real gate — and it resolves fast.** PCC told Real Time Medical Systems *"within about a week"* that no category fit. Pick a live one deliberately — *Resident & Family Engagement*, *Care Coordination*, *Point of Care*, and *Risk Management* all exist, with AI monitoring vendors (Nobi, Circadia, Neteera) already listed. **A one-week answer makes applying cheap information, not a commitment.**
- **Name Frasier on the form.** "Do we have a mutual customer?" is asked up-front for a reason.

> ⚠️ **Ignore the timeline/cost figures published by integration consultancies** ("4–6 months," "$75,000–$250,000"). Those describe *a facility deploying PCC as a customer* — not a vendor becoming a partner. There is **no** public first-hand account of PCC partner onboarding duration anywhere: zero on Hacker News, Reddit, blogs, podcasts, or conference talks. That silence is itself a signal.

---

## 2. The two paths, decided

| | **Path A — USCDI / FHIR** | **Path B — Marketplace Partner** |
|---|---|---|
| Cost to you | **$0** (contractually free) | **$65/facility/mo** regular, **$125** premium |
| Cost to your customer | $65/app/facility/mo | (partner pays) |
| Timeline | **10 + 5 business days** (regulatory ceilings) | No credible public figure; months |
| Data | USCDI v1 — **read** | Rich; **write-back + webhooks** |
| Non-compete | **Barred by regulation** | **Yes — PCC's sole discretion** |
| Minimum commitment | None | **Take-or-pay** ⚠️ |
| Customer sponsor | Needed for production | **Mandatory** (Letter of Authorization) |
| Verdict | **Do this** | **Probably never** — see §4 |

---

## 3. Path A — the checklist (free, fast, regulator-protected)

### Order of operations
1. Submit the intake form (§1).
2. PCC routes you → emails a Developer Portal signup link.
3. Create the account selecting **"USCDI Connector"** — **PCC must approve it**.
4. **Enable 2FA** — the "My Apps" tab stays locked until you do.
5. Register an app.

### App registration will demand
- App name/description; **App Type** — Patient / Provider / **Bulk** (pick one)
- Launch URLs + **redirect URIs**
- **FHIR scopes in SMART-on-FHIR format** — wrong format silently yields no data access
- ⚠️ **Certificate Common Name** — *"If not provided, your application will not be approved."* The cert must come from a CA on PCC's supported list (list is behind the portal's Documentation tab — **get it early**)
- Accept the click-through T&Cs

**Development apps auto-approve** into a shared sandbox. **Production apps require PCC approval.**
Base URL: `https://connect2.pointclickcare.com/fhir/R4/{tenantId}/…` · SMART on FHIR (HL7 2021May).

### Prerequisites that are actually real
- ✅ **A registered legal entity.** PCC verifies your legal name/address against Secretary of State records. *(GoSteady LLC clears this.)*
- ❌ **No** SOC 2, HITRUST, pen test, insurance, revenue, or reference requirement — I scanned all three agreements; zero occurrences.
- **BAA is with each customer facility, not with PCC.** The T&C explicitly disclaims PCC as your business-associate counterparty.

### Timelines (regulatory ceilings, not estimates)
| Stage | Max |
|---|---|
| Authenticity verification | **10 business days** |
| Register production app after verification | **5 business days** |
| Customer enablement after their request + quote | **min 2 weeks** |

**Customer-side activation:** the facility emails `USCDIConnector@pointclickcare.com` → triggers a PCC sales quote → enablement case → activation email → you retrieve the `tenantID`. **Someone with authority to bind Frasier must sign the order form.**

### ⚠️ Do not register until you'll actually use it
Developer Portal Terms §9.4 lets PCC terminate portal/API access after **two months of inactivity** — and that clause reaches the free sandbox.

### Your regulatory leverage (real, and worth knowing)
PCC is a Certified API Developer (CHPL `15.04.04.2181.Poin.03.01.1.251208`). Under **45 CFR 170.404**, PCC **may not** condition certified-API access on fees/royalties/revenue-share, **agreeing not to compete**, exclusive dealing, or IP assignment. Information-blocking penalties reach **$1M per violation**.

In *Real Time Medical Systems v. PointClickCare*, the **Fourth Circuit affirmed an injunction against PCC** (Mar 2025, en banc denied Apr 2025), holding that merely refusing to agree doesn't qualify for the "manner exception."

Useful as leverage; not something a solo founder wants to litigate. Know it, don't lead with it.

### ⚠️ Which USCDI version? — unresolved, and it changes the product

**v1 of this doc asserted USCDI v1. That is now in doubt.**

- PCC's public FHIR page still says *"in line with the **USCDI v1** data set"* and **US Core 3.1.1** (checked July 2026).
- But **HTI-1 required certified health IT to move to USCDI v3 / US Core 6.1.0 by January 1, 2026**, *explicitly retiring USCDI v1 and US Core 3.1.1*. PCC recertified (g)(10) in **December 2025**.

So PCC's certified API is very likely on **USCDI v3 / US Core 6.1.0** and the public page is simply stale. Treat the marketing page as unreliable on this point.

**Why it matters more than anything else in this document:** US Core 6.1.0 adds **`RelatedPerson`** — *relationship, name, contact information, address*. Under v1 there is no related-person class at all, and the responsible party's phone is unavailable.

| | USCDI v1 / US Core 3.1.1 | USCDI v3 / US Core 6.1.0 |
|---|---|---|
| Resource count | ~20 | ~26 |
| `RelatedPerson` (family contact) | ❌ | ✅ |
| Also adds | — | `Coverage`, `MedicationDispense`, `ServiceRequest`, `Specimen`, `Group` |

### ⭐ First sandbox task — settle it in one request

Any conformant FHIR server publishes an authoritative CapabilityStatement:

```
GET https://connect2.pointclickcare.com/fhir/R4/{tenantId}/metadata
```

That single response gives ground truth on the US Core version, every supported resource, every search parameter, and every operation. **Do this before writing any integration code.**

Then verify, in order:
1. **Is `RelatedPerson` present and actually populated** with a usable phone? (Presence in the IG ≠ populated by PCC.)
2. Is `MedicationRequest.reasonCode` populated? (drives the fact-completeness gate)
3. Is room/bed retrievable?

**Design assumption regardless:** keep the one-time contact roster. Even if `RelatedPerson` is available, it tells you *a* relationship — not who the facility calls first, in what order, or with what consent. That is an operational decision FHIR does not model, and call consent (the TCPA requirement) is not in FHIR at all. Treat API contacts as onboarding friction removed, not as the foundation.

### The other data catch — still real
In sworn testimony, USCDI *and* the Marketplace API each supplied **under 30%** of what a clinical-analytics vendor needed. Neither version carries **ADLs, ambulation/activity data, MDS, or structured falls data**. For *this* product we need far less, but do not assume the API can support a future mobility/behavioral product.

---

## 4. Path B — read this before you ever sign

Sourced from the actual **Marketplace Partner Program Agreement v4.0** obtained from a public CSE securities filing. *Caveat: v4.0 is ~6 years old; treat as the shape of the deal, not today's numbers.*

### 🚩 Blocker 1 — Minimum Integrations Commitment (take-or-pay)
Appendix A sets a minimum number of Active Facilities. §5.2: miss it and *"the Marketplace Partner shall be required to make payment to PointClickCare for the total difference,"* and the miss *"shall constitute a material breach."*

**You pay per-facility fees for facilities you never sold.** For a pre-revenue solo founder this is the most dangerous clause in the document.

### 🚩 Blocker 2 — non-compete at PCC's sole discretion
§14: you *"will not develop, make available or otherwise commercialize products or services that are, **in PointClickCare's sole discretion**, directly competitive."*

It binds **your whole company**, not just the integrated app. Real Time refused to sign this exact clause. **PCC launched its AI-native "Advisor Suite" for skilled nursing in June 2026** — the competitive surface for an AI vendor in senior living is large and growing. This clause is a live risk to GoSteady's roadmap, not a theoretical one.

*(Note the asymmetry: §14 is barred by 170.404 for the **certified** API — Path A. It is enforceable on Path B.)*

### 📉 The ROI reality — the only publicly-dated partner case
**PainChek (ASX:PCK)** is the one vendor with a traceable timeline, because securities filings forced disclosure:
- Signed the marketplace agreement **Oct 2022**, targeting integration "during Q4 CY2022."
- First live customers **May 2023** — a ~3× slip on their own estimate (**~7 months** signature → live).
- **Two years post-signature: five facilities.** ("being used across five Canadian aged care facilities," unchanged across two consecutive quarterlies.)
- They have since diversified to Eldermark, Yardi, MatrixCare, ALIS, and AlayaCare.

**Marketplace listing is not a distribution channel.** You still sell every facility yourself — while paying per-facility fees and honoring a take-or-pay minimum. That is the case *for* Path A, made by someone else's money.

### 🚩 Blocker 3 — the liability asymmetry
**§12.2 / Developer Terms §8.4:** PCC's liability caps at fees paid *"or, if no fees apply, **$1,000**"* — against your **uncapped indemnity** (§13.1). One-sided by roughly infinity.

Also: **§9 expressly reserves PCC's right to build your product.** And **Appendix A** boxes you into a single narrow "Authorized Use Case" with explicit exclusions (the signed example bars coordinating care with *"acute care or ambulatory care settings, healthcare plans, payers, or intermediary vendors"*).

### Data ownership — no training rights
**§8.1:** data in PCC software *"**and any reports or data derived by processing such data, will be owned by PointClickCare**."* **§8.2** limits your use to contract performance, express permissions, third-party agreements, and *"internal administrative purposes related to treatment, payment, and healthcare operations."*

Training a model is arguably none of those four. Read as **no training rights on PCC-sourced data** absent an express amendment. Tellingly, PCC's own **Ambient Scribe Addendum** (Mar 2026, powered by Nabla) claims exactly that right *for itself* — to *"tune, enhance and improve"* and to *"retain, use and disclose … de-identified or anonymized data during and after termination."* PCC reserves the right it is unlikely to grant you.

*(Also: Developer Terms §2.2(o) prohibits using the API to "benchmark performance or functionality.")*

### Other terms to price in
- **Mandatory customer sponsor** — a **Letter of Authorization** from a facility before PCC enables anything.
- **You report your sales pipeline to PCC** — monthly reports incl. *"active and prospective customers, forecasting, strategy."* You are handing commercial intelligence to a potential competitor.
- **Fee confidentiality** — you may not disclose the per-facility fee to anyone, including customers. You cannot explain your own cost structure.
- **Audit** — books during term **+3 years**; >5% underpayment and you pay audit costs.
- **Term** — 14 months, auto-renew; PCC may terminate for cause any time if it decides your app *"may negatively affect PointClickCare."*
- **Post-termination** — keep serving customers **6 months** and keep paying PCC, +3 months transition.
- **Liability cap** — prior 12 months of fees, or **$1,000**.
- **Geographic** — production PHI access from **US/Canada only** (constrains contractors and cloud regions).
- ⚠️ **Breach gag** — no public statement about a breach without PCC's prior written permission. **Flag to counsel**: this sits awkwardly against HIPAA breach-notification duties.

### The reframe: we probably don't need Path B
Path B exists in our plan for exactly one reason — **writing the progress note into the chart.** But:

> **The note does not have to live inside PointClickCare to be a compliance artifact.**

What a surveyor needs is that notification *happened* and was *documented* — timestamped, attributed, with content and acknowledgment. Our system already produces a stronger record than the nurse's typical one-liner. Facilities routinely keep records across multiple systems.

So the honest architecture is:
- **Path A** supplies the trigger and clinical context (free, fast, regulator-backed).
- **We** hold the notification record, rendered as a clean note + attached transcript, printable/exportable as the leave-behind.
- **A nurse co-signs** and, if they want it in PCC, pastes it — human-in-the-loop, zero API gate.

That's not a downgrade. Auto-filing AI-generated text into a legal record is a posture many DONs will resist anyway. **`queued_for_review` was already the right clinical design; it now also dodges the take-or-pay and the non-compete.**

Revisit Path B only when there is enough revenue to absorb a minimum commitment and enough counsel to negotiate §14. PCC's own VP of partnerships conceded under oath the agreement is *"subject to modification through negotiation"* — and that modifications were made for other companies, **including three he identified as competitors.** So it is negotiable. Just not from zero leverage.

---

## 5. Recommended sequence

1. **Get Frasier to agree to be the named sponsor** *before* applying. It's asked on the intake form, it's mandatory for Path B, and it's required for Path A production. **This is the real conversion ask from the demo.**
2. **Apply via the single intake form**, citing the mutual customer and a deliberate Solution Category.
3. **Take Path A only.** Free, regulator-backed timelines, no non-compete.
4. **Answer the phone-number question (§3) first.** It gates the architecture.
5. **Keep the note in our system**, nurse co-signed. Don't sign Path B to get write-back.
6. **Don't register the Developer Portal until you'll use it** (§9.4 two-month inactivity).
7. Budget for **SOC 2 / security questionnaires / cyber liability anyway** — PCC doesn't require them, but SNF chains and their BAAs will.

---

## 6. Still unknown — ask PCC directly

**Negotiating lever:** the **$65 per App per Facility per Month** figure is published on `fhir.pointclickcare.com` as a **regulatorily-mandated fee disclosure** under §170.404 — yet PCC's *designated* mandatory-disclosures URL (`pointclickcare.com/company/certifications/`) carries no fee figure at all. If PCC quotes you materially above $65, **the published number is leverage.**

**Worth $20 if this gets serious:** the RTMS district-court docket (D. Md. 8:24-cv-00313-PX) is on PACER at $0.10/page. The joint appendix contains deposition testimony on PCC's partner process and *unredacted* fee discussion — the only place the real numbers exist publicly.

| Unknown | Notes |
|---|---|
| Current Marketplace per-facility fee | $65/$125 are 2023-era litigation figures; contractually confidential |
| **App Validation Guidelines** | Incorporated by reference, non-public, **unilaterally changeable** — the single biggest unknown in the stack |
| Your assigned **Authorized Use Case** + its exclusions | Appendix A; the binary gate. Ask before building |
| The Minimum Integrations Commitment number | Redacted in the filing. **Negotiate to zero or defer** |
| App Validation Guidelines | Not public — request |
| USCDI Connector API Access Agreement text | Not public — request |
| Whether §14 survives in the current version | Ask for a redline; barred for the certified API |
| Supported certificate authorities | Behind the portal's Documentation tab |
| API rate limits / SLA | Not published |

---

*All data in the current prototype is fictional. No PHI will be wired into this codebase without a BAA and a documented security review. Related: [voice-vendor-hipaa-assessment.md](./voice-vendor-hipaa-assessment.md).*

**Sources:** [PCC FHIR API](https://fhir.pointclickcare.com/) · [FHIR API T&C](https://fhir.pointclickcare.com/tc.html) · [Developer Portal Terms](https://developer.pointclickcare.com/spa/terms) · [Become a Partner](https://marketplace.pointclickcare.com/s/become-a-partner) · [Marketplace Partner Program Agreement v4.0 (CSE filing)](https://sedar-filings-backup.thecse.com/00047511/2108120927095589.pdf) · [Real Time Medical Systems v. PointClickCare, 4th Cir.](https://www.ca4.uscourts.gov/opinions/241773.p.pdf) · [45 CFR 170.404 / API Conditions](https://healthit.gov/condition-ccg/application-programming-interfaces) · [Partner Network Agreement T&C](http://pages.pointclickcare.com/rs/wescomsolutions/images/PointClickCare%20Partner%20Network%20Agreement%20-%20Terms%20and%20Conditions.pdf) · [PCC joins CHAI](https://pointclickcare.com/press-releases/pointclickcare-becomes-first-ltpac-focused-member-to-join-chai-enhancing-ai-driven-healthcare-collaboration/) · [K4Connect activation timing](https://support.k4connect.com/pointclickcare) · [SparkCo onboarding doc](https://healthcare.sparkco.ai/onboarding-docs)
