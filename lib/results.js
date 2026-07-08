// ---------------------------------------------------------------------------
// RESULTADOS — capa única y desacoplada del fixture.
//
// HOY: los resultados se cargan a mano en el objeto RESULTS de abajo.
// MAÑANA: este archivo es el único punto que toca la UI para pedir un
// resultado (getResult). Se puede reemplazar la fuente por una API, scraping
// o base de datos sin tocar componentes ni el cálculo de la tabla: alcanza con
// que getResult(match) siga devolviendo la misma forma.
//
// Forma de un resultado:
//   { homeGoals: number, awayGoals: number, status?: "FT" | "LIVE" }
// `homeGoals`/`awayGoals` son los goles del local/visitante TAL CUAL figuran
// en el fixture (match.home / match.away). status es opcional (FT = finalizado).
// ---------------------------------------------------------------------------

// Identificador estable de un partido, sirva de grupos o de eliminatorias.
// - Eliminatorias: ya traen `id` numérico propio.
// - Grupos: no tienen id, así que se arma con grupo + equipos (único por grupo).
export function matchId(match) {
  if (match.id != null) return `ko-${match.id}`;
  return `g-${match.group}-${match.home}-${match.away}`;
}

// Resultados cargados a mano. La clave es matchId(match).
// Para partidos de grupos: "g-{Grupo}-{home}-{away}"
//   ["g-A-México-Sudáfrica"]: { homeGoals: 2, awayGoals: 1, status: "FT" },
// Para partidos de playoffs: editar directamente el campo `result` en lib/knockout.js.
export const RESULTS = {};

// Capa de resultados EN VIVO: la llena LiveScoresProvider con lo que trae la
// tabla `live_scores` de Supabase (vía lib/liveScores.js). Tiene prioridad
// sobre los cargados a mano. Es un cache a nivel de módulo; los componentes se
// re-renderizan vía el contexto de LiveScoresProvider (no por esta variable).
let LIVE = {};

export function setLiveResults(map) {
  LIVE = map || {};
}

// ---------------------------------------------------------------------------
// Capa de SIMULACIÓN ("Modo simulación · ¿Qué pasa si?").
//
// Cuando está activa, superpone resultados simulados POR ENCIMA de los reales,
// pero SOLO para partidos que todavía no terminaron en la realidad: los ya
// jugados son "la biblia" y nunca se tocan. Esta capa no escribe nunca en
// LIVE/RESULTS; vive aparte y la maneja SimulationProvider. Como toda la app
// lee por getResult(), al activarla la tabla de posiciones y los cruces se
// recalculan solos.
//
// Forma de un override SIM: { homeGoals, awayGoals, status: "FT" } (igual que
// un resultado normal), de modo que computeStandings lo cuente como finalizado.
// ---------------------------------------------------------------------------
let SIM_ACTIVE = false;
let SIM = {};

export function setSimActive(active) {
  SIM_ACTIVE = !!active;
}

export function setSimResults(map) {
  SIM = map || {};
}

export function isSimActive() {
  return SIM_ACTIVE;
}

function realResult(id, staticResult) {
  const live = LIVE[id];
  const manual = RESULTS[id] || staticResult;
  // La API en vivo (football-data.org) no trae penales de eliminatoria: si el
  // marcador quedó igual, el partido queda "FINALIZADO" sin ganador. Si hay un
  // penal cargado a mano (RESULTS o el `result` de lib/knockout.js), lo
  // superponemos sobre el resultado en vivo en vez de descartarlo.
  if (live) {
    if (live.penaltyHome == null && manual?.penaltyHome != null) {
      return { ...live, penaltyHome: manual.penaltyHome, penaltyAway: manual.penaltyAway };
    }
    return live;
  }
  return manual || null;
}

// Estados normalizados que NO son un resultado definitivo: en juego (LIVE),
// entretiempo (HT), suspendido (SUSP), aplazado (POSTP) o cancelado (CANC).
// Es una LISTA (no `status === "FT"`) para que los RESULTS cargados a mano —que
// pueden omitir status (undefined) o traer "FT"— sigan contando como finales.
export const NON_FINAL_STATUS = new Set(["LIVE", "HT", "SUSP", "POSTP", "CANC"]);

// ¿El resultado es definitivo? (tiene goles y no está en un estado no-final).
// Único criterio de "final" para toda la app: tabla de posiciones, proyección de
// cruces y bloqueo de simulación. Un SUSPENDED trae goles pero NO es final.
export function isFinalResult(r) {
  return (
    !!r &&
    r.homeGoals != null &&
    r.awayGoals != null &&
    !NON_FINAL_STATUS.has(r.status)
  );
}

// ¿Estado "raro" sin marcador (aplazado/cancelado) que igual debe mostrar un
// badge en lugar de la hora? (suspendido SÍ tiene marcador, va aparte).
export function isNoScoreStatus(r) {
  return !!r && (r.status === "POSTP" || r.status === "CANC");
}

// ¿El resultado REAL es definitivo? Un partido en vivo, suspendido, aplazado o
// sin resultado no es definitivo y por lo tanto es simulable.
function realIsFinal(r) {
  return isFinalResult(r);
}

// Único accesor que usa la app. Devuelve el resultado o null si no hay.
// Prioridad: simulación (si está activa y el partido no terminó) > en vivo >
// cargado a mano.
export function getResult(match) {
  const id = matchId(match);
  const real = realResult(id, match.result);
  // En modo simulación, un override pisa el resultado real SOLO si el real
  // todavía no es definitivo (regla "solo se simulan los no jugados").
  if (SIM_ACTIVE && !realIsFinal(real) && SIM[id]) return SIM[id];
  return real;
}

// ¿El partido ya tiene un resultado utilizable (con goles cargados)?
export function isPlayed(match) {
  const r = getResult(match);
  return !!r && r.homeGoals != null && r.awayGoals != null;
}

// ¿Este partido se puede simular ahora? (modo activo + no terminado en la
// realidad). Lo usa la vista Partido para mostrar u ocultar el editor.
export function isSimEditable(match) {
  return SIM_ACTIVE && !realIsFinal(realResult(matchId(match)));
}

// ¿Este partido tiene HOY un resultado simulado en vigencia (distinto del real)?
export function isSimulated(match) {
  const id = matchId(match);
  return SIM_ACTIVE && !realIsFinal(realResult(id)) && !!SIM[id];
}
