# Deploying the EMR demo backend (Render)

The front-end (the two demos) lives on GitHub Pages. The **real phone calls**
need this small Express server, which holds your ElevenLabs key and can't run on
static Pages. Deploy it once on Render; after that it auto-deploys on `git push`
just like Pages.

Everything here is **your** step — I never see your key.

## 1. Create the service (one time)

1. Sign in at **https://render.com** with your GitHub account (free tier is fine).
2. **New → Blueprint** → pick the **`Jabl1629/InTandem`** repo. Render reads
   [`render.yaml`](../render.yaml) and creates a web service named
   `intandem-emr-backend` (rooted in `server/`).
3. Click **Apply**. It builds and starts (`npm install` → `npm start`).

## 2. Set the secret env vars (Render → the service → Environment)

| Key | Value |
|---|---|
| `ELEVENLABS_API_KEY` | your ElevenLabs API key |
| `ELEVENLABS_AGENT_ID` | the agent's id (ElevenLabs dashboard) |
| `ELEVENLABS_PHONE_NUMBER_ID` | the imported Twilio number's id |
| `DEFAULT_TARGET_PHONE` | fallback number to call, E.164 (e.g. `+13035550142`) |

`ALLOWED_ORIGINS` is already set to `https://jabl1629.github.io` in `render.yaml`.
Save → Render redeploys. Copy the service URL, e.g.
`https://intandem-emr-backend.onrender.com`.

Sanity check: open `…onrender.com/api/health` → `{"ok":true,"mode":"live"}`
(`"mock"` means the key isn't set yet).

## 3. Point the demo at it

Open **`https://jabl1629.github.io/InTandem/#/console`**, paste the Render URL
into **Backend URL**, and hit **Save & connect**. The status dot should read
**live**. (This is stored in your browser, so do it on the demo laptop.)

- Optional: bake it into the site instead by adding a GitHub **Actions repo
  variable** `VITE_BACKEND_URL` = the Render URL, then re-run the Pages deploy.
- With no backend URL set anywhere, the demo runs the built-in **simulation** —
  handy as a backup.

## 4. ElevenLabs data-collection fields (for the progress note)

The self-writing note reads these **data-collection** field IDs from the
conversation analysis — configure them on the agent to match (handoff §7):

`contact_identity_confirmed`, `call_outcome`, `acknowledgment_received`,
`nurse_callback_requested`, `callback_topic`, `summary_for_chart`

(If a field is missing, the note falls back to the transcript summary.)
The agent's **first-message** field should be `{{first_message}}` — the opener is
passed per call as a dynamic variable.

## 5. Run it

From `/console`: set the **Target phone** (or rely on `DEFAULT_TARGET_PHONE`) and
the live participant's **Contact first name**, then hit a scenario (start with
**S2**). The call fires; the transcript streams to `/console` and the `/emr`
projector window; the note posts to the chart when the call ends. `S3b` unlocks
once `S3a` has run (the open-commitment badge closes when it fires).

**Free-tier note:** Render's free service sleeps after ~15 min idle (~50s cold
start). Just open `/console` a minute before the demo — loading it pings
`/api/health` and wakes the service. ($7/mo removes sleep entirely.)

## Local dev

```bash
cd server
cp .env.example .env      # fill in your values (or leave key blank for mock)
npm install && npm start  # http://localhost:3001
```
Set the console's Backend URL to `http://localhost:3001`.
