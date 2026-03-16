# NBA Morning Recap — Project Spec

## What we're building
A service that sends users a daily NBA recap every morning covering last
night's games. Users sign up with their name, phone/email, and preferences.
The recap is delivered as text and/or audio (their choice).

## Core user experience
The user wakes up, gets a text or email with a 2-5 minute recap of last
night's NBA games. If they chose audio, there's a tap-to-play link that
opens an MP3 — like a mini podcast they listen to during their morning
routine.

## What the recap covers
- Game scores and winners
- Standout player performances
- Current standings
- Injuries and notable news

## Tech stack
- Runtime: Node.js + TypeScript
- Server: Express (simple, no framework)
- Scheduler: node-cron (runs pipeline at 8am ET daily)
- Sports data: ESPN unofficial API (free, no key required) — NOT balldontlie.
Provides scores, box scores, and standings in one place at no cost.
- AI: Anthropic Claude API (claude-sonnet-4-20250514) via @anthropic-ai/sdk
- TTS: ElevenLabs API (converts recap script to MP3)
- MP3 storage: TBD (S3 or Cloudflare R2 — decide in Phase 5)
- SMS: Twilio
- Email: Resend
- Database: SQLite via better-sqlite3
- Hosting: Railway

## Project structure
src/
  data/         # API fetching and data formatting
  ai/           # Claude prompt + recap generation
  audio/        # ElevenLabs TTS integration
  delivery/     # Twilio + Resend sending logic
  db/           # SQLite setup and queries
  server/       # Express routes (signup form)
  scheduler/    # node-cron job
  types/        # Shared TypeScript types
.env            # API keys (never commit this)
CLAUDE.md       # This file

## Environment variables needed
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
RESEND_API_KEY=
DATABASE_PATH=./data/users.db

## Build phases — do ONE at a time, stop and confirm before moving on

### Phase 1 — Data pipeline (START HERE)
Goal: fetch real NBA data and format it into clean JSON.
- Initialize TypeScript project with the folder structure above
- Connect to balldontlie API and fetch last night's scores, box scores,
  and standings
- Write a data formatter that shapes raw API responses into clean
  structured JSON ready to pass to Claude
- Write a test script (src/scripts/test-data.ts) that prints the
  formatted data to the console
Exit criteria: running `npx ts-node src/scripts/test-data.ts` prints
clean, readable game data for last night.

### Phase 2 — AI recap generation
Goal: feed formatted data to Claude, get a great recap back.
- Write the main recap prompt (text version: readable, punchy, 400 words)
- Write the audio prompt variant (spoken word: short sentences, natural
  transitions, no bullet points, sounds like a real broadcaster)
- Build the pipeline: formatted JSON in → Claude API → recap string out
- Write a test script (src/scripts/test-ai.ts) that prints both versions
Exit criteria: both scripts produce a recap you'd actually want to
read or hear.

### Phase 3 — Audio generation
Goal: turn the spoken script into a real MP3.
- Connect ElevenLabs API
- Pass the audio script → receive MP3 buffer
- Save to local file (output/recap-[date].mp3) for now
- Write a test script (src/scripts/test-audio.ts)
Exit criteria: a real MP3 exists on disk and sounds good when played.

### Phase 4 — User signup + database
Goal: real people can sign up and their data is stored.
- Initialize SQLite database with users table:
  id, name, email, phone, delivery_pref (email|sms|both),
  content_pref (text|audio|both), created_at
- Express server with POST /signup route
- Simple HTML signup page served at GET /
- Form fields: name, email, phone, delivery preference, content preference
Exit criteria: filling out the form stores a row in the database.

### Phase 5 — Delivery
Goal: actually send the recap to real users.
- Decide on MP3 storage (S3 or Cloudflare R2) and implement upload
- Twilio SMS integration: send recap text + audio link (if applicable)
- Resend email integration: clean HTML email with audio link
- Delivery dispatcher: loop users table, send correct format to each
Exit criteria: you receive a real text and email on your own
phone/inbox.

### Phase 6 — Scheduler + deployment
Goal: it runs automatically every morning.
- node-cron job wiring together: fetch → format → generate → send
- Full error handling and logging throughout the pipeline
- Deploy to Railway
Exit criteria: wake up the next morning and the recap arrived without
you doing anything.

### Phase 7 — Polish
Goal: something you're proud to show.
- Better signup page UI
- Admin page showing subscriber list
- Strong README explaining the project, stack, and AI pipeline
- Make sure error states are handled gracefully everywhere

## Important rules for Claude Code
- Only work on the current phase — do not jump ahead
- Every phase must end with a working test script before moving on
- Never commit .env or any API keys
- Keep functions small and focused — one job per function
- Use TypeScript strictly — no `any` types
- Add a comment above every function explaining what it does
- When in doubt, ask rather than assume


## User preferences (updated spec)

Users have the following preferences stored in the database:
- name: string
- email: string | null
- phone: string | null
- delivery_pref: "email" | "sms" | "both"
- content_pref: "text" | "audio" | "both"
- detail_level: "flash" | "recap" | "deep_dive"
- favorite_team: string | null (only relevant for deep_dive users)

## Detail level behavior

### Flash
- Covers all games, one punchy sentence per game
- Scores, winner, one standout name
- ~60 seconds when read aloud
- User chooses text, audio, or both — their call

### Recap (default)
- Claude editorially picks the 2-3 best games to highlight
- Full paragraph per highlighted game with top performers
- One-liner for remaining games
- Standings snapshot for relevant teams
- ~2-3 minutes when read aloud

### Deep dive
- If favorite team played: full game story first, then recap of
  other notable games, brief mentions of the rest
- If favorite team did NOT play: open with "The [team] were off
  last night — here's what happened around the league" then
  treat like a Recap
- ~4-5 minutes when read aloud

## Prompt system design

There is ONE prompt template with parameters injected. Do not build
separate prompts for each tier — use a single buildPrompt() function
that accepts:
  - detailLevel: "flash" | "recap" | "deep_dive"
  - favoriteTeam: string | null
  - gameData: formatted JSON from Phase 1
  - format: "text" | "audio"

The format parameter changes the writing style:
- text: can use light structure, natural paragraph breaks
- audio: spoken word only — short sentences, no bullet points,
  natural transitions ("and over in Boston...", "meanwhile in LA..."),
  sounds like a real broadcaster when read aloud

## Important data note
Standings are sorted worst-to-best (rank 1 = last place, rank 15 =
first place). Always refer to conference rank by record, not rank
number. FG%, 3P%, and minutes played are not available — do not
reference shooting percentages in the recap.
