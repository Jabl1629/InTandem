# Voice AI Vendor — HIPAA / BAA Assessment

**For:** GoSteady LLC (Jace) · AI Family Notification (`/emr`)
**Date:** July 2026
**Question:** ElevenLabs requires an enterprise contract (~$50k+) to sign a BAA. What replaces it, and what does the swap cost us?
**Answer:** **Retell AI.** Self-serve BAA at no fee, ~1 day of migration, one file changes.

---

## 1. The ElevenLabs problem is worse than the price

Verified on [ElevenLabs' HIPAA docs](https://elevenlabs.io/docs/eleven-agents/legal/hipaa):

1. *"Execution of a BAA … is only available for Enterprise tier subscriptions."*
2. The BAA **must be paired with Zero Retention Mode**, under which they store none of: **conversation transcripts, audio recordings, tool calls and results, data analytics, system logs.**
3. Only LLMs from providers ElevenLabs holds a BAA with are available as preconfigured options.

**Why #2 is decisive.** Our receipt pipeline polls `GET /v1/convai/conversations/{id}` and reads `transcript` + `analysis.data_collection_results`. **The progress note is assembled from exactly those two fields.** Under Zero Retention Mode they don't exist.

> So ElevenLabs isn't merely expensive for production — running it *compliantly* deletes the data the money screen is made of. Paying the $50k would still require re-architecting to real-time webhooks.

**Conclusion:** ElevenLabs is a fine **demo** vendor (fictional data, no PHI, no BAA needed). It is not a production vendor for us at any price we'd pay.

---

## 2. What a BAA actually costs, by vendor

| Vendor | BAA? | Gate | Cost of the BAA |
|---|---|---|---|
| **Retell AI** | ✅ | **Self-serve, all plans** | **$0** ✅ verified |
| AWS | ✅ | Self-serve (Artifact) | $0 |
| Microsoft Azure | ✅ | Automatic via DPA | $0 |
| Google Cloud | ✅ | Click-through | $0 — *but disqualified, §4* |
| OpenAI | ✅ | Approval, not tier | $0 |
| Vapi | ✅ | Paid add-on | **$2,000/mo** |
| LiveKit Cloud | ✅ | Scale tier | $500/mo |
| Twilio | ✅ | **Security/Enterprise Edition** | Sales-gated ⚠️ |
| Bland AI · ElevenLabs · Cartesia · Deepgram | ✅ | **Enterprise only** | Custom ❌ |

**Trap:** Bland, ElevenLabs, Cartesia, Deepgram and Synthflow all market HIPAA compliance publicly while gating the actual BAA behind Enterprise. Marketing ≠ a signable agreement.

---

## 3. Recommendation — Retell AI

Verified on [Retell's compliance docs](https://docs.retellai.com/general/compliance): BAA **self-signable at no additional fee**, plus per-agent retention (1 day–2 years), a **PII-exclusion mode**, and signed/secured recording URLs.

Cost ≈ **$0.13–0.17/min**, no platform fee, no contract.

### Migration is a one-file change
`server/index.js` maps almost 1:1:

| Today (ElevenLabs) | Retell |
|---|---|
| `POST /v1/convai/twilio/outbound-call` | `POST /v2/create-phone-call` |
| `agent_id` + `agent_phone_number_id` | `override_agent_id` + `from_number` |
| `conversation_initiation_client_data.dynamic_variables` | `retell_llm_dynamic_variables` |
| first-message override | `agent_override.retell_llm.begin_message` |
| poll `GET /convai/conversations/{id}` | `GET /v2/get-call/{id}` or `call_analyzed` webhook |
| `transcript[] {role, message}` | `transcript_object[] {role, content}` |
| `analysis.data_collection_results` | `call_analysis.custom_analysis_data` |
| `status: done \| failed` | `call_status: ended \| error` |

Our six extraction fields map onto Retell's four custom-analysis types (Text/Selector/Boolean/Number). Retell can even use **ElevenLabs as its TTS provider**, so the voice can stay the same.

**Keep polling, not webhooks.** Retell offers `call_analyzed` webhooks, but our SSE design is deliberately outbound-HTTPS-only so it survives locked-down facility WiFi. Polling `get-call` preserves that. (Retell also emits `transcript_updated` — a possible future path to the live-transcript feature we shelved.)

---

## 4. Runners-up

- **Azure (ACS + Voice Live)** — cheapest at scale (~$0.03–0.06/min), BAA free and automatic, first-party outbound PSTN. 2–4 weeks of work. ⚠️ **Preview features are contractually excluded from the BAA** — confirm ACS/Speech/Voice Live appear in Appendix A of the Service Trust Portal.
- **AWS (Connect + Nova Sonic)** — ~$0.06/min, self-serve BAA, and `gosteady-portal` is already AWS/CDK so the BAA may already be executed and the ops model is familiar. 2–4 weeks.
- **Vapi** — $2,000/mo for HIPAA is nonsensical pre-revenue (~32,800 AWS-equivalent minutes/month before AWS is even more expensive).
- **Google Cloud — disqualified.** No first-party programmatic outbound PSTN (Phone Gateway is inbound-only), *and* Vertex/Gemini Live don't appear by name on the HIPAA covered-products list.

---

## 5. Two traps

**Don't bring the 833 number to the new platform via SIP.** Twilio signs BAAs only on **Security or Enterprise Edition** — a self-serve Twilio account is *not* BAA-covered. Porting our own number in makes us the Twilio customer again and re-inherits that gate. **Use the platform's managed numbers** so their BAA covers the telephony leg.

**⚠️ TCPA may exceed HIPAA as the legal risk.** The FCC treats AI-generated voices in outbound calls as *"artificial."* For a product that calls residents' family members, this is potentially larger exposure than the BAA question — and it's **not** solved by any vendor choice. Likely mitigation is prior express consent from the responsible party, captured at facility onboarding. **Raise with counsel** alongside the open Steady review.

---

## 6. Timing

**Do not change the stack before the Frasier demo.** The demo runs on fictional data — no PHI, no compliance exposure — and destabilizing a working demo before a high-stakes meeting is a bad trade. **Migrate immediately after**, unless the meeting is far enough out to re-test thoroughly.

What this buys in the room: when someone asks *"what about privacy — this is health information,"* the answer is concrete — signed BAA, configurable retention, PII exclusion, US/Canada data residency — instead of "I'd have to check."

---

## 7. Confirm before signing

1. **Retell's subprocessor list in writing**, and which LLM/TTS providers are BAA-covered. Their pricing page markets "custom compliance terms" under Enterprise, which contradicts their docs — resolve in writing.
2. **Vapi** (if reconsidered): pricing page currently says $2,000/mo HIPAA + $1,000/mo ZDR; older sources say $1,000. HIPAA mode and ZDR appear mutually exclusive.
3. **Telnyx** claims the *conduit exception* and says it generally doesn't require a BAA — a poor fit for a product that stores transcripts and runs LLM inference. Contradicts their marketing; resolve before relying on it.
4. **Anthropic's BAA excludes Console and Workbench** — relevant to the Steady coach on Claude Haiku 4.5.
5. **BAAs are with the facility too.** Per PCC's FHIR T&C, we are not PCC's downstream business associate — we need a BAA with **each customer facility** independent of any vendor BAA. See [pcc-sandbox-integration-spec.md](./pcc-sandbox-integration-spec.md).

---

**Sources:** [Retell compliance](https://docs.retellai.com/general/compliance) · [Retell pricing](https://www.retellai.com/pricing) · [Retell create-phone-call](https://docs.retellai.com/api-references/create-phone-call) · [ElevenLabs HIPAA](https://elevenlabs.io/docs/eleven-agents/legal/hipaa) · [Twilio HIPAA Accounts](https://www.twilio.com/docs/iam/twilio-editions/hippa) · [Vapi pricing](https://vapi.ai/pricing) · [Bland pricing](https://www.bland.ai/pricing) · [AWS HIPAA](https://aws.amazon.com/compliance/hipaa-compliance/) · [Azure HIPAA](https://learn.microsoft.com/en-us/azure/compliance/offerings/offering-hipaa-us) · [Azure Voice Live](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live) · [Google Cloud HIPAA](https://cloud.google.com/security/compliance/hipaa) · [LiveKit HIPAA](https://livekit.com/legal/hipaa)
