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

// Único accesor que usa la app. Devuelve el resultado o null si no hay.
// Prioridad: en vivo > cargado a mano.
export function getResult(match) {
  const id = matchId(match);
  return LIVE[id] || RESULTS[id] || null;
}

// ¿El partido ya tiene un resultado utilizable (con goles cargados)?
export function isPlayed(match) {
  const r = getResult(match);
  return !!r && r.homeGoals != null && r.awayGoals != null;
}
