// ---------------------------------------------------------------------------
// MARCADORES EN VIVO — puente entre la tabla `live_scores` de Supabase (que la
// llena la Edge Function `sync-scores` desde football-data.org) y los partidos
// de la app.
//
// football-data manda los nombres en INGLÉS; nuestros datos están en español.
// FD_TO_ES traduce de uno a otro. El emparejado se hace por PAR de equipos
// (sin importar quién es local), porque en sedes neutrales la designación
// local/visitante de la fuente puede no coincidir con la nuestra.
// ---------------------------------------------------------------------------

import { GROUP_MATCHES } from "./matches";
import { ROUNDS } from "./knockout";
import { matchId } from "./results";
import { resolveSlot } from "./playoffPath";

// Nombre de football-data.org → nombre en español (clave de nuestros datos).
// Generado a partir del endpoint /competitions/WC/matches del torneo.
export const FD_TO_ES = {
  "Algeria": "Argelia",
  "Argentina": "Argentina",
  "Australia": "Australia",
  "Austria": "Austria",
  "Belgium": "Bélgica",
  "Bosnia-Herzegovina": "Bosnia y Herzegovina",
  "Brazil": "Brasil",
  "Canada": "Canadá",
  "Ivory Coast": "Costa de Marfil",
  "Congo DR": "RD del Congo",
  "Colombia": "Colombia",
  "Cape Verde Islands": "Cabo Verde",
  "Croatia": "Croacia",
  "Curaçao": "Curazao",
  "Czechia": "República Checa",
  "Ecuador": "Ecuador",
  "Egypt": "Egipto",
  "England": "Inglaterra",
  "Spain": "España",
  "France": "Francia",
  "Germany": "Alemania",
  "Ghana": "Ghana",
  "Haiti": "Haití",
  "Iran": "Irán",
  "Iraq": "Irak",
  "Jordan": "Jordania",
  "Japan": "Japón",
  "South Korea": "Corea del Sur",
  "Saudi Arabia": "Arabia Saudita",
  "Morocco": "Marruecos",
  "Mexico": "México",
  "Netherlands": "Países Bajos",
  "Norway": "Noruega",
  "New Zealand": "Nueva Zelanda",
  "Panama": "Panamá",
  "Paraguay": "Paraguay",
  "Portugal": "Portugal",
  "Qatar": "Catar",
  "South Africa": "Sudáfrica",
  "Scotland": "Escocia",
  "Senegal": "Senegal",
  "Switzerland": "Suiza",
  "Sweden": "Suecia",
  "Tunisia": "Túnez",
  "Turkey": "Turquía",
  "Uruguay": "Uruguay",
  "United States": "Estados Unidos",
  "Uzbekistan": "Uzbekistán",
};

// Clave de par de equipos independiente del orden local/visitante.
function pairKey(a, b) {
  return [a, b].sort().join(" || ");
}

// Índice: par de equipos (en español) → nuestro objeto partido. Se arma una
// sola vez. Los cruces de playoffs con rivales "Por definir"/"Ganador N" no
// entran acá hasta que se carguen equipos reales en lib/knockout.js.
const REAL_TEAMS = new Set(Object.values(FD_TO_ES));
const PAIR_INDEX = (() => {
  const idx = new Map();
  const all = [
    ...GROUP_MATCHES,
    ...ROUNDS.flatMap((r) => r.matches),
  ];
  for (const m of all) {
    if (REAL_TEAMS.has(m.home) && REAL_TEAMS.has(m.away)) {
      idx.set(pairKey(m.home, m.away), m);
    }
  }
  return idx;
})();

// Normaliza el estado de football-data a lo que usa la app.
//   IN_PLAY / LIVE        → "LIVE"
//   PAUSED (entretiempo)  → "HT"
//   FINISHED / AWARDED    → "FT"   (un walkover 3-0 también es final)
//   SUSPENDED             → "SUSP" (cortado; trae el marcador del momento)
//   POSTPONED             → "POSTP" (aplazado; sin marcador)
//   CANCELLED             → "CANC"  (cancelado; sin marcador)
//   resto (programado…)   → null (todavía sin resultado mostrable)
function normalizeStatus(s) {
  switch (s) {
    case "IN_PLAY":
    case "LIVE":
      return "LIVE";
    case "PAUSED":
      return "HT";
    case "FINISHED":
    case "AWARDED":
      return "FT";
    case "SUSPENDED":
      return "SUSP";
    case "POSTPONED":
      return "POSTP";
    case "CANCELLED":
      return "CANC";
    default:
      return null;
  }
}

// Convierte las filas crudas de `live_scores` en el mapa que entiende
// lib/results.js: { [matchId]: { homeGoals, awayGoals, status, elapsed } }.
// Orienta los goles a NUESTRO local/visitante.
export function rowsToResults(rows) {
  const out = {};
  for (const row of rows || []) {
    const esHome = FD_TO_ES[row.home_team];
    const esAway = FD_TO_ES[row.away_team];
    if (!esHome || !esAway) continue;

    let match = PAIR_INDEX.get(pairKey(esHome, esAway));
    // null = usar match.home; true/false = orientación ya resuelta dinámicamente
    let resolvedSameOrder = null;
    if (!match) {
      // Partido eliminatorio con slots aún sin actualizar en knockout.js:
      // resolvemos dinámicamente usando los resultados de grupos ya cargados.
      for (const round of ROUNDS) {
        for (const m of round.matches) {
          const h = resolveSlot(m.home);
          const a = resolveSlot(m.away);
          if (h && a) {
            if (h.team === esHome && a.team === esAway) {
              match = m;
              resolvedSameOrder = true;
              break;
            } else if (h.team === esAway && a.team === esHome) {
              match = m;
              resolvedSameOrder = false;
              break;
            }
          }
        }
        if (match) break;
      }
    }
    if (!match) continue;

    const status = normalizeStatus(row.status_short);
    if (status == null) continue; // programado: sin marcador todavía

    // ¿El "local" de la fuente coincide con nuestro local?
    // Para partidos eliminatorios resueltos dinámicamente, match.home es todavía
    // un slot string ("1.º Grupo C"), no un equipo real — usamos la orientación
    // capturada en el loop; para partidos estáticos, comparamos directamente.
    const sameOrder = resolvedSameOrder !== null ? resolvedSameOrder : esHome === match.home;
    let hg = sameOrder ? row.home_goals : row.away_goals;
    let ag = sameOrder ? row.away_goals : row.home_goals;
    // Penales: también se orientan según sameOrder.
    const hp = row.home_penalties != null
      ? (sameOrder ? row.home_penalties : row.away_penalties)
      : null;
    const ap = row.away_penalties != null
      ? (sameOrder ? row.away_penalties : row.home_penalties)
      : null;

    // En vivo / entretiempo los goles nulos al inicio se muestran como 0.
    // Un SUSPENDIDO conserva el marcador real del momento (no se fuerza a 0).
    if (status === "LIVE" || status === "HT") {
      hg = hg ?? 0;
      ag = ag ?? 0;
    }
    // APLAZADO / CANCELADO no tienen marcador: se emiten igual (goles null) para
    // poder mostrar el badge en lugar de la hora. El resto sí debe traer score.
    const noScore = status === "POSTP" || status === "CANC";
    if (!noScore && (hg == null || ag == null)) continue;

    out[matchId(match)] = {
      homeGoals: hg,
      awayGoals: ag,
      ...(hp != null && ap != null ? { penaltyHome: hp, penaltyAway: ap } : {}),
      status,
      elapsed: row.elapsed ?? null,
    };
  }
  return out;
}
