# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page Next.js (App Router) web app showing the 2026 FIFA World Cup
fixture, deployed to Vercel. UI language is Spanish (Río de la Plata / Argentine
register), with English and Portuguese translations in `lib/i18n.js`.

The app is **fully static — no database, no API routes, no server data fetching,
no accounts**. It has no environment variables and no server-side secrets. Every
match result is hardcoded in `lib/`; the tournament ended on 19 Jul 2026.

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
component) that swaps views with local `useState`. All match data lives in plain
JS modules under `lib/` — editing data never touches components.

Provider order (see `app/layout.js`):
`LanguageProvider` → `ProfileProvider` → `SimulationProvider` → page.

- `app/page.js` — owns the active tab (sidebar `sections` array), the selected
  match, and the viewing timezone. Timezone lives in `localStorage`
  (`fixture2026.tz`) and is read in a `useEffect` to avoid hydration mismatch.
- `components/GroupStage.js` / `components/Knockout.js` — group stage and bracket
  ("Playoffs") views.
- `components/Calendar.js`, `Groups.js`, `NextMatch.js`, `MatchView.js` — the
  other views; all read results through `getResult()`.
- `components/TimezonePicker.js` / `TimezoneBubble.js` — viewing-timezone UI.
- `lib/matches.js` — `GROUPS` (teams per group) and `GROUP_MATCHES` (group-stage
  fixtures, each with a `result` unless the match is still to be played);
  `kickoff(match)` builds the absolute instant.
- `lib/knockout.js` — `ROUNDS` (R32 → Final) with team slots and `result`s.
- `lib/results.js` — **the only way the UI asks for a result** (`getResult`,
  `isFinalResult`, `isNoScoreStatus`). Real results come from `match.result`;
  the `RESULTS` object is an optional manual override, and the simulation layer
  sits on top of both.
- `lib/timezone.js` — `TIMEZONES`, `resolveTz`, and the `Intl`-based
  `formatDate` / `formatTime` / `dayKey` helpers.
- `lib/teams.js` — `flag(team)` maps a team name to a flag emoji.
- `lib/i18n.js` — `DICT` with `es` / `en` / `pt`; every user-visible string goes
  through `t("key")`. Add a key to **all three** languages (the build won't catch
  a missing one, the UI will show the raw key).

## The user profile (local-first, no backend)

There used to be a Supabase backend (auth + `profiles` + `simulations` +
`live_scores`). It was removed; the app is now local-first.

- `lib/localProfile.js` — the profile (`username`, `team`, `timezone`,
  `favorites`) is one JSON object in `localStorage` under `fixture2026.profile`.
  It is created automatically on first visit, so **there is always a user**;
  there are no locked screens and no login modal.
- `lib/demoProfile.js` — what a first visit is seeded with: the author's team and
  favourites, with every personal field stripped (`username: "Invitado"`,
  `timezone: "auto"`). Only `createInitialProfile()` uses it; "borrar mis datos"
  writes a clean `emptyProfile()` instead, so a reset stays empty.
- `components/ProfileContext.js` — `useProfile()` returns
  `{ user, ready, updatePrefs, reset }`. `user` is `null` until `ready` is true
  (localStorage is client-only), so guard with `if (!ready || !user) return null`.
- `components/SimulationContext.js` — the 4 "¿Qué pasa si?" scenarios live in
  `localStorage` under `fixture2026.sims`; the active one in
  `fixture2026.simScenario`. `useSimulation()` exposes `active`, `activate`,
  `deactivate`, `saveMatch`, `clearMatch`, `reset`, `rename`, `countOf`,
  `nameOf` and a `version` counter (read it with `void version` to subscribe).
- "Mi cuenta" (`components/MyAccount.js`) edits the profile and can wipe all
  local data (`reset()` → `resetAll()`, which also fires the
  `"fixture2026:reset"` event so in-memory providers clear themselves).

Consequences: no cross-device sync, no password, and clearing browser data
deletes the profile. That is intentional.

## The timezone model (most important invariant)

Host venues span four UTC offsets (UTC-7 to UTC-4), so times are **never** stored
as a wall-clock string alone. Each match stores `date` + `time` expressed in
**Argentine time (UTC-3, no DST)**, and `kickoff(match)` turns that into an
absolute `Date` via `new Date(\`${date}T${time}:00-03:00\`)`. The UI then formats
that instant in the viewer's chosen zone with `Intl.DateTimeFormat`.

Consequences when editing:
- A `time` value in the data files is Argentine local time — to convert from a
  venue's local kickoff, shift it to UTC-3 first.
- The default viewing zone for a brand-new visitor is `"auto"` (the device
  zone); `DEFAULT_TZ` (`Europe/Helsinki`) is only the SSR fallback. Never
  hardcode formatted time strings in components — always go through the
  `lib/timezone.js` helpers so conversion stays centralized.

## Data status / accuracy

Groups, the 48 teams, and **every result** (72 group matches + 32 knockout
matches, including penalty shootouts) are confirmed and hardcoded. Group-stage
results are in `lib/matches.js` (`result` on each match); knockout results are in
`lib/knockout.js`. Knockout `home`/`away` may still be slot labels
(`"Ganador 89"`), which is fine — the bracket UI resolves them from the results.

When adding/correcting matches, edit only the `lib/` data files. The group-stage
matchday pattern within each group is fixed: MD1 = 1v2, 3v4 · MD2 = 1v3, 4v2 ·
MD3 = 4v1, 2v3 (positions per the `GROUPS` array order).

## Legacy: the old Supabase project

The Supabase project is gone and its data lives in a local `pg_dump` under `db/`,
which is git-ignored (personal data). The app does not read it.

The backup is plain SQL inside gzip, so it can be read with `zcat`/`grep` — no
database, no connection, no credentials:

```bash
zcat db/*.backup.gz | less        # or grep it
```

`db/` and `dumps/` are both git-ignored and stay inside the project on purpose.

Note: the demo profile was derived from that backup by hand. Keep it free of
PII — no real name, email, id or signup date.
