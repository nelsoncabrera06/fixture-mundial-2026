"use client";

import { GROUP_NAMES, GROUP_MATCHES, kickoff } from "../lib/matches";
import { flag } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";
import { getResult } from "../lib/results";
import { computeStandings } from "../lib/standings";
import AddToCalendar from "./AddToCalendar";

function TeamLabel({ name }) {
  return (
    <span>
      {flag(name)} {name}
    </span>
  );
}

export default function Groups({ tz, group, onSelectGroup }) {
  const active = GROUP_NAMES.includes(group) ? group : GROUP_NAMES[0];

  const standings = computeStandings(active);
  const anyPlayed = standings.some((r) => r.pj > 0);

  const matches = GROUP_MATCHES.filter((m) => m.group === active).sort(
    (a, b) => kickoff(a) - kickoff(b)
  );

  return (
    <div className="groups-detail">
      {/* Selector de grupo */}
      <div className="group-chips">
        {GROUP_NAMES.map((g) => (
          <button
            key={g}
            className={`group-chip ${g === active ? "active" : ""}`}
            onClick={() => onSelectGroup(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <h2 className="gd-title">
        <span className="group-badge">Grupo {active}</span>
      </h2>

      {/* Tabla de posiciones */}
      <div className="table-wrap">
        <table className="standings">
          <thead>
            <tr>
              <th className="st-pos">#</th>
              <th className="st-team">Equipo</th>
              <th title="Partidos jugados">PJ</th>
              <th title="Ganados">PG</th>
              <th title="Empatados">PE</th>
              <th title="Perdidos">PP</th>
              <th title="Goles a favor">GF</th>
              <th title="Goles en contra">GC</th>
              <th title="Diferencia de gol">DG</th>
              <th title="Puntos">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={row.team} className={anyPlayed && i < 2 ? "st-qualify" : ""}>
                <td className="st-pos">{i + 1}</td>
                <td className="st-team">
                  <span className="st-flag">{flag(row.team)}</span>
                  {row.team}
                </td>
                <td>{row.pj}</td>
                <td>{row.pg}</td>
                <td>{row.pe}</td>
                <td>{row.pp}</td>
                <td>{row.gf}</td>
                <td>{row.gc}</td>
                <td>{row.dg > 0 ? `+${row.dg}` : row.dg}</td>
                <td className="st-pts">{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!anyPlayed && (
        <p className="gd-note">
          Todavía no se jugaron partidos de este grupo: la tabla arranca en cero
          y se va actualizando con cada resultado.
        </p>
      )}

      {/* Partidos del grupo */}
      <h3 className="gd-subtitle">Partidos</h3>
      <div className="gd-matches">
        {matches.map((m, i) => {
          const instant = kickoff(m);
          const r = getResult(m);
          const played = !!r && r.homeGoals != null && r.awayGoals != null;
          return (
            <div className="gd-match" key={i}>
              <div className="gd-match-when">
                {formatDate(instant, tz)} · {formatTime(instant, tz)}
                <AddToCalendar
                  home={m.home}
                  away={m.away}
                  venue={m.venue}
                  city={m.city}
                  label={`Grupo ${active}`}
                  start={instant}
                  compact
                />
              </div>
              <div className="gd-match-row">
                <span className="gd-home">
                  <TeamLabel name={m.home} />
                </span>
                {played ? (
                  <span className="gd-score">
                    {r.homeGoals} <span className="gd-dash">-</span> {r.awayGoals}
                  </span>
                ) : (
                  <span className="gd-vs">vs</span>
                )}
                <span className="gd-away">
                  <TeamLabel name={m.away} />
                </span>
              </div>
              <div className="gd-match-venue">
                📍 {m.venue}, {m.city}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
