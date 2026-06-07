"use client";

import { useState } from "react";
import { GROUP_MATCHES, kickoff } from "../lib/matches";
import { flag, FLAGS } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";
import MyTeamPlayoff from "./MyTeamPlayoff";

const STORAGE_KEY = "fixture2026.myteam";
const DEFAULT_TEAM = "Argentina";

function TeamLabel({ name }) {
  return (
    <span>
      {flag(name)} {name}
    </span>
  );
}

export default function MyTeam({ tz }) {
  const [myTeam, setMyTeam] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_TEAM;
    }
    return DEFAULT_TEAM;
  });

  const [picking, setPicking] = useState(false);
  const [section, setSection] = useState("grupos");

  const allTeams = Object.keys(FLAGS).sort();

  const matches = GROUP_MATCHES.filter(
    (m) => m.home === myTeam || m.away === myTeam
  ).sort((a, b) => kickoff(a) - kickoff(b));

  const handleSelect = (team) => {
    setMyTeam(team);
    window.localStorage.setItem(STORAGE_KEY, team);
    setPicking(false);
  };

  return (
    <div className="myteam-container">
      <div className="myteam-header">
        <div className="myteam-label">
          <span className="myteam-flag">{flag(myTeam)}</span>
          <h2>{myTeam}</h2>
        </div>
        <button className="btn-change" onClick={() => setPicking((v) => !v)}>
          {picking ? "Cancelar" : "Cambiar equipo"}
        </button>
      </div>

      <div className="myteam-tabs">
        <button
          className={`myteam-tab ${section === "grupos" ? "active" : ""}`}
          onClick={() => setSection("grupos")}
        >
          🏟️ Fase de grupos
        </button>
        <button
          className={`myteam-tab ${section === "playoff" ? "active" : ""}`}
          onClick={() => setSection("playoff")}
        >
          🏆 Playoffs
        </button>
      </div>

      {picking && (
        <div className="team-picker">
          <p className="picker-hint">Elegí tu equipo:</p>
          <div className="picker-grid">
            {allTeams.map((team) => (
              <button
                key={team}
                className={`picker-item ${team === myTeam ? "selected" : ""}`}
                onClick={() => handleSelect(team)}
              >
                {flag(team)} {team}
              </button>
            ))}
          </div>
        </div>
      )}

      {section === "grupos" && (
        matches.length === 0 ? (
          <p className="no-matches">No hay partidos para este equipo.</p>
        ) : (
          <div className="myteam-matches">
            {matches.map((m, i) => {
              const instant = kickoff(m);
              const isHome = m.home === myTeam;
              return (
                <div className="match match--highlight" key={i}>
                  <div className="when">
                    <div className="date">{formatDate(instant, tz)}</div>
                    <div className="time">{formatTime(instant, tz)}</div>
                  </div>
                  <div className="vs">
                    <div className="teams">
                      <span className={isHome ? "my-team-name" : ""}>
                        <TeamLabel name={m.home} />
                      </span>
                      <span className="sep">vs</span>
                      <span className={!isHome ? "my-team-name" : ""}>
                        <TeamLabel name={m.away} />
                      </span>
                    </div>
                    <div className="venue">
                      📍 {m.venue}, {m.city}
                    </div>
                    <div className="group-badge-small">Grupo {m.group}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {section === "playoff" && <MyTeamPlayoff team={myTeam} tz={tz} />}
    </div>
  );
}
