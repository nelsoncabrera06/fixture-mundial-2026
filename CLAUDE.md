# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page Next.js (App Router) web app showing the 2026 FIFA World Cup
fixture, deployed to Vercel. Two tabs: group stage and knockout ("Playoffs").
UI language is Spanish (Río de la Plata / Argentine register). The app is fully
static — no database, no API routes, no server data fetching.

## Commands

```bash
npm run dev      # local dev server (http://localhost:3000)
npm run build    # production build — run this to verify changes compile
npm run start    # serve the production build locally
```

There is no test suite. `npm run build` is the verification step. Deployment is
automatic on Vercel from git pushes (or `vercel --prod` via CLI).

### Gotcha: "I don't see my changes"

This has bitten us repeatedly. `next dev` hot-reloads on save — you do NOT need to
restart after editing. If changes don't appear, the cause is almost always one of:

1. **Stale leftover Next servers.** Multiple `next-server` processes fighting over
   ports serve an old build. Fix: `pkill -f next-server; pkill -f "next dev"`,
   then `rm -rf .next`, then `npm run dev` once.
2. **Browser cache.** Hard-refresh with **Cmd+Shift+R**.

To prove the live server actually serves new code (instead of guessing), curl it
and grep for a string you just added, e.g.
`curl -s http://localhost:3000 | grep "← Ocultar"`.

## Architecture

The whole app is one statically-prerendered route (`app/page.js`, a client
component) that swaps between two views with local `useState`. All match data
lives in plain JS modules under `lib/` — editing data never touches components.

- `app/page.js` — owns the active tab and the selected timezone; persists the
  timezone in `localStorage` (key `fixture2026.tz`), read in a `useEffect` to
  avoid hydration mismatch.
- `components/GroupStage.js` / `components/Knockout.js` — render the two tabs.
- `components/TimezonePicker.js` — banner + `<select>` for the viewing timezone.
- `lib/matches.js` — `GROUPS` (teams per group) and `GROUP_MATCHES` (group-stage
  fixtures); `kickoff(match)` builds the absolute instant.
- `lib/knockout.js` — `ROUNDS` (R32 → Final) with placeholder team slots; same
  `kickoff()` helper.
- `lib/timezone.js` — `TIMEZONES` list, `resolveTz`, and the `Intl`-based
  `formatDate` / `formatTime` / `dayKey` helpers.
- `lib/teams.js` — `flag(team)` maps a team name to a flag emoji.

## The timezone model (most important invariant)

Host venues span four UTC offsets (UTC-7 to UTC-4), so times are **never** stored
as a wall-clock string alone. Each match stores `date` + `time` expressed in
**Argentine time (UTC-3, no DST)**, and `kickoff(match)` turns that into an
absolute `Date` via `new Date(\`${date}T${time}:00-03:00\`)`. The UI then formats
that instant in the viewer's chosen zone with `Intl.DateTimeFormat`.

Consequences when editing:
- A `time` value in the data files is Argentine local time — to convert from a
  venue's local kickoff, shift it to UTC-3 first.
- Default viewing zone is `Europe/Helsinki` (`DEFAULT_TZ`); `"auto"` resolves to
  the device zone. Never hardcode formatted time strings in components — always
  go through the `lib/timezone.js` helpers so conversion stays centralized.

## Data status / accuracy

Groups and the 48 teams are confirmed (draw of 5 Dec 2025). Dates, venues, and
kickoff times are indicative and should be verified against fifa.com. Knockout
matchups are placeholders (`"1.º Grupo A"`, `"Ganador 89"`, etc.) because they
depend on group results — fill `home`/`away` in `lib/knockout.js` once known.

When adding/correcting matches, edit only the `lib/` data files. The group-stage
matchday pattern within each group is fixed: MD1 = 1v2, 3v4 · MD2 = 1v3, 4v2 ·
MD3 = 4v1, 2v3 (positions per the `GROUPS` array order).
