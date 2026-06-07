"use client";

import { useState } from "react";
import { GROUP_MATCHES, kickoff } from "../lib/matches";
import { flag, FLAGS } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";
import MyTeamPlayoff from "./MyTeamPlayoff";

const STORAGE_KEY = "fixture2026.favorites";
const ACTIVE_KEY = "fixture2026.favorites.active";

function TeamLabel({ name }) {
  return (
    <span>
      {flag(name)} {name}
    </span>
  );
}

export default function Favorites({ tz }) {
  const [favorites, setFavorites] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activeTeam, setActiveTeam] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(ACTIVE_KEY) || null;
    }
    return null;
  });

  const [editing, setEditing] = useState(false);
  const [section, setSection] = useState("grupos");

  const allTeams = Object.keys(FLAGS).sort();

  const toggleFavorite = (team) => {
    const updated = favorites.includes(team)
      ? favorites.filter((t) => t !== team)
      : [...favorites, team];
    setFavorites(updated);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Si se elimina el equipo activo, limpiar selección
    if (!updated.includes(activeTeam)) {
      setActiveTeam(updated[0] || null);
      window.localStorage.setItem(ACTIVE_KEY, updated[0] || "");
    }
  };

  const selectTeam = (team) => {
    setActiveTeam(team);
    setSection("grupos");
    window.localStorage.setItem(ACTIVE_KEY, team);
  };

  const matches = activeTeam
    ? GROUP_MATCHES.filter(
        (m) => m.home === activeTeam || m.away === activeTeam
      ).sort((a, b) => kickoff(a) - kickoff(b))
    : [];

  return (
    <div className="myteam-container">
      {/* Header */}
      <div className="myteam-header">
        <div className="myteam-label">
          <span className="myteam-flag">❤️</span>
          <h2>Favoritos</h2>
        </div>
        <button className="btn-change" onClick={() => setEditing((v) => !v)}>
          {editing ? "Listo" : "Editar lista"}
        </button>
      </div>

      {/* Editor de lista */}
      {editing && (
        <div className="team-picker">
          <p className="picker-hint">Marcá los equipos que querés seguir:</p>
          <div className="picker-grid">
            {allTeams.map((team) => (
              <button
                key={team}
                className={`picker-item ${favorites.includes(team) ? "selected" : ""}`}
                onClick={() => toggleFavorite(team)}
              >
                {flag(team)} {team}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sin favoritos */}
      {favorites.length === 0 && !editing && (
        <p className="no-matches">
          Todavía no agregaste favoritos. Tocá "Editar lista" para empezar.
        </p>
      )}

      {/* Lista de favoritos + detalle */}
      {favorites.length > 0 && !editing && (
        <div className="favs-layout">
          {/* Lista lateral */}
          <div className="favs-list">
            {favorites.map((team) => (
              <button
                key={team}
                className={`favs-list-item ${activeTeam === team ? "active" : ""}`}
                onClick={() => selectTeam(team)}
              >
                <span className="favs-flag">{flag(team)}</span>
                <span className="favs-name">{team}</span>
              </button>
            ))}
          </div>

          {/* Detalle del equipo activo */}
          {activeTeam && (
            <div className="favs-detail">
              {/* Tabs internos */}
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

              {section === "grupos" && (
                matches.length === 0 ? (
                  <p className="no-matches">No hay partidos para este equipo.</p>
                ) : (
                  <div className="myteam-matches">
                    {matches.map((m, i) => {
                      const instant = kickoff(m);
                      const isHome = m.home === activeTeam;
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
                            <div className="venue">📍 {m.venue}, {m.city}</div>
                            <div className="group-badge-small">Grupo {m.group}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {section === "playoff" && <MyTeamPlayoff team={activeTeam} tz={tz} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
