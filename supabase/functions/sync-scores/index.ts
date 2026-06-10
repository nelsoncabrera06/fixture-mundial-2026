// ---------------------------------------------------------------------------
// Edge Function: sync-scores
//
// Trae los marcadores del Mundial 2026 desde football-data.org y los guarda en
// la tabla `live_scores` de Supabase. Pensada para dispararse cada ~6 min vía
// Supabase Cron.
//
// FUENTE: football-data.org (tier free, competición "WC"). Límite 10 req/min
// (sin tope diario). Nosotros hacemos 1 llamada por tick, así que sobra. Igual
// mantenemos el "gating": SOLO llamamos cuando hay un partido en curso
// (ventana = [kickoff-10min, kickoff+140min]); fuera de eso, ni una request.
//
// El token NUNCA viaja al navegador: vive como secret en Supabase
// (FOOTBALL_DATA_TOKEN) y solo se usa acá, en el backend.
// ---------------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_URL = "https://api.football-data.org/v4/competitions/WC/matches";

// Ventana de polling alrededor de cada partido (en minutos). 140 min después
// cubre 90' + entretiempo + descuento (y casi todo alargue/penales en playoffs).
const BEFORE_MIN = 10;
const AFTER_MIN = 140;

// Horarios de inicio (hora ARG, UTC-3) de TODOS los partidos del torneo.
// Generado desde lib/matches.js + lib/knockout.js. Si cambian fechas/horas
// (sobre todo al definirse los cruces de playoffs), regenerá esta lista.
const KICKOFFS = [
  "2026-06-11T16:00", "2026-06-11T23:00", "2026-06-12T16:00", "2026-06-12T22:00",
  "2026-06-13T16:00", "2026-06-13T19:00", "2026-06-13T22:00", "2026-06-14T01:00",
  "2026-06-14T14:00", "2026-06-14T17:00", "2026-06-14T20:00", "2026-06-14T23:00",
  "2026-06-15T13:00", "2026-06-15T16:00", "2026-06-15T19:00", "2026-06-15T22:00",
  "2026-06-16T16:00", "2026-06-16T19:00", "2026-06-16T22:00", "2026-06-17T01:00",
  "2026-06-17T14:00", "2026-06-17T17:00", "2026-06-17T20:00", "2026-06-17T23:00",
  "2026-06-18T13:00", "2026-06-18T16:00", "2026-06-18T19:00", "2026-06-18T22:00",
  "2026-06-19T16:00", "2026-06-19T19:00", "2026-06-19T22:00", "2026-06-20T01:00",
  "2026-06-20T17:00", "2026-06-20T18:00", "2026-06-20T21:00", "2026-06-21T01:00",
  "2026-06-21T13:00", "2026-06-21T16:00", "2026-06-21T19:00", "2026-06-21T22:00",
  "2026-06-22T14:00", "2026-06-22T18:00", "2026-06-22T20:00", "2026-06-22T21:00",
  "2026-06-23T14:00", "2026-06-23T17:00", "2026-06-23T20:00", "2026-06-23T23:00",
  "2026-06-24T16:00", "2026-06-24T19:00", "2026-06-24T22:00", "2026-06-25T17:00",
  "2026-06-25T20:00", "2026-06-25T23:00", "2026-06-26T16:00", "2026-06-26T21:00",
  "2026-06-27T00:00", "2026-06-27T18:00", "2026-06-27T20:30", "2026-06-27T23:00",
  "2026-06-28T13:00", "2026-06-28T17:00", "2026-06-29T13:00", "2026-06-29T17:00",
  "2026-06-29T21:00", "2026-06-30T16:00", "2026-06-30T20:00", "2026-07-01T13:00",
  "2026-07-01T17:00", "2026-07-01T21:00", "2026-07-02T16:00", "2026-07-02T20:00",
  "2026-07-02T23:00", "2026-07-03T16:00", "2026-07-03T20:00", "2026-07-03T23:00",
  "2026-07-04T16:00", "2026-07-04T20:00", "2026-07-05T16:00", "2026-07-05T20:00",
  "2026-07-06T16:00", "2026-07-06T20:00", "2026-07-07T16:00", "2026-07-07T20:00",
  "2026-07-09T20:00", "2026-07-10T20:00", "2026-07-11T14:00", "2026-07-11T18:00",
  "2026-07-14T16:00", "2026-07-15T16:00", "2026-07-18T16:00", "2026-07-19T16:00",
];

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ¿Estamos dentro de la ventana de algún partido ahora mismo?
function hayPartidoEnVentana(now: number): boolean {
  for (const slot of KICKOFFS) {
    const ko = new Date(`${slot}:00-03:00`).getTime();
    if (now >= ko - BEFORE_MIN * 60_000 && now <= ko + AFTER_MIN * 60_000) {
      return true;
    }
  }
  return false;
}

Deno.serve(async () => {
  const token = Deno.env.get("FOOTBALL_DATA_TOKEN");
  if (!token) return json({ ok: false, error: "Falta el secret FOOTBALL_DATA_TOKEN" }, 500);

  // Fuera de horario de partido no gastamos llamadas.
  if (!hayPartidoEnVentana(Date.now())) {
    return json({ ok: true, skipped: "sin partidos en ventana", calls: 0 });
  }

  // Una sola llamada trae TODOS los partidos del Mundial (con el marcador
  // actual de los que están en juego). Filtrar por fecha daría problemas con
  // partidos que cruzan la medianoche UTC, así que traemos todo: es liviano.
  const res = await fetch(API_URL, { headers: { "X-Auth-Token": token } });
  if (!res.ok) {
    // 429 = pasamos el límite por minuto; 403 = el token no cubre la WC.
    const txt = await res.text();
    return json({ ok: false, error: `football-data HTTP ${res.status}`, detail: txt.slice(0, 300), calls: 1 }, 502);
  }

  const body = await res.json();
  const matches = body.matches ?? [];

  // deno-lint-ignore no-explicit-any
  const rows = matches.map((m: any) => ({
    fixture_id: m.id,
    league_id: null,
    match_date: String(m.utcDate ?? "").slice(0, 10),
    home_team: m.homeTeam?.name ?? "",
    away_team: m.awayTeam?.name ?? "",
    home_goals: m.score?.fullTime?.home ?? null,
    away_goals: m.score?.fullTime?.away ?? null,
    status_short: m.status ?? null,   // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | ...
    elapsed: m.minute ?? null,        // football-data free no siempre trae el minuto
    updated_at: new Date().toISOString(),
  })).filter((r) => r.fixture_id != null && r.home_team && r.away_team);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (rows.length > 0) {
    const { error } = await supabase
      .from("live_scores")
      .upsert(rows, { onConflict: "fixture_id" });
    if (error) return json({ ok: false, error: error.message, calls: 1 }, 500);
  }

  return json({ ok: true, calls: 1, upserts: rows.length });
});
