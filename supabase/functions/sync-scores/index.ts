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
// Si un partido se SUSPENDE y se reanuda más tarde, se sale de esta ventana; por
// eso, además, seguimos preguntando mientras haya un partido "activo" en la base
// (ver hayPartidoActivo): la ventana ARRANCA el polling y el estado activo lo
// EXTIENDE solo, por cualquier duración del corte, hasta que finalice.
const BEFORE_MIN = 10;
const AFTER_MIN = 140;

// Estados CRUDOS de football-data que mantienen vivo el polling fuera de ventana.
const ACTIVE_STATUSES = ["IN_PLAY", "PAUSED", "SUSPENDED"];
// Estados "raros" que disparan un email de alerta al transicionar a ellos.
const ALERT_STATUSES = ["SUSPENDED", "POSTPONED", "CANCELLED"];
// Tope: un partido "activo" sin actualizarse hace más de esto se considera
// muerto y deja de mantener el polling (evita preguntar para siempre).
const ACTIVE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
// Key pública de Web3Forms (la misma del formulario de contacto del sitio).
const WEB3FORMS_KEY =
  Deno.env.get("WEB3FORMS_KEY") ?? "6ff791e9-f323-4386-be68-2d6cf07ea13b";

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
  "2026-06-20T14:00", "2026-06-20T17:00", "2026-06-20T21:00", "2026-06-21T01:00",
  "2026-06-21T13:00", "2026-06-21T16:00", "2026-06-21T19:00", "2026-06-21T22:00",
  "2026-06-22T14:00", "2026-06-22T18:00", "2026-06-22T21:00", "2026-06-23T00:00",
  "2026-06-23T14:00", "2026-06-23T17:00", "2026-06-23T20:00", "2026-06-23T23:00",
  "2026-06-24T16:00", "2026-06-24T19:00", "2026-06-24T22:00", "2026-06-25T17:00",
  "2026-06-25T20:00", "2026-06-25T23:00", "2026-06-26T16:00", "2026-06-26T21:00",
  "2026-06-27T00:00", "2026-06-27T18:00", "2026-06-27T20:30", "2026-06-27T23:00",
  "2026-06-28T16:00", "2026-06-29T14:00", "2026-06-29T17:30", "2026-06-29T22:00",
  "2026-06-30T14:00", "2026-06-30T18:00", "2026-06-30T22:00", "2026-07-01T13:00",
  "2026-07-01T17:00", "2026-07-01T21:00", "2026-07-02T16:00", "2026-07-02T20:00",
  "2026-07-03T00:00", "2026-07-03T15:00", "2026-07-03T19:00", "2026-07-03T22:30",
  "2026-07-04T14:00", "2026-07-04T18:00", "2026-07-05T17:00", "2026-07-05T19:00",
  "2026-07-06T15:00", "2026-07-06T19:00", "2026-07-07T13:00", "2026-07-07T17:00",
  "2026-07-09T17:00", "2026-07-10T16:00", "2026-07-11T18:00", "2026-07-11T22:00",
  "2026-07-14T15:00", "2026-07-15T16:00", "2026-07-18T18:00", "2026-07-19T16:00",
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

// ¿Hay algún partido "activo" (en juego, entretiempo o SUSPENDIDO) y reciente en
// la base? Mantiene vivo el polling fuera de ventana —p. ej. una suspensión larga
// que se reanuda pasados los 140 min—. El tope de antigüedad evita preguntar para
// siempre si un partido queda colgado en SUSPENDED y nunca se resuelve.
// deno-lint-ignore no-explicit-any
function hayPartidoActivo(prev: any[], now: number): boolean {
  return prev.some(
    (row) =>
      ACTIVE_STATUSES.includes(row.status_short) &&
      now - new Date(row.updated_at ?? 0).getTime() < ACTIVE_MAX_AGE_MS,
  );
}

// Manda un email de alerta (vía Web3Forms) cuando un partido entra en un estado
// raro, para revisarlo a mano. No corta el flujo si falla.
async function enviarAlerta(subject: string, message: string): Promise<void> {
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject,
        from_name: "Fixture 2026 · sync-scores",
        message,
      }),
    });
  } catch (_e) {
    // Silencioso: una alerta perdida no debe romper el sync.
  }
}

Deno.serve(async () => {
  const token = Deno.env.get("FOOTBALL_DATA_TOKEN");
  if (!token) return json({ ok: false, error: "Falta el secret FOOTBALL_DATA_TOKEN" }, 500);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Estado previo de cada partido (para el gate "activo" y para detectar
  // transiciones a estados raros). La tabla es chica (~104 filas), traemos todo.
  const { data: prevRows } = await supabase
    .from("live_scores")
    .select("fixture_id, status_short, updated_at, home_team, away_team");
  // deno-lint-ignore no-explicit-any
  const prev = (prevRows ?? []) as any[];
  const prevStatus = new Map<number, string>(
    prev.map((r) => [r.fixture_id, r.status_short] as [number, string]),
  );

  const now = Date.now();
  // La ventana de tiempo ARRANCA el polling; un partido activo lo EXTIENDE.
  if (!hayPartidoEnVentana(now) && !hayPartidoActivo(prev, now)) {
    return json({ ok: true, skipped: "sin partidos en ventana ni activos", calls: 0 });
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
  const rows = matches.map((m: any) => {
    const duration   = m.score?.duration ?? null;   // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT
    const homePen    = m.score?.penalties?.home ?? null;
    const awayPen    = m.score?.penalties?.away ?? null;
    const homeFullT  = m.score?.fullTime?.home ?? null;
    const awayFullT  = m.score?.fullTime?.away ?? null;

    // football-data (free) incluye los penales en score.fullTime para partidos
    // que van a tiros. Restamos para quedarnos con el marcador real del partido.
    let homeGoals = homeFullT;
    let awayGoals = awayFullT;
    if (duration === "PENALTY_SHOOTOUT" && homePen != null && homeFullT != null) {
      homeGoals = homeFullT - homePen;
      awayGoals = awayFullT! - awayPen!;
    }

    return {
      fixture_id: m.id,
      league_id: null,
      match_date: String(m.utcDate ?? "").slice(0, 10),
      home_team: m.homeTeam?.name ?? "",
      away_team: m.awayTeam?.name ?? "",
      home_goals: homeGoals,
      away_goals: awayGoals,
      home_penalties: homePen,
      away_penalties: awayPen,
      duration,
      status_short: m.status ?? null,   // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | ...
      elapsed: m.minute ?? null,        // football-data free no siempre trae el minuto
      updated_at: new Date().toISOString(),
    };
  }).filter((r) => r.fixture_id != null && r.home_team && r.away_team);

  if (rows.length > 0) {
    const { error } = await supabase
      .from("live_scores")
      .upsert(rows, { onConflict: "fixture_id" });
    if (error) return json({ ok: false, error: error.message, calls: 1 }, 500);
  }

  // Alertas: partidos que TRANSICIONAN a un estado raro (SUSPENDED/POSTPONED/
  // CANCELLED) desde otro distinto. Un mail por evento, no en cada tick.
  const alerts = rows.filter(
    (r) =>
      r.status_short != null &&
      ALERT_STATUSES.includes(r.status_short) &&
      prevStatus.get(r.fixture_id) !== r.status_short,
  );
  for (const a of alerts) {
    await enviarAlerta(
      `⚠️ Estado raro: ${a.home_team} vs ${a.away_team} → ${a.status_short}`,
      `El partido ${a.home_team} vs ${a.away_team} (${a.match_date}) pasó a "${a.status_short}".\n` +
        `Marcador actual: ${a.home_goals ?? "-"}-${a.away_goals ?? "-"} (min ${a.elapsed ?? "-"}).\n` +
        `Estado anterior: ${prevStatus.get(a.fixture_id) ?? "(nuevo)"}.\n` +
        `Revisalo a mano por si hay que ajustar el fixture.`,
    );
  }

  return json({ ok: true, calls: 1, upserts: rows.length, alerts: alerts.length });
});
