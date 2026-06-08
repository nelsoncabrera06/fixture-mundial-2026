"use client";

import { GROUP_NAMES, GROUPS, GROUP_MATCHES, kickoff } from "../lib/matches";
import { flag } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";
import AddToCalendar from "./AddToCalendar";

function TeamLabel({ name }) {
  return (
    <span>
      {flag(name)} {name}
    </span>
  );
}

export default function GroupStage({ tz, onOpenGroup }) {
  return (
    <div className="groups-grid">
      {GROUP_NAMES.map((g) => {
        const matches = GROUP_MATCHES.filter((m) => m.group === g).sort(
          (a, b) => kickoff(a) - kickoff(b)
        );
        return (
          <section className="group-card" key={g}>
            <button
              type="button"
              className="group-link"
              onClick={() => onOpenGroup?.(g)}
              title={`Ver tabla y detalle del Grupo ${g}`}
            >
              <span className="group-badge">Grupo {g}</span>
              <span className="group-link-cta">Ver tabla →</span>
            </button>
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
                    <AddToCalendar
                      home={m.home}
                      away={m.away}
                      venue={m.venue}
                      city={m.city}
                      label={`Grupo ${m.group}`}
                      start={instant}
                      compact
                    />
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
