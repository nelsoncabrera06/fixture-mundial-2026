"use client";

import { GROUP_NAMES, GROUPS, GROUP_MATCHES, kickoff } from "../lib/matches";
import { flag } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";

function TeamLabel({ name }) {
  return (
    <span>
      {flag(name)} {name}
    </span>
  );
}

export default function GroupStage({ tz }) {
  return (
    <div className="groups-grid">
      {GROUP_NAMES.map((g) => {
        const matches = GROUP_MATCHES.filter((m) => m.group === g).sort(
          (a, b) => kickoff(a) - kickoff(b)
        );
        return (
          <section className="group-card" key={g}>
            <h2>
              <span className="group-badge">Grupo {g}</span>
            </h2>
            <ul className="team-list">
              {GROUPS[g].map((team) => (
                <li key={team}>
                  {flag(team)} {team}
                </li>
              ))}
            </ul>

            {matches.map((m, i) => {
              const instant = kickoff(m);
              return (
                <div className="match" key={i}>
                  <div className="when">
                    <div className="date">{formatDate(instant, tz)}</div>
                    <div className="time">{formatTime(instant, tz)}</div>
                  </div>
                  <div className="vs">
                    <div className="teams">
                      <TeamLabel name={m.home} />
                      <span className="sep">vs</span>
                      <TeamLabel name={m.away} />
                    </div>
                    <div className="venue">
                      📍 {m.venue}, {m.city}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
