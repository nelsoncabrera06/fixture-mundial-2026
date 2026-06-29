"use client";

import { useState } from "react";
import { getPlayoffPaths, getTeamOutcome } from "../lib/playoffPath";
import { flag } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";
import { teamName, roundName } from "../lib/i18n";
import { useLang } from "./LanguageContext";

const ROUND_ICONS = {
  r32: "⚔️",
  r16: "🔥",
  qf:  "💥",
  sf:  "🌟",
  third: "🥉",
  final: "🏆",
};

// Estados de eliminatoria que muestran un subtítulo con cómo clasificó del grupo.
const KO_DONE = new Set([
  "out",
  "runnerup",
  "champion",
  "thirdplace",
  "fourthplace",
  "playingThird",
]);

// Color del badge según el resultado (reusa las clases de medalla/gris).
function outcomeTone(o) {
  if (o.status === "champion") return "first";
  if (o.status === "runnerup" || o.status === "thirdplace") return "second";
  if (o.status === "alive") return o.qualifyAs; // first/second/third
  if (o.status === "playingThird") return "third";
  return "eliminated"; // groups, out, fourthplace
}

// Texto principal del badge.
function outcomeHeadline(o, t, lang) {
  switch (o.status) {
    case "groups":
      return t("path.outcome.groups");
    case "alive":
      return t(`path.outcome.${o.qualifyAs}`, { g: o.group });
    case "out":
      return t("path.ko.out", { round: roundName(o.roundName, lang) });
    default:
      return t(`path.ko.${o.status}`);
  }
}

export default function MyTeamPlayoff({ team, tz }) {
  const { lang, t } = useLang();
  const [scenario, setScenario] = useState("first");

  // Si la fase de grupos ya terminó, sabemos cómo clasificó y hasta dónde llegó.
  const outcome = getTeamOutcome(team);
  if (outcome) {
    const tone = outcomeTone(outcome);
    return (
      <div className="playoff-path-container">
        <div className={`mtp-outcome mtp-outcome--${tone}`}>
          <span className="mtp-outcome-team">
            {flag(team)} <strong>{teamName(team, lang)}</strong>
          </span>
          <span className="mtp-outcome-status">
            {outcomeHeadline(outcome, t, lang)}
          </span>
          {KO_DONE.has(outcome.status) && outcome.qualifyAs && (
            <span className="mtp-outcome-sub">
              {t(`path.qual.${outcome.qualifyAs}`, { g: outcome.group })}
            </span>
          )}
        </div>

        {outcome.status !== "groups" && outcome.path && (
          <>
            <h3 className="mv-list-title">{t("path.route")}</h3>
            <PathSteps team={team} steps={outcome.path} resolved tz={tz} lang={lang} t={t} />
          </>
        )}
      </div>
    );
  }

  // Modo escenarios: la fase de grupos todavía no terminó.
  const paths = getPlayoffPaths(team);
  if (!paths) {
    return <p className="no-matches">{t("path.noPath")}</p>;
  }
  const path = scenario === "first" ? paths.first : paths.second;

  return (
    <div className="playoff-path-container">
      <div className="scenario-toggle">
        <button
          className={`scenario-btn ${scenario === "first" ? "active" : ""}`}
          onClick={() => setScenario("first")}
        >
          {t("path.first", { g: paths.group })}
        </button>
        <button
          className={`scenario-btn ${scenario === "second" ? "active" : ""}`}
          onClick={() => setScenario("second")}
        >
          {t("path.second", { g: paths.group })}
        </button>
      </div>

      <PathSteps team={team} steps={path} tz={tz} lang={lang} t={t} />
    </div>
  );
}

// Renderiza la cadena de pasos r32 → final. Con `resolved`, el rival de cada
// paso ya es un equipo concreto (o null = a definir) y, si el partido se jugó,
// se muestra el marcador resaltando si el equipo ganó o perdió.
function PathSteps({ team, steps, resolved, tz, lang, t }) {
  return (
    <div className="path-steps">
      {steps.map((step, idx) => {
        const result = resolved ? step.teamResult : null; // "W" | "L" | null
        return (
          <div className="path-step" key={step.matchId}>
            <div className="step-connector">
              {idx < steps.length - 1 && <div className="step-line" />}
            </div>
            <div
              className={`path-card ${step.roundId === "final" ? "path-card--final" : ""} ${
                result === "W" ? "path-card--won" : result === "L" ? "path-card--lost" : ""
              }`}
            >
              <div className="path-round">
                <span className="path-round-icon">{ROUND_ICONS[step.roundId] || "⚽"}</span>
                <span className="path-round-name">{roundName(step.roundName, lang)}</span>
              </div>
              <div className="path-details">
                <div className="path-team">
                  {flag(team)} <strong>{teamName(team, lang)}</strong>
                  {step.opponent ? (
                    <>
                      <span className="path-vs">{t("path.vs")}</span>
                      <span className="path-opp">
                        {resolved && <>{flag(step.opponent)} </>}
                        {teamName(step.opponent, lang)}
                      </span>
                    </>
                  ) : (
                    <span className="path-tbd">{t("path.vs")}{t("path.tbd")}</span>
                  )}
                  {result && (
                    <span className={`path-score path-score--${result === "W" ? "won" : "lost"}`}>
                      {step.teamGoals} - {step.oppGoals}
                    </span>
                  )}
                </div>
                <div className="path-when">
                  📅 {formatDate(step.instant, tz, lang)} · ⏰ {formatTime(step.instant, tz, lang)}
                </div>
                <div className="path-venue">📍 {step.venue}, {step.city}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
