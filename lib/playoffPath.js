// ---------------------------------------------------------------------------
// Lógica para trazar el camino de un equipo en la fase eliminatoria.
// Dado un equipo y si termina 1.° o 2.° en su grupo, devuelve la cadena de
// partidos desde la Ronda de 32 hasta la Final.
// ---------------------------------------------------------------------------

import { ROUNDS, kickoff } from "./knockout";
import { GROUPS, GROUP_MATCHES } from "./matches";
import { getResult, isSimulated, isFinalResult } from "./results";
import { computeStandings } from "./standings";
import {
  THIRD_PLACE_COMBINATIONS,
  THIRD_WINNER_ORDER,
} from "./thirdPlaceAllocation";

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
  "86": ["86", "95", "100", "102", "104"],
  "87": ["87", "96", "100", "102", "104"],
  "88": ["88", "95", "100", "102", "104"],
};

// Partido de Ronda de 32 para el 1.° y 2.° de cada grupo (cuadro oficial FIFA).
const GROUP_R32 = {
  A: { first: "79", second: "73" },
  B: { first: "85", second: "73" },
  C: { first: "76", second: "75" },
  D: { first: "81", second: "88" },
  E: { first: "74", second: "78" },
  F: { first: "75", second: "76" },
  G: { first: "82", second: "88" },
  H: { first: "84", second: "86" },
  I: { first: "77", second: "78" },
  J: { first: "86", second: "84" },
  K: { first: "87", second: "83" },
  L: { first: "80", second: "83" },
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

// ¿Terminaron (FT) los 6 partidos del grupo? Un partido en vivo, en entretiempo
// o suspendido NO cuenta como terminado.
function groupComplete(group) {
  const ms = GROUP_MATCHES.filter((m) => m.group === group);
  if (ms.length === 0) return false;
  return ms.every((m) => isFinalResult(getResult(m)));
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

// ---------------------------------------------------------------------------
// PROYECCIÓN DE MEJORES TERCEROS ("3.º B/E/F/I/J").
//
// Clasifican los 8 mejores terceros de los 12 grupos. A qué llave de R32 va
// cada uno depende de QUÉ 8 grupos aporten su tercero: la FIFA lo predefine en
// una tabla de 495 combinaciones (lib/thirdPlaceAllocation.js).
//
// Como el reparto necesita saber los 8 terceros clasificados, solo proyectamos
// cuando los 12 grupos terminaron. Antes de eso el slot queda con su etiqueta
// "3.º X/Y/Z". El estado es "confirmed", salvo que algún grupo tenga un
// resultado simulado (entonces "tentative").
// ---------------------------------------------------------------------------

// Mapa etiqueta-de-tercero → grupo del GANADOR que lo enfrenta (ej.
// "3.º B/E/F/I/J" → "D"), derivado del cuadro estático de Ronda de 32.
const THIRD_SLOT_WINNER = (() => {
  const map = {};
  const r32 = ROUNDS.find((r) => r.id === "r32");
  if (!r32) return map;
  for (const m of r32.matches) {
    const w = /^1\.º Grupo ([A-L])$/.exec(m.home);
    if (w && /^3\.º /.test(m.away || "")) map[m.away] = w[1];
  }
  return map;
})();

function allGroupsComplete() {
  return Object.keys(GROUPS).every((g) => groupComplete(g));
}

function anyGroupSimulated() {
  return GROUP_MATCHES.some((m) => isSimulated(m));
}

// Ranking de los 12 terceros (uno por grupo) por los criterios FIFA disponibles:
// puntos, dif. de gol, goles a favor; desempate final por letra de grupo (la
// FIFA usa fair-play y sorteo, que no modelamos). Devuelve null si algún grupo
// todavía no tiene un 3.º calculable.
function rankThirds() {
  const thirds = Object.keys(GROUPS).map((group) => {
    const row = computeStandings(group)[2];
    return row ? { group, ...row } : null;
  });
  if (thirds.some((t) => !t)) return null;
  thirds.sort(
    (x, y) =>
      y.pts - x.pts ||
      y.dg - x.dg ||
      y.gf - x.gf ||
      x.group.localeCompare(y.group)
  );
  return thirds;
}

// Resuelve el reparto completo de terceros: { byWinner: { D: {team, group} },
// status } o null si todavía no se puede (grupos sin terminar / sin combinación).
function projectThirdAssignment() {
  if (!allGroupsComplete()) return null;
  const ranked = rankThirds();
  if (!ranked) return null;

  const qualified = ranked.slice(0, 8);
  const key = qualified
    .map((r) => r.group)
    .sort()
    .join("");
  const combo = THIRD_PLACE_COMBINATIONS[key];
  if (!combo) return null;

  const teamByGroup = {};
  qualified.forEach((r) => (teamByGroup[r.group] = r.team));

  const byWinner = {};
  THIRD_WINNER_ORDER.forEach((w, i) => {
    const thirdGroup = combo[i];
    byWinner[w] = { team: teamByGroup[thirdGroup], group: thirdGroup };
  });

  return { byWinner, status: anyGroupSimulated() ? "tentative" : "confirmed" };
}

// Resuelve una ranura de tercero ("3.º X/Y/Z") a { team, status } o null.
export function resolveThirdSlot(label) {
  const winnerGroup = THIRD_SLOT_WINNER[label || ""];
  if (!winnerGroup) return null;
  const proj = projectThirdAssignment();
  if (!proj) return null;
  const entry = proj.byWinner[winnerGroup];
  if (!entry || !entry.team) return null;
  return { team: entry.team, status: proj.status };
}

// ---------------------------------------------------------------------------
// PROYECCIÓN DE GANADORES ("Ganador N").
//
// Un slot "Ganador N" se resuelve mirando el resultado del partido N: si ya
// terminó con un ganador claro (sin empate), proyectamos el equipo de la ranura
// ganadora —que a su vez puede ser un "1.º Grupo X" o, recursivamente, otro
// "Ganador M"—. La confianza es "confirmed" solo si el resultado del partido es
// real y definitivo y el equipo de origen también está confirmado; un resultado
// simulado (o que cuelga de uno tentativo) siempre es "tentative".
// ---------------------------------------------------------------------------

// Lookup de partidos eliminatorios a nivel de módulo (ROUNDS es estático).
const MATCH_BY_ID = buildMatchLookup();

// ¿El resultado tiene un ganador definido? (definitivo, con goles y sin empate).
// Un partido suspendido/aplazado no es definitivo, así que no proyecta ganador.
function decisiveResult(r) {
  return isFinalResult(r) && r.homeGoals !== r.awayGoals;
}

// Resuelve cualquier ranura de eliminatorias ("1.º Grupo X" o "Ganador N") a
// { team, status } desde la tabla/resultados en vivo, o null si no se puede.
export function resolveSlot(label, seen = new Set()) {
  const r32 = resolveR32Slot(label);
  if (r32) return r32;

  const third = resolveThirdSlot(label);
  if (third) return third;

  const g = /Ganador (\d+)/.exec(label || "");
  if (!g) return null;
  const id = g[1];
  if (seen.has(id)) return null; // guarda anti-ciclos (no debería pasar)
  seen.add(id);

  const m = MATCH_BY_ID[id];
  if (!m) return null;
  const r = getResult(m);
  if (!decisiveResult(r)) return null;

  const winnerLabel = r.homeGoals > r.awayGoals ? m.home : m.away;
  const sub = resolveSlot(winnerLabel, seen);
  if (!sub) return null;

  const confirmed = !isSimulated(m) && sub.status === "confirmed";
  return { team: sub.team, status: confirmed ? "confirmed" : "tentative" };
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

// ---------------------------------------------------------------------------
// RESULTADO REAL + RUTA DEFINITIVA.
//
// Cuando los 12 grupos terminaron ya sabemos cómo clasificó cada equipo (1.º,
// 2.º, mejor 3.º o eliminado), así que en vez de los dos escenarios hipotéticos
// mostramos una sola ruta con los rivales ya resueltos. Devuelve null si la
// fase de grupos todavía no terminó (la UI cae al modo "escenarios").
// ---------------------------------------------------------------------------

// Arma la ruta r32 → final desde el partido de R32 del equipo, resolviendo el
// rival de cada paso (o null si todavía no se puede, p. ej. una ronda sin jugar).
function buildResolvedPath(r32Id, r32SlotLabel) {
  const chain = BRACKET_CHAIN[r32Id] || [];
  let teamSlot = r32SlotLabel;
  return chain.map((id) => {
    const m = MATCH_BY_ID[id];
    const oppLabel = m.home === teamSlot ? m.away : m.home;
    const opp = resolveSlot(oppLabel);
    const step = {
      matchId: id,
      roundName: m.roundName,
      roundId: m.roundId,
      instant: kickoff(m),
      venue: m.venue,
      city: m.city,
      opponent: opp ? opp.team : null,
      opponentLabel: oppLabel,
    };
    teamSlot = `Ganador ${id}`; // en la ronda siguiente el equipo es "Ganador N"
    return step;
  });
}

export function getTeamOutcome(team) {
  const group = getTeamGroup(team);
  if (!group || !GROUP_R32[group]) return null;
  // La ruta real con rivales definidos necesita los 12 grupos terminados
  // (los terceros y, por ende, varios rivales dependen de TODOS los grupos).
  if (!allGroupsComplete()) return null;

  const standings = computeStandings(group);
  const pos = standings.findIndex((row) => row.team === team); // 0-based
  if (pos < 0) return null;

  if (pos === 0 || pos === 1) {
    const finish = pos === 0 ? "first" : "second";
    const r32Id = GROUP_R32[group][finish];
    const slotLabel = `${pos + 1}.º Grupo ${group}`;
    return {
      status: finish,
      group,
      position: pos + 1,
      path: buildResolvedPath(r32Id, slotLabel),
    };
  }

  if (pos === 2) {
    // ¿Entró como uno de los 8 mejores terceros?
    const proj = projectThirdAssignment();
    const winner =
      proj &&
      Object.keys(proj.byWinner).find((w) => proj.byWinner[w].group === group);
    if (winner) {
      const r32Id = GROUP_R32[winner].first;
      const slotLabel = MATCH_BY_ID[r32Id].away; // la ranura "3.º X/Y/Z"
      return {
        status: "third",
        group,
        position: 3,
        winnerGroup: winner,
        path: buildResolvedPath(r32Id, slotLabel),
      };
    }
    return { status: "eliminated", group, position: 3 };
  }

  return { status: "eliminated", group, position: pos + 1 };
}
