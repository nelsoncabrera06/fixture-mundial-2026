// ---------------------------------------------------------------------------
// Lógica para trazar el camino de un equipo en la fase eliminatoria.
// Dado un equipo y si termina 1.° o 2.° en su grupo, devuelve la cadena de
// partidos desde la Ronda de 32 hasta la Final.
// ---------------------------------------------------------------------------

import { ROUNDS, kickoff } from "./knockout";
import { GROUPS, GROUP_MATCHES } from "./matches";
import { getResult } from "./results";
import { computeStandings } from "./standings";

// Arma lookup de todos los partidos eliminatorios: id → { ...match, roundName, roundId }
function buildMatchLookup() {
  const lookup = {};
  ROUNDS.forEach((round) => {
    round.matches.forEach((m) => {
      lookup[m.id] = { ...m, roundName: round.name, roundId: round.id };
    });
  });
  return lookup;
}

// Cadena de IDs desde cada partido de Ronda de 32 hasta la Final:
// [r32Id, r16Id, qfId, sfId, finalId]
const BRACKET_CHAIN = {
  "73": ["73", "90", "97", "101", "104"],
  "74": ["74", "89", "97", "101", "104"],
  "75": ["75", "90", "97", "101", "104"],
  "76": ["76", "91", "99", "102", "104"],
  "77": ["77", "89", "97", "101", "104"],
  "78": ["78", "91", "99", "102", "104"],
  "79": ["79", "92", "99", "102", "104"],
  "80": ["80", "92", "99", "102", "104"],
  "81": ["81", "94", "98", "101", "104"],
  "82": ["82", "94", "98", "101", "104"],
  "83": ["83", "93", "98", "101", "104"],
  "84": ["84", "93", "98", "101", "104"],
  "85": ["85", "96", "100", "102", "104"],
  "86": ["86", "96", "100", "102", "104"],
  "87": ["87", "95", "100", "102", "104"],
  "88": ["88", "95", "100", "102", "104"],
};

// Partido de Ronda de 32 para el 1.° y 2.° de cada grupo
const GROUP_R32 = {
  A: { first: "73", second: "77" },
  B: { first: "83", second: "77" },
  C: { first: "74", second: "78" },
  D: { first: "79", second: "86" },
  E: { first: "75", second: "88" },
  F: { first: "78", second: "74" },
  G: { first: "80", second: "86" },
  H: { first: "82", second: "84" },
  I: { first: "76", second: "81" },
  J: { first: "84", second: "82" },
  K: { first: "85", second: "87" },
  L: { first: "87", second: "81" },
};

// ---------------------------------------------------------------------------
// PROYECCIÓN DE CRUCES DE RONDA DE 32 a partir de la tabla en vivo.
//
// Los slots de R32 vienen como "1.º Grupo A" / "2.º Grupo F" (posición de grupo)
// o "3.º C/E/F/H/I" (mejores terceros). Solo los dos primeros se pueden resolver
// a un equipo concreto desde la tabla del grupo; los terceros dependen del
// ranking cruzado entre grupos + tabla de asignación de FIFA, así que no se
// resuelven acá.
//
// Estado de un slot resuelto:
//   "confirmed" → los 6 partidos del grupo ya terminaron: 1.º/2.º están sellados.
//   "tentative" → el grupo arrancó pero todavía faltan partidos: puede cambiar.
// ---------------------------------------------------------------------------

// ¿Terminaron (FT) los 6 partidos del grupo? Un partido en vivo no cuenta.
function groupComplete(group) {
  const ms = GROUP_MATCHES.filter((m) => m.group === group);
  if (ms.length === 0) return false;
  return ms.every((m) => {
    const r = getResult(m);
    return (
      r &&
      r.homeGoals != null &&
      r.awayGoals != null &&
      r.status !== "LIVE" &&
      r.status !== "HT"
    );
  });
}

// Dado el label de un slot de R32, devuelve { team, status } si se puede
// proyectar desde la tabla del grupo, o null si no (terceros, "Ganador N",
// equipo ya cargado a mano, o grupo sin partidos jugados).
export function resolveR32Slot(label) {
  const m = /^([12])\.º Grupo ([A-L])$/.exec(label || "");
  if (!m) return null;
  const pos = m[1] === "1" ? 0 : 1;
  const group = m[2];
  const standings = computeStandings(group);
  // Sin partidos jugados la "tabla" es solo el orden de siembra: no proyectamos.
  if (!standings.some((row) => row.pj > 0)) return null;
  const row = standings[pos];
  if (!row) return null;
  return { team: row.team, status: groupComplete(group) ? "confirmed" : "tentative" };
}

// ¿Hay al menos un cruce de R32 proyectable hoy? Sirve para mostrar la leyenda
// de colores solo cuando ya tiene sentido (algún grupo arrancó).
export function hasR32Projections() {
  const r32 = ROUNDS.find((r) => r.id === "r32");
  if (!r32) return false;
  return r32.matches.some(
    (m) => resolveR32Slot(m.home) || resolveR32Slot(m.away)
  );
}

export function getTeamGroup(team) {
  for (const [group, teams] of Object.entries(GROUPS)) {
    if (teams.includes(team)) return group;
  }
  return null;
}

// Dado el partido y el label del slot del equipo (ej. "1.º Grupo J"),
// devuelve la descripción del rival.
function getOpponent(match, slotLabel) {
  if (match.home === slotLabel) return match.away;
  if (match.away === slotLabel) return match.home;
  return `${match.home} · ${match.away}`;
}

// Devuelve los dos caminos posibles para el equipo: clasificando 1.° o 2.°
// Cada camino es un array de 5 pasos: r32 → r16 → qf → sf → final
export function getPlayoffPaths(team) {
  const group = getTeamGroup(team);
  if (!group || !GROUP_R32[group]) return null;

  const lookup = buildMatchLookup();

  const buildPath = (finish) => {
    const r32Id = GROUP_R32[group][finish];
    const chain = BRACKET_CHAIN[r32Id];
    const slotLabel = `${finish === "first" ? "1" : "2"}.º Grupo ${group}`;

    return chain.map((id, idx) => {
      const m = lookup[id];
      const instant = kickoff(m);
      const opponent = idx === 0 ? getOpponent(m, slotLabel) : null;
      return {
        matchId: id,
        roundName: m.roundName,
        roundId: m.roundId,
        instant,
        venue: m.venue,
        city: m.city,
        opponent,
      };
    });
  };

  return {
    group,
    first: buildPath("first"),
    second: buildPath("second"),
  };
}
