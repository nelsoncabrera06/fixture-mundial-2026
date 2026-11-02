# ⚽ Fixture Mundial 2026

Interactive fixture for the 2026 FIFA World Cup (Canada · Mexico · United States):
every kickoff in **your** timezone, final scores, favourites, calendar sync and a
"what if" simulation mode. No ads, no signup, no backend.

**Live app:** https://fixturemundial.vercel.app/ · **Español:** [README_es.md](./README_es.md)

## Features

- Group stage (12 groups, 48 teams, 72 matches) and the full knockout bracket (R32 → Final).
- Kickoff times rendered in the viewer's timezone — device zone by default, or pick from a list of common zones.
- Final scores and match status (*final, suspended, postponed, cancelled*, plus *live* states if a source is ever wired back in).
- Standings computed from the results, plus up to 4 **simulation scenarios** that recompute the table and the bracket without ever touching real results.
- Favourites, "my team" and "next match" views.
- One-click calendar export: Google, Outlook, or a standard `.ics` download.
- A local profile (name, team, timezone, favourites) that lives in the browser — no account, no password.
- Interface in English, Spanish and Portuguese.

The 2026 tournament finished on 19 July 2026, so every result is now a final
score stored in the repository. The live-score pipeline (Supabase + a
football-data.org Edge Function) was retired along with the database; see
[Dropping the database](#dropping-the-database) below.

## Stack

| Layer      | Choice                                            |
| ---------- | ------------------------------------------------- |
| Framework  | Next.js 16 (App Router) + React 19                |
| Styling    | Plain CSS (custom properties, no UI library)      |
| Data       | Plain JS modules in `lib/`, versioned in git      |
| Storage    | `localStorage` (profile + simulations), no server |
| Hosting    | Vercel                                             |
| Misc       | Vercel Analytics, Web3Forms (contact form)        |

Everything is prerendered as static HTML. There is no server-side data
fetching, **no database, no API routes and no environment variables**.

## Where the data comes from

The fixture and the results are in the repository, not in an API. Groups, teams,
venues and kickoff times were transcribed from the official FIFA calendar and
live in `lib/matches.js` (group stage) and `lib/knockout.js` (knockout bracket)
as plain data modules. Scores live on each match as a `result` field.

That means the schedule is versioned, diffable and available on the first paint
— no loading spinner, no rate limits, no third party in the critical path.
Correcting a kickoff time or a score is a one-line diff.

### The timezone model

Venues span four UTC offsets (UTC-7 → UTC-4), so a kickoff is never stored as a
wall-clock string alone. Each match stores a date and time in UTC-3, and
`kickoff(match)` turns it into an **absolute instant** (`new Date("...-03:00")`).
The UI then formats that single instant with `Intl.DateTimeFormat` in whichever
zone the viewer picked. The same instant is also what gets written to Google
Calendar, Outlook or the `.ics` file, so an event always lands at the right
local time.

## The local profile (no accounts)

There is no auth and no database. On the first visit the app creates a profile
in `localStorage` and everything hangs off it:

| Key                        | Content                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `fixture2026.profile`      | `{ username, team, timezone, favorites }`                    |
| `fixture2026.sims`         | The 4 simulation scenarios (`matchId → { h, a }` overrides)  |
| `fixture2026.simScenario`  | Which scenario is active                                     |
| `fixture2026.tz` / `.lang` | Viewing timezone and language                                |

"Mi cuenta" edits the name, team, timezone and language, and can wipe
everything with one button. The trade-off is deliberate: no password to leak,
no server to pause — and no sync between devices. Clearing browser data deletes
the profile.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. No `.env` file, no keys.

`npm run build` is the verification step (there is no test suite).

## Project structure

```
app/            page + layout (single prerendered route)
components/     UI, one file per view, plus the app-level providers
                (Language, Profile, Simulation)
lib/            data (matches, knockout, teams, i18n) and pure logic
                (timezone, results, standings, playoffs)
```

`lib/` holds every piece of domain logic as plain, testable functions, so
changing data or formatting never touches a component.

## Deployment

Push to GitHub and import the repo in Vercel — deploys are automatic and need
no configuration or secrets.

## Dropping the database

The project used to run on Supabase (auth, profiles, simulation scenarios and a
live-scores table fed by a Supabase Edge Function). With the tournament over
there was nothing left for a server to do, so it was removed in favour of
`localStorage`.

The old data was saved as a local `pg_dump` backup and the Supabase project is
gone. The backup sits in `db/`, which is git-ignored (personal data, and no
reason to version it). Nothing in the app reads it.

If you ever need to look inside — who had an account, what scenarios existed —
the backup is plain SQL: `zcat db/*.backup.gz | less` (or `grep` it). No database,
no credentials, no tooling.

The app ships with a **demo profile** (`lib/demoProfile.js`): the author's own
team and favourites, with every personal field removed. It is seeded once on the
first visit so the app doesn't open empty; each visitor can then change or wipe
it locally.

## Data accuracy

Teams and groups are official (draw of 5 December 2025). Dates, venues, kickoff
times and results were transcribed by hand from FIFA's published calendar —
verify them against [fifa.com](https://www.fifa.com/en) before relying on them.
Knockout slots may still be labelled `"Ganador 89"`; the bracket resolves them
from the results dynamically.

---

Personal project by [Nelson Cabrera](https://github.com/nelsoncabrera06) ·
Live at [fixturemundial.vercel.app](https://fixturemundial.vercel.app/)
