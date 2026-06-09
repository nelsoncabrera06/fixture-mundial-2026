"use client";

import { useState } from "react";
import { GROUP_MATCHES, kickoff } from "../lib/matches";
import { flag, FLAGS } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";
import MyTeamPlayoff from "./MyTeamPlayoff";
import { useAuth } from "./AuthContext";
import AuthModal from "./AuthModal";

function TeamLabel({ name }) {
  return (
    <span>
      {flag(name)} {name}
    </span>
  );
}

export default function Favorites({ tz }) {
  const { user, ready, updatePrefs } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // `activeTeam` (qué favorito se está viendo) es solo estado de UI; la LISTA
  // de favoritos vive en la DB (profiles.favorites).
  const [activeTeam, setActiveTeam] = useState(null);
  const [editing, setEditing] = useState(false);
  const [section, setSection] = useState("grupos");
  const [saveError, setSaveError] = useState("");

  // Hasta saber si hay sesión, no renderizamos nada (evita parpadeo).
  if (!ready) return null;

  if (!user) {
    return (
      <div className="locked-screen">
        <div className="locked-icon">🔒</div>
        <h2>Iniciá sesión para ver tus favoritos</h2>
        <p>Armá tu lista de equipos y seguí todos sus partidos.</p>
        <button className="auth-submit" onClick={() => setAuthOpen(true)}>
          Iniciar sesión
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  const allTeams = Object.keys(FLAGS).sort();
  const favorites = user.favorites || [];

  // Favorito mostrado: el seleccionado si sigue en la lista; si no, el primero.
  const effectiveActive =
    activeTeam && favorites.includes(activeTeam) ? activeTeam : favorites[0] || null;

  const toggleFavorite = async (team) => {
    const updated = favorites.includes(team)
      ? favorites.filter((t) => t !== team)
      : [...favorites, team];
    // Guarda en la DB (profiles.favorites); el contexto re-renderiza al volver.
    setSaveError("");
    try {
      await updatePrefs({ favorites: updated });
    } catch (e) {
      setSaveError(e?.message || "No se pudo guardar el favorito.");
    }
  };

  const selectTeam = (team) => {
    setActiveTeam(team);
    setSection("grupos");
  };

  const matches = effectiveActive
    ? GROUP_MATCHES.filter(
        (m) => m.home === effectiveActive || m.away === effectiveActive
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
          {saveError && <p className="contact-error">⚠️ {saveError}</p>}
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
                className={`favs-list-item ${effectiveActive === team ? "active" : ""}`}
                onClick={() => selectTeam(team)}
              >
                <span className="favs-flag">{flag(team)}</span>
                <span className="favs-name">{team}</span>
              </button>
            ))}
          </div>

          {/* Detalle del equipo activo */}
          {effectiveActive && (
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
                      const isHome = m.home === effectiveActive;
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

              {section === "playoff" && <MyTeamPlayoff team={effectiveActive} tz={tz} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
