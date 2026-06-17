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
// Ejemplo (descomentar y completar cuando se juegue):
//   ["g-A-México-Sudáfrica"]: { homeGoals: 2, awayGoals: 1, status: "FT" },
export const RESULTS = {
  // Todavía no empezó el Mundial: sin resultados.
};

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

function realResult(id) {
  return LIVE[id] || RESULTS[id] || null;
}

// ¿El resultado REAL es definitivo (FT con goles)? Un partido en vivo, en
// entretiempo o sin resultado no es definitivo y por lo tanto es simulable.
function realIsFinal(r) {
  return (
    !!r &&
    r.homeGoals != null &&
    r.awayGoals != null &&
    r.status !== "LIVE" &&
    r.status !== "HT"
  );
}

// Único accesor que usa la app. Devuelve el resultado o null si no hay.
// Prioridad: simulación (si está activa y el partido no terminó) > en vivo >
// cargado a mano.
export function getResult(match) {
  const id = matchId(match);
  const real = realResult(id);
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
