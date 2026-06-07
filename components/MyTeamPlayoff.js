"use client";

import { useState } from "react";
import { getPlayoffPaths } from "../lib/playoffPath";
import { flag } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";

const ROUND_ICONS = {
  r32: "⚔️",
  r16: "🔥",
  qf:  "💥",
  sf:  "🌟",
  third: "🥉",
  final: "🏆",
};

export default function MyTeamPlayoff({ team, tz }) {
  const [scenario, setScenario] = useState("first");
  const paths = getPlayoffPaths(team);

  if (!paths) {
    return <p className="no-matches">No se pudo trazar el camino para este equipo.</p>;
  }

  const path = scenario === "first" ? paths.first : paths.second;

  return (
    <div className="playoff-path-container">
      <div className="scenario-toggle">
        <button
          className={`scenario-btn ${scenario === "first" ? "active" : ""}`}
          onClick={() => setScenario("first")}
        >
          🥇 Clasifica 1.° del Grupo {paths.group}
        </button>
        <button
          className={`scenario-btn ${scenario === "second" ? "active" : ""}`}
          onClick={() => setScenario("second")}
        >
          🥈 Clasifica 2.° del Grupo {paths.group}
        </button>
      </div>

      <div className="path-steps">
        {path.map((step, idx) => (
          <div className="path-step" key={step.matchId}>
            <div className="step-connector">
              {idx < path.length - 1 && <div className="step-line" />}
            </div>
            <div className={`path-card ${step.roundId === "final" ? "path-card--final" : ""}`}>
              <div className="path-round">
                <span className="path-round-icon">{ROUND_ICONS[step.roundId] || "⚽"}</span>
                <span className="path-round-name">{step.roundName}</span>
              </div>
              <div className="path-details">
                <div className="path-team">
                  {flag(team)} <strong>{team}</strong>
                  {step.opponent ? (
                    <>
                      <span className="path-vs"> vs </span>
                      <span className="path-opp">{step.opponent}</span>
                    </>
                  ) : (
                    <span className="path-tbd"> vs TBD</span>
                  )}
                </div>
                <div className="path-when">
                  📅 {formatDate(step.instant, tz)} · ⏰ {formatTime(step.instant, tz)}
                </div>
                <div className="path-venue">📍 {step.venue}, {step.city}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
