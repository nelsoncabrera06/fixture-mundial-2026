# ⚽ Fixture Mundial 2026

Interactive fixture for the 2026 FIFA World Cup (Canada · Mexico · United States):
every kickoff in **your** timezone, the full bracket, standings, favourites,
calendar export and a "what if" simulation mode.

Built for friends during the tournament; now kept online as a portfolio piece.
No ads, no signup, no backend, no maintenance.

**Live app:** https://fixturemundial.vercel.app/ · **Español:** [README_es.md](./README_es.md)

## History

1. **Dec 2025 – Jun 2026 — a static fixture.** Groups, teams, venues and kickoff
   times were transcribed from FIFA's calendar into `lib/matches.js` and
   `lib/knockout.js`. No backend: the whole app was prerendered HTML, and
   correcting a kickoff time was a one-line diff.
2. **During the tournament — a backend appeared.** Accounts (email + Google),
   favourites, "my team" and the four simulation scenarios needed persistence,
   so Supabase came in: auth, `profiles`, `simulations`, plus a `live_scores`
   table filled every ~6 minutes by an Edge Function polling football-data.org.
3. **19 Jul 2026 — the final was played.** Every score moved into `lib/` as a
   `result` field. That left the live pipeline with nothing to fetch.
4. **Nov 2026 — the backend left again.** With the tournament over and the free
   Supabase project paused (and about to be frozen), there was nothing a server
   could still do. The database was dropped, the profile moved to `localStorage`,
   a demo profile took its place — and the app went back to being a static site
   with zero servers, zero keys and zero cost.

The git log keeps the whole arc: the Supabase code is still in the history, and
no secret or personal data was ever committed.

## Features

- Group stage (12 groups, 48 teams, 72 matches) and the full knockout bracket (R32 → Final).
- Kickoff times rendered in the viewer's timezone — device zone by default, or pick from a list of common zones.
- Final scores and match status (*final, suspended, postponed, cancelled*, plus *live* states if a source is ever wired back in).
- Standings recomputed from the results, plus 4 **simulation scenarios** that overlay hypothetical scores without touching real ones (dormant now: every match is final, so there is nothing left to simulate).
- Favourites, "my team" and "next match" views.
- One-click calendar export: Google, Outlook, or a standard `.ics` download.
- A local profile (name, team, timezone, favourites) that lives in the browser — no account, no password, seeded with a demo.
- Interface in English, Spanish and Portuguese.

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

The first profile is seeded from `lib/demoProfile.js`: the author's own team and
favourites with **every personal field stripped** — no name, no email, no id, and
`timezone: "auto"` so each visitor sees their own clock. It exists so the app
doesn't open empty.

"Mi cuenta" edits the name, team, timezone and language, and can wipe everything
with one button (which leaves a blank profile, not the demo again). The trade-off
is deliberate: no password to leak, no server to pause — and no sync between
devices. Clearing browser data deletes the profile.

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

Push to GitHub and import the repo in Vercel — deploys are automatic and need no
configuration or secrets.

## What was removed, and what is left of it

The Supabase project is **deleted**; Google Cloud (the OAuth client behind "sign
in with Google") was retired with it. Nothing in the app references either.

A local `pg_dump` of the old database was kept in `db/` before deleting it. That
folder is git-ignored, the app never reads it, and it is optional: it exists only
as an archive of the accounts that used to exist, and can be deleted whenever.
Nothing in the repo depends on it.

Two things worth saying plainly, in case someone reads the code:

- No personal data was ever committed. The 32 user emails only ever existed in
  Supabase and, optionally, in that local, git-ignored dump.
- The demo profile was derived from the author's own row by hand, removing every
  identifying field. If you fork this, keep it that way.

## Data accuracy

Teams and groups are official (draw of 5 December 2025). Dates, venues, kickoff
times and results were transcribed by hand from FIFA's published calendar —
verify them against [fifa.com](https://www.fifa.com/en) before relying on them.
Knockout slots may still be labelled `"Ganador 89"`; the bracket resolves them
from the results dynamically.

---

Personal project by [Nelson Cabrera](https://github.com/nelsoncabrera06) ·
Live at [fixturemundial.vercel.app](https://fixturemundial.vercel.app/)
