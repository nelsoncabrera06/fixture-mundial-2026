// ---------------------------------------------------------------------------
// TABLA DE POSICIONES — se calcula sola a partir de los resultados cargados
// (lib/results.js). Mientras no haya resultados, todos los equipos quedan en
// cero y se listan en el orden de siembra del grupo.
//
// Criterios de orden (simplificados): puntos, luego diferencia de gol, luego
// goles a favor, luego orden alfabético. FIFA usa más desempates (enfrentamiento
// directo, fair play, sorteo) que dependen del detalle de cada partido; alcanza
// con esto hasta que haga falta más precisión.
// ---------------------------------------------------------------------------

import { GROUPS, GROUP_MATCHES } from "./matches";
import { getResult, isFinalResult } from "./results";

// Fila vacía de la tabla para un equipo.
function emptyRow(team) {
  return { team, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
}

export function computeStandings(group) {
  const teams = GROUPS[group] || [];
  const rows = {};
  teams.forEach((t) => (rows[t] = emptyRow(t)));

  const matches = GROUP_MATCHES.filter((m) => m.group === group);
  let played = 0;

  for (const m of matches) {
    const r = getResult(m);
    // Solo los partidos definitivos suman a la tabla. Un partido en juego, en
    // entretiempo o SUSPENDIDO (que trae goles pero puede cambiar) se muestra
    // pero NO suma hasta que finaliza.
    if (!isFinalResult(r)) continue;
    const h = rows[m.home];
    const a = rows[m.away];
    if (!h || !a) continue;

    played++;
    h.pj++; a.pj++;
    h.gf += r.homeGoals; h.gc += r.awayGoals;
    a.gf += r.awayGoals; a.gc += r.homeGoals;

    if (r.homeGoals > r.awayGoals) {
      h.pg++; h.pts += 3; a.pp++;
    } else if (r.homeGoals < r.awayGoals) {
      a.pg++; a.pts += 3; h.pp++;
    } else {
      h.pe++; a.pe++; h.pts++; a.pts++;
    }
  }

  const arr = Object.values(rows);
  arr.forEach((row) => (row.dg = row.gf - row.gc));

  // Sin partidos jugados: respetar el orden de siembra del grupo.
  if (played === 0) return teams.map((t) => rows[t]);

  arr.sort(
    (x, y) =>
      y.pts - x.pts ||
      y.dg - x.dg ||
      y.gf - x.gf ||
      x.team.localeCompare(y.team)
  );
  return arr;
}
