"use client";

import { useState } from "react";
import { GROUP_MATCHES, kickoff } from "../lib/matches";
import { flag, FLAGS } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";
import MyTeamPlayoff from "./MyTeamPlayoff";
import { useAuth } from "./AuthContext";
import AuthModal from "./AuthModal";

const DEFAULT_TEAM = "Argentina";

function TeamLabel({ name }) {
  return (
    <span>
      {flag(name)} {name}
    </span>
  );
}

export default function MyTeam({ tz }) {
  const { user, ready, updatePrefs } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const [picking, setPicking] = useState(false);
  const [section, setSection] = useState("grupos");

  // Hasta saber si hay sesión, no renderizamos nada (evita parpadeo).
  if (!ready) return null;

  if (!user) {
    return (
      <div className="locked-screen">
        <div className="locked-icon">🔒</div>
        <h2>Iniciá sesión para ver tu equipo</h2>
        <p>Elegí tu selección favorita y seguí todos sus partidos.</p>
        <button className="auth-submit" onClick={() => setAuthOpen(true)}>
          Iniciar sesión
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  const myTeam = user.team || DEFAULT_TEAM;
  const allTeams = Object.keys(FLAGS).sort();

  const matches = GROUP_MATCHES.filter(
    (m) => m.home === myTeam || m.away === myTeam
  ).sort((a, b) => kickoff(a) - kickoff(b));

  const handleSelect = async (team) => {
    setPicking(false);
    await updatePrefs({ team });
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
