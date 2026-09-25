# ⚽ Fixture Mundial 2026

Interactive fixture for the 2026 FIFA World Cup (Canada · Mexico · United States):
every kickoff in **your** timezone, live scores, favourites, calendar sync and a
"what if" simulation mode. No ads, no signup required.

**Live app:** https://fixturemundial.vercel.app/ · **Español:** [README_es.md](./README_es.md)

## Features

- Group stage (12 groups, 48 teams, 72 matches) and the full knockout bracket (R32 → Final).
- Kickoff times rendered in the viewer's timezone — device zone by default, or pick from a list of common zones.
- Live scores and match status: *in play, half time, final, suspended, postponed, cancelled*.
- Standings computed from the results, plus up to 4 **simulation scenarios** per user that recompute the table and the bracket without ever touching real results.
- Favourites, "my team" and "next match" views.
- One-click calendar export: Google, Outlook, or a standard `.ics` download.
- Accounts (email + password, or Google OAuth) that sync timezone, team and favourites across devices.
- Interface in English, Spanish and Portuguese.
- Optional administration panel: manage users and delete accounts.

## Stack

| Layer            | Choice                                                       |
| ---------------- | ------------------------------------------------------------ |
| Framework        | Next.js 16 (App Router) + React 19                           |
| Styling          | Plain CSS (custom properties, no UI library)                |
| Backend / DB     | Supabase (PostgreSQL + Auth + RLS)                           |
| Live data        | [football-data.org](https://www.football-data.org/) v4, via a Supabase Edge Function |
| Hosting          | Vercel                                                        |
| Serverless tasks | Supabase Cron + Deno Edge Functions                           |
| Misc             | Vercel Analytics, Web3Forms (contact form)                   |

Everything is prerendered as static HTML; there is no server-side data fetching.
The page is a client-side app that talks to Supabase directly, except for one
server route (admin operations).

## Where the data comes from

Two different sources, on purpose.

**1. The fixture itself is in the repository, not in an API.** Groups, teams,
venues and kickoff times come from the official FIFA calendar and live in
`lib/matches.js` (group stage) and `lib/knockout.js` (knockout bracket) as
plain data modules. That means the schedule is versioned, diffable and
available on the first paint — no loading spinner, no rate limits, no third
party in the critical path. Correcting a kickoff time is a one-line diff.

**2. What changes while the tournament runs comes from an API.** Score,
minute and match status are pulled from
**football-data.org** (`GET /v4/competitions/WC/matches`) every few minutes.

### How live scores reach the browser

1. **Supabase Cron** triggers the `sync-scores` Edge Function about every 6 minutes.
2. The function calls football-data.org with a token stored as a **Supabase secret** —
   it never reaches the browser or the bundle — normalises the payload
   (including subtracting shootout penalties from the final score) and upserts
   ~104 rows into the `live_scores` table.
3. The browser polls `live_scores` every 30 s using the anon key (read-only, RLS-protected).
   That is cheap for us and costs nothing against the API quota.
4. `lib/liveScores.js` translates the API's English team names into the Spanish
   ones used in the fixture and matches rows **by team pair**, so a score always
   lands on the right match even in a neutral venue.

Polling is gated: the function only calls the API when a match is inside its
kickoff window (or is still active), which keeps the free tier's 10 req/min
limit comfortable. Unusual states (suspended / postponed / cancelled) send an
email alert through Web3Forms so they can be reviewed manually.

### The timezone model

Venues span four UTC offsets (UTC-7 → UTC-4), so a kickoff is never stored as a
wall-clock string alone. Each match stores a date and time in UTC-3, and
`kickoff(match)` turns it into an **absolute instant** (`new Date("...-03:00")`).
The UI then formats that single instant with `Intl.DateTimeFormat` in whichever
zone the viewer picked. The same instant is also what gets written to Google
Calendar, Outlook or the `.ics` file, so an event always lands at the right
local time.

## Database — Supabase (PostgreSQL)

Supabase is a managed PostgreSQL: a real relational database with SQL, indexes
and transactions, plus auth, storage and row-level security.

| Table         | Purpose                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| `profiles`    | One row per user (`username`, `team`, `timezone`, `favourites`, `role`). Created automatically by a DB trigger on sign-up. |
| `simulations` | The user's scenarios: `user_id`, `scenario`, `name`, `results` (JSONB map of `matchId → {h, a}`). |
| `live_scores` | Mirror of the tournament state written by the Edge Function, keyed by `fixture_id`. |

**Auth:** Supabase Auth handles email + password and Google OAuth. Sessions are
stored and auto-refreshed by the SDK; the app never handles tokens by hand.

**Security:** RLS is enabled on every table — authenticated users can only read
and write their own rows (admins are let through by a role check), and
`live_scores` is readable by anyone (it is public data). The `service_role` key
never ships to the client: its only home is the server route
`app/api/admin/delete-user/route.js`, which validates the caller's JWT and role
before deleting an account.

Schema changes live in `supabase/migrations/`.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase keys
npm run dev
```

Open http://localhost:3000.

| Variable                        | Where it is used                                        |
| ------------------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Browser + server                                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser (public by design, restricted by RLS)           |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only — admin route. Never prefix with `NEXT_PUBLIC_`. |
| `FOOTBALL_DATA_TOKEN`           | Supabase secret, read by the `sync-scores` function     |

## Project structure

```
app/            page, layout and the single server route (admin)
components/     UI, one file per view, plus the app-level providers
lib/            data (matches, knockout, teams) and pure logic
                (timezone, results, standings, playoffs, i18n)
supabase/
  functions/    sync-scores Edge Function
  migrations/   SQL schema changes
```

`lib/` holds every piece of domain logic as plain, testable functions, so
changing data or formatting never touches a component.

## Deployment

Push to GitHub and import the repo in Vercel — deploys are automatic. Add the
three env vars from the table above in the Vercel project settings. On the
Supabase side, deploy the function and schedule it:

```bash
supabase functions deploy sync-scores
```

The schedule itself is a Supabase Cron job invoking the function about every
6 minutes (configured in the Supabase dashboard).

## Data accuracy

Teams and groups are official (draw of 5 December 2025). Dates, venues and
kickoff times were transcribed by hand from FIFA's published calendar — verify
them against [fifa.com](https://www.fifa.com/en) before relying on them.
Knockout pairings are placeholders until the group results are known; they are
resolved dynamically as results come in.

---

Personal project by [Nelson Cabrera](https://github.com/nelsoncabrera06) ·
Live at [fixturemundial.vercel.app](https://fixturemundial.vercel.app/)
