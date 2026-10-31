# KvK Appointment Planner

A website for a Kingshot alliance. Players sign up for the King's appointment during KvK, and
admins turn the sign-ups into a schedule. Players with the most speedups get turns first.

Built with Next.js 15 (App Router), TypeScript and PostgreSQL.

## Pages

| Page | Who uses it | What it does |
| --- | --- | --- |
| `/` | Players | Enter game ID, name, alliance tag and speedups, and pick the times they can be online |
| `/schedule` | Everyone | Read-only schedule with a name search |
| `/admin` | Admins (password) | Ranking, auto-assign, lock or change turns, open/close sign-ups, publish, reset |

## How it works

**Days**

- **Day 1 · Construction & Research** (Chief Minister). Score = construction + research + general speedups the player will use on Day 1.
- **Day 4 · Training** (Noble Advisor). Score = training + general speedups the player will use on Day 4.

**Turns.** 48 turns of 30 minutes per day, 00:00 to 24:00 UTC. Players see each time in UTC and in their own time zone.

**Player login.** Players type their game ID. If they signed up before, their entry loads and they can change it. This is not secure on purpose: anyone who knows a game ID can edit that entry. Admins can see and delete every entry.

**Auto-assign (per day)**

1. Locked turns stay where they are.
2. Players are ranked by score; earlier sign-up wins a tie.
3. From the top down, each player gets one free turn among the times they picked. If several are free, they get the one the fewest other players picked, so popular times stay open for people with no other option.
4. Players whose picked times are all taken are shown as "Waiting". An admin can place them in any open turn by hand; a turn set by hand is locked.

**A typical KvK**

1. Open `/admin`, set the event name, share the player link in alliance chat.
2. Players sign up before the prep phase.
3. Close sign-ups, press Auto-assign for each day, fix anything by hand, lock turns.
4. Tick "Schedule published" and share `/schedule`. Players who log in again also see their own turn.
5. After KvK: "All players" tab, then "Start a new KvK".

**Player names from game ID (optional).** Set `MIGHTPULSE_API_KEY` and a new player's name and alliance tag are filled in from their game ID. Without a key, players type their name.

## Run it on your computer

You need Node.js 20 or newer, and Docker for the local database (or any Postgres you already have).

```bash
git clone https://github.com/SinanCodecords/kingshot-kvk-planner.git
```

```bash
cd kingshot-kvk-planner
```

```bash
cp .env.example .env.local
```

Edit `.env.local` and set `ADMIN_PASSWORD` and `SECRET_KEY`. Then start the database and the app:

```bash
docker compose up -d
```

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000 for players and http://localhost:3000/admin for admins. The database tables are created automatically on the first request.

## Deploy (Vercel + Neon, both have free plans)

1. Create a Postgres database on [Neon](https://neon.tech) (or Supabase) and copy its connection string.
2. Import this repo on [Vercel](https://vercel.com/new).
3. Add environment variables: `DATABASE_URL`, `ADMIN_PASSWORD`, `SECRET_KEY` (any long random text), and optionally `MIGHTPULSE_API_KEY`.
4. Deploy. Share `https://your-app.vercel.app/` with players and keep `/admin` for yourself.

Any other Node.js host works too: `npm run build`, then `npm start`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Tests for the ranking and turn assignment |
| `npm run typecheck` | TypeScript check |

## Code layout

```
app/
  page.tsx                 player sign-up ( / )
  schedule/page.tsx        public schedule ( /schedule )
  admin/page.tsx           admin dashboard ( /admin )
  api/                     route handlers (player and admin API)
  globals.css              all styling
components/
  SignUp.tsx               player form
  SpeedupInput.tsx         days / hours / minutes boxes
  SlotPicker.tsx           the 48 time buttons
  ScheduleView.tsx         schedule tables with search
  admin/                   dashboard, day panel, players panel
lib/
  schedule.ts              days, turns, ranking and auto-assign (pure, tested)
  db.ts                    Postgres access; creates tables on first use
  auth.ts                  admin password and signed cookie
  api.ts                   request validation helpers
  lookup.ts                optional name lookup by game ID
  format.ts, client.ts     display and browser helpers
tests/schedule.test.ts
```
