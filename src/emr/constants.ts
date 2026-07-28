/**
 * EMR demo constants + scenario payloads (handoff §4). Exact fact blocks are
 * the copy the ElevenLabs agent will be given per call; the sim* fields drive
 * the client-side simulation until the real backend is wired.
 */

export const FACILITY = { name: 'Frasier', callbackNumber: '(303) 555-0142' }

export const RESIDENT = {
  first: 'Margaret',
  full: 'Margaret Hollis',
  room: '214',
  mrn: 'FR-0002140',
  dob: '03/02/1938',
  age: 87,
  sex: 'F',
  allergies: 'Penicillin (rash)',
  code: 'DNR',
  diet: 'Regular, no added salt',
  attending: 'Alan Reyes, MD',
}

export const CONTACT = { first: 'Susan', full: 'Susan Hollis', relation: 'daughter' }

export type CallType = 'initial_update' | 'delay_update' | 'completion_update'

export interface TranscriptTurn {
  speaker: 'assistant' | 'contact'
  text: string
}

export interface Extraction {
  contact_identity_confirmed: boolean
  call_outcome: string
  acknowledgment_received: boolean
  nurse_callback_requested: boolean
  callback_topic?: string
  summary_for_chart: string
}

export interface Scenario {
  id: string
  label: string
  callType: CallType
  targetSeconds: number
  emrTrigger: string // human label of the chart action
  noteTitle: string
  order?: {
    kind: 'Medication' | 'eMAR' | 'Pharmacy status'
    drug: string
    dose: string
    route: string
    frequency: string
    provider: string
    indication: string
  }
  firstMessage: string
  facts: string
  /** simulation only */
  simTranscript: TranscriptTurn[]
  simExtraction: Extraction
}

const fm = (mid: string) =>
  `Hi, this is the care team's automated assistant calling from ${FACILITY.name} — I'm an AI, and this call is recorded. ${mid} Is this ${CONTACT.first}?`

export interface VitalReading {
  label: string
  daysAgo: number
  time: string
  systolic: number
  diastolic: number
  pulse: number
}

/**
 * Margaret's recent blood pressures. SINGLE SOURCE OF TRUTH — rendered in the
 * chart's Vitals tab and quoted verbatim by the agent in S2. If these change,
 * update the S2 `facts` block to match, or the projector and the phone call
 * will disagree in front of the room.
 */
export const RECENT_VITALS: VitalReading[] = [
  { label: 'Yesterday', daysAgo: 1, time: '07:12', systolic: 163, diastolic: 93, pulse: 79 },
  { label: '2 days ago', daysAgo: 2, time: '07:05', systolic: 162, diastolic: 92, pulse: 81 },
  { label: '3 days ago', daysAgo: 3, time: '06:58', systolic: 155, diastolic: 90, pulse: 78 },
]

/** Her documented usual range, for contrast on the chart and in the call. */
export const BP_BASELINE = '130/80'

export const SCENARIOS: Record<string, Scenario> = {
  // ── S2 — HERO ──────────────────────────────────────────────────────────
  S2: {
    id: 'S2',
    label: 'The Clinical Change',
    callType: 'initial_update',
    targetSeconds: 180,
    emrTrigger: 'New medication order — Lisinopril 5 mg PO daily',
    noteTitle: 'Family Notification — Medication Change',
    order: {
      kind: 'Medication',
      drug: 'Lisinopril 5 mg tablet',
      dose: '5 mg',
      route: 'PO (by mouth)',
      frequency: 'Once daily — evening med pass',
      provider: 'Alan Reyes, MD',
      indication: 'Blood pressure above usual range',
    },
    firstMessage: fm("I'm calling with a routine update about Margaret."),
    facts: `WHAT HAPPENED
Dr. Alan Reyes reviewed Margaret's blood pressure during rounds this morning and started a new blood pressure medication.

THE MEDICATION
- Lisinopril, 5 milligrams, once a day, by mouth
- Starts with this evening's medication pass, around 5 PM
- Ordered by Dr. Alan Reyes

WHY
Her blood pressure has been running above her usual range over the past week.

THE NUMBERS — her three most recent readings, recorded by nursing
- Yesterday: 163 over 93
- Two days ago: 162 over 92
- Three days ago: 155 over 90
Her usual range is around 130 over 80. All three readings are above that range,
and they have not come down on their own.

HOW TO USE THE NUMBERS
State them exactly as written. Say them as "163 over 93." Do not round, average,
generalize to "the 160s," or describe a trend the readings do not show. If you are
asked for a reading you do not have above, say you only have the last three and
offer the nurse callback.

IF ASKED "IS THAT DANGEROUS?" OR "IS THAT HIGH?"
Do not characterize how dangerous a number is — that is clinical judgment and it is
out of scope. You may say the readings are above her documented usual range and that
this is why Dr. Reyes started the medication. For anything about risk, urgency, or
what the numbers mean for her, offer the nurse callback.

IF ASKED "WHY NOW?"
The readings stayed above her usual range for three days in a row rather than
returning on their own, so Dr. Reyes started treatment during rounds this morning.

IS THIS AN EMERGENCY? — NO
Routine adjustment. No fall, no injury, no symptoms. She is comfortable and her routine is unchanged.

WHAT NURSING WILL DO
- Check her blood pressure daily for the next week
- Watch for dizziness or lightheadedness, especially standing up

OUT OF SCOPE — OFFER THE CALLBACK
Side-effect lists, interactions, whether she should be on it, prognosis.`,
    simTranscript: [
      { speaker: 'assistant', text: `Hi, this is the care team's automated assistant calling from Frasier — I'm an AI, and this call is recorded. I'm calling with a routine update about Margaret. Is this Susan?` },
      { speaker: 'contact', text: `Yes, this is Susan.` },
      { speaker: 'assistant', text: `Thank you. Dr. Reyes reviewed Margaret's blood pressure during rounds this morning and started a new blood pressure medication — lisinopril, five milligrams, once a day. It starts with this evening's medication pass.` },
      { speaker: 'contact', text: `Okay — is everything alright? Did something happen?` },
      { speaker: 'assistant', text: `No emergency at all. Her blood pressure has been running above her usual range this past week, so this is a routine adjustment. There was no fall and no symptoms — she's comfortable, and her day is unchanged.` },
      { speaker: 'contact', text: `What have her numbers actually been?` },
      { speaker: 'assistant', text: `Her three most recent readings were 163 over 93 yesterday, 162 over 92 two days ago, and 155 over 90 three days ago. Her usual range is around 130 over 80.` },
      { speaker: 'contact', text: `Is that dangerous?` },
      { speaker: 'assistant', text: `I'm not able to speak to how risky a particular number is — that's a clinical judgment. What I can tell you is that those readings are above her usual range, and they stayed there for three days rather than coming back down on their own, which is why Dr. Reyes started the medication this morning. If you'd like to talk through what the numbers mean for her, I can have a nurse call you back.` },
      { speaker: 'contact', text: `No, that makes sense. Thank you.` },
      { speaker: 'contact', text: `Alright. What will you be keeping an eye on?` },
      { speaker: 'assistant', text: `Nursing will check her blood pressure daily for the next week and watch for any dizziness when she stands up. If you'd like to talk through the medication itself, I can have a nurse call you back.` },
      { speaker: 'contact', text: `No, that's alright. Thank you for letting me know.` },
      { speaker: 'assistant', text: `Of course. I'll note that you were informed. You can always reach the care team at the facility number. Take care, Susan.` },
    ],
    simExtraction: {
      contact_identity_confirmed: true,
      call_outcome: 'completed',
      acknowledgment_received: true,
      nurse_callback_requested: false,
      summary_for_chart:
        'New medication started: lisinopril 5 mg PO daily (Dr. Reyes), for blood pressure sustained above her usual range (recent readings 163/93, 162/92, 155/90; baseline ~130/80). Routine, non-emergent. Daughter asked for the specific readings and whether they were dangerous; readings were provided, risk interpretation was deferred as out of scope, and a nurse callback was offered and declined. Nursing to check BP daily × 1 week and monitor for orthostatic dizziness. No other changes to medications, diet, activity, room, or level of care.',
    },
  },

  // ── S1 — Even Tylenol (opener) ─────────────────────────────────────────
  S1: {
    id: 'S1',
    label: 'Even Tylenol',
    callType: 'initial_update',
    targetSeconds: 45,
    emrTrigger: 'eMAR — Tylenol 500 mg PRN administered 2:15 PM',
    noteTitle: 'Family Notification — PRN Medication',
    firstMessage: fm("I'm calling with a quick routine update about Margaret."),
    facts: `WHAT HAPPENED
The nursing team gave Margaret a dose of Tylenol this afternoon for mild knee discomfort, as allowed by her existing as-needed order from Dr. Alan Reyes.

THE MEDICATION
- Tylenol (acetaminophen), 500 milligrams, by mouth, one dose at 2:15 PM

IS THIS AN EMERGENCY? — NO
Routine. She mentioned her knee was sore after activity time. She is comfortable now.

WHAT NURSING WILL DO
- Check in this evening to make sure the discomfort has eased

OUT OF SCOPE — OFFER THE CALLBACK
Why her knee hurts; anything about her other medications or conditions.`,
    simTranscript: [
      { speaker: 'assistant', text: `Hi, this is the care team's automated assistant calling from Frasier — I'm an AI, and this call is recorded. I'm calling with a quick routine update about Margaret. Is this Susan?` },
      { speaker: 'contact', text: `Yes.` },
      { speaker: 'assistant', text: `Margaret had some mild knee soreness after activity time, so nursing gave her one dose of Tylenol at 2:15 this afternoon, under her existing as-needed order. She's comfortable now.` },
      { speaker: 'contact', text: `Oh — okay, thanks for letting me know.` },
      { speaker: 'assistant', text: `Of course. Nursing will check in this evening to make sure it's eased. Nothing else has changed. Take care, Susan.` },
    ],
    simExtraction: {
      contact_identity_confirmed: true,
      call_outcome: 'completed',
      acknowledgment_received: true,
      nurse_callback_requested: false,
      summary_for_chart:
        'PRN acetaminophen 500 mg PO given 2:15 PM for mild knee discomfort per existing order (Dr. Reyes). Resident comfortable; nursing to reassess this evening. No other changes.',
    },
  },

  // ── S3a — The IV, Delayed ──────────────────────────────────────────────
  S3a: {
    id: 'S3a',
    label: 'The IV, Delayed',
    callType: 'delay_update',
    targetSeconds: 90,
    emrTrigger: 'Pharmacy status — IV delivery delayed',
    noteTitle: 'Family Notification — Schedule Change',
    firstMessage: fm('I have a quick scheduling update about Margaret — nothing urgent.'),
    facts: `THE ORIGINAL PLAN
Margaret was scheduled to start an IV antibiotic this morning at 8:30 AM, ordered by Dr. Alan Reyes, and the family was told to expect this.

WHAT CHANGED
The pharmacy that delivers the facility's IV medications is running behind today. The medication has not yet arrived.

THE NEW ESTIMATE
Current expected start is this afternoon, around 4 to 5 PM.

IS THIS AN EMERGENCY? — NO
A delivery issue, not a change in her condition. Nursing confirmed with Dr. Reyes that the delay is acceptable. She is comfortable.

THE COMMITMENT
You will call the family again when the IV has started.`,
    simTranscript: [
      { speaker: 'assistant', text: `Hi, this is the care team's automated assistant calling from Frasier — I'm an AI, and this call is recorded. I have a quick scheduling update about Margaret — nothing urgent. Is this Susan?` },
      { speaker: 'contact', text: `Yes, go ahead.` },
      { speaker: 'assistant', text: `Margaret's IV antibiotic was scheduled for this morning, but the pharmacy delivery is running behind today. The new estimate is this afternoon, around four to five o'clock.` },
      { speaker: 'contact', text: `Is that a problem for her?` },
      { speaker: 'assistant', text: `It's a delivery delay, not a change in her condition — nursing confirmed with Dr. Reyes that the delay is fine, and she's comfortable. I'll call you again as soon as the IV has actually started.` },
      { speaker: 'contact', text: `Thank you, I'd appreciate that.` },
    ],
    simExtraction: {
      contact_identity_confirmed: true,
      call_outcome: 'completed',
      acknowledgment_received: true,
      nurse_callback_requested: false,
      summary_for_chart:
        'Family notified IV antibiotic start delayed (pharmacy delivery) from 8:30 AM to ~4–5 PM. Dr. Reyes aware; delay clinically acceptable; resident comfortable. Commitment made to call family when IV starts.',
    },
  },

  // ── S3b — The IV, Started (closes the commitment) ──────────────────────
  S3b: {
    id: 'S3b',
    label: 'The IV, Started',
    callType: 'completion_update',
    targetSeconds: 50,
    emrTrigger: 'eMAR — IV administration recorded 4:50 PM',
    noteTitle: 'Family Notification — Follow-up (commitment closed)',
    firstMessage: fm('Just calling with the follow-up I promised about Margaret — good news.'),
    facts: `THE PROMISE BEING CLOSED
Earlier today you told the family the IV was delayed and committed to calling when it started.

WHAT HAPPENED
Margaret's IV antibiotic started at 4:50 PM. It went smoothly, and she is comfortable. Nursing is monitoring her as planned.

IS THIS AN EMERGENCY? — NO. Keep under one minute.`,
    simTranscript: [
      { speaker: 'assistant', text: `Hi, this is the care team's automated assistant calling from Frasier — I'm an AI, and this call is recorded. Just calling with the follow-up I promised about Margaret — good news. Is this Susan?` },
      { speaker: 'contact', text: `Yes — oh, did it start?` },
      { speaker: 'assistant', text: `It did — Margaret's IV antibiotic started at 4:50 this afternoon. It went smoothly and she's comfortable. Nursing is monitoring her as planned.` },
      { speaker: 'contact', text: `Thank you so much for calling back. That means a lot.` },
      { speaker: 'assistant', text: `Of course, Susan. That's what we're here for. Take care.` },
    ],
    simExtraction: {
      contact_identity_confirmed: true,
      call_outcome: 'completed',
      acknowledgment_received: true,
      nurse_callback_requested: false,
      summary_for_chart:
        'Follow-up call: IV antibiotic started 4:50 PM, administered without issue, resident comfortable. Earlier delay commitment closed. Routine monitoring continues per care plan.',
    },
  },
}

export const SCENARIO_ORDER = ['S2', 'S1', 'S3a', 'S3b'] as const
