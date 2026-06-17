"use client";

// ---------------------------------------------------------------------------
// VISTA "PARTIDO" — detalle de un partido específico.
//
// Dos modos:
//  - Sin partido elegido: un selector en cascada (instancia → grupo → partido).
//  - Con partido elegido: la ficha del partido al estilo Google (marcador,
//    estado/minuto, fecha, sede y los puntos de cada equipo en la tabla).
//
// Por ahora sólo mostramos lo que tenemos en los datos (marcador + estado +
// minuto, vía lib/results.js). Formaciones, goleadores, tarjetas y estadísticas
// quedan como "próximamente".
// ---------------------------------------------------------------------------

import { useState } from "react";
import { GROUP_NAMES, GROUP_MATCHES, kickoff } from "../lib/matches";
import { ROUNDS } from "../lib/knockout";
import { flag } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";
import { teamName, roundName } from "../lib/i18n";
import { getResult, matchId, isSimEditable, isSimulated } from "../lib/results";
import { computeStandings } from "../lib/standings";
import { useLang } from "./LanguageContext";
import { useLiveResults } from "./LiveScoresProvider";
import { useSimulation } from "./SimulationContext";
import LiveBadge from "./LiveBadge";
import AddToCalendar from "./AddToCalendar";

// Nombre de ronda (en español) de un partido de eliminatorias, según su id.
const ROUND_BY_ID = {};
ROUNDS.forEach((r) => r.matches.forEach((m) => (ROUND_BY_ID[m.id] = r.name)));

function isGroupMatch(m) {
  return !!m && m.group != null;
}
function roundOf(m) {
  if (!m || m.id == null) return null;
  return ROUND_BY_ID[m.id] || null;
}

export default function MatchView({ tz, match, onSelect, onClear }) {
  if (match) {
    // key por partido: reinicia el estado del editor al cambiar de partido.
    return (
      <MatchDetail key={matchId(match)} match={match} tz={tz} onBack={onClear} />
    );
  }
  return <MatchPicker tz={tz} onPick={onSelect} />;
}

// ── Selector en cascada: instancia → (grupo) → partido ──────────────────────
function MatchPicker({ tz, onPick }) {
  const { lang, t } = useLang();
  useLiveResults();
  // "grupos" o el id de una ronda ("r32", "r16", ...).
  const [stage, setStage] = useState("grupos");
  const [group, setGroup] = useState("A");

  let matches;
  if (stage === "grupos") {
    matches = GROUP_MATCHES.filter((m) => m.group === group);
  } else {
    const round = ROUNDS.find((r) => r.id === stage);
    matches = round ? round.matches : [];
  }
  matches = [...matches].sort((a, b) => kickoff(a) - kickoff(b));

  return (
    <div className="matchview">
      <p className="tz-text" style={{ marginTop: 0, marginBottom: 18 }}>
        {t("match.pick.sub")}
      </p>

      <div className="mv-picker">
        <label className="mv-field">
          <span className="mv-field-label">{t("match.pick.instance")}</span>
          <select
            className="mv-select"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="grupos">{t("match.stage.groups")}</option>
            {ROUNDS.map((r) => (
              <option key={r.id} value={r.id}>
                {roundName(r.name, lang)}
              </option>
            ))}
          </select>
        </label>

        {stage === "grupos" && (
          <label className="mv-field">
            <span className="mv-field-label">{t("match.pick.group")}</span>
            <select
              className="mv-select"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              {GROUP_NAMES.map((g) => (
                <option key={g} value={g}>
                  {t("group.badge", { g })}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <h3 className="mv-list-title">{t("match.pick.match")}</h3>
      <div className="mv-list">
        {matches.map((m, i) => {
          const instant = kickoff(m);
          const r = getResult(m);
          const played = !!r && r.homeGoals != null && r.awayGoals != null;
          return (
            <button
              type="button"
              className="mv-item"
              key={i}
              onClick={() => onPick(m)}
            >
              <span className="mv-item-when">
                {formatDate(instant, tz, lang)} · {formatTime(instant, tz, lang)}
              </span>
              <span className="mv-item-teams">
                <span className="mv-item-team">
                  {flag(m.home)} {teamName(m.home, lang)}
                </span>
                {played ? (
                  <span className="mv-item-score">
                    {r.homeGoals} - {r.awayGoals}
                  </span>
                ) : (
                  <span className="mv-item-vs">{t("vs")}</span>
                )}
                <span className="mv-item-team mv-item-team--away">
                  {flag(m.away)} {teamName(m.away, lang)}
                </span>
              </span>
              <span className="mv-item-arrow">→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Ficha de un partido ─────────────────────────────────────────────────────
function MatchDetail({ match, tz, onBack }) {
  const { lang, t } = useLang();
  useLiveResults(); // re-render cuando llegan marcadores nuevos
  const sim = useSimulation();
  void sim.version; // re-render al guardar/quitar una simulación
  const instant = kickoff(match);
  const r = getResult(match);
  const played = !!r && r.homeGoals != null && r.awayGoals != null;
  const editable = isSimEditable(match); // modo sim + partido no jugado
  const simulated = isSimulated(match); // tiene un resultado simulado en vigencia
  // Estado del editor; se reinicia al cambiar de partido (key en MatchView).
  const [h, setH] = useState(simulated && r ? r.homeGoals : 0);
  const [a, setA] = useState(simulated && r ? r.awayGoals : 0);
  const group = isGroupMatch(match) ? match.group : null;
  const label = group
    ? t("group.badge", { g: group })
    : roundName(roundOf(match), lang);

  // Tabla del grupo (sólo fase de grupos). Se calcula sola a partir de los
  // resultados cargados; los 2 primeros (cuando ya se jugó algo) quedan
  // resaltados como clasificados.
  const standings = group ? computeStandings(group) : null;
  const anyPlayed = standings ? standings.some((r) => r.pj > 0) : false;

  return (
    <div className="matchview">
      <button type="button" className="mv-back" onClick={onBack}>
        {t("match.back")}
      </button>

      <div className={`md-card ${played && r.status === "LIVE" ? "md-card--live" : ""}`}>
        <div className="md-top">
          <span className="md-stage">{label}</span>
          {simulated ? (
            <span className="md-sim-chip">🧪 {t("sim.badge")}</span>
          ) : played && r.status ? (
            <LiveBadge status={r.status} elapsed={r.elapsed} />
          ) : (
            <span className="md-scheduled">{t("match.scheduled")}</span>
          )}
        </div>

        <div className="md-score">
          <div className="md-side">
            <span className="md-flag">{flag(match.home)}</span>
            <span className="md-name">{teamName(match.home, lang)}</span>
          </div>
          <div className="md-mid">
            {played ? (
              <span className="md-num">
                {r.homeGoals} <span className="md-dash">-</span> {r.awayGoals}
              </span>
            ) : (
              <span className="md-vs">{t("vs")}</span>
            )}
          </div>
          <div className="md-side">
            <span className="md-flag">{flag(match.away)}</span>
            <span className="md-name">{teamName(match.away, lang)}</span>
          </div>
        </div>

        <div className="md-info">
          <div className="md-info-row">
            📅 {formatDate(instant, tz, lang)} · {formatTime(instant, tz, lang)}
          </div>
          <div className="md-info-row">
            📍 {match.venue}, {match.city}
          </div>
        </div>

        <div className="md-cal">
          <AddToCalendar
            home={match.home}
            away={match.away}
            venue={match.venue}
            city={match.city}
            label={label}
            start={instant}
          />
        </div>
      </div>

      {editable && (
        <div className="md-sim">
          <div className="md-sim-title">🧪 {t("sim.edit.title")}</div>
          <p className="md-sim-hint">{t("sim.edit.hint")}</p>
          <div className="md-sim-board">
            <div className="md-sim-side">
              <span className="md-flag">{flag(match.home)}</span>
              <span className="md-sim-name">{teamName(match.home, lang)}</span>
              <Stepper value={h} onChange={setH} />
            </div>
            <span className="md-sim-sep">-</span>
            <div className="md-sim-side md-sim-side--away">
              <Stepper value={a} onChange={setA} />
              <span className="md-sim-name">{teamName(match.away, lang)}</span>
              <span className="md-flag">{flag(match.away)}</span>
            </div>
          </div>
          <div className="md-sim-actions">
            <button
              type="button"
              className="md-sim-save"
              onClick={() => sim.saveMatch(match, h, a)}
            >
              {t("sim.edit.save")}
            </button>
            {simulated && (
              <button
                type="button"
                className="md-sim-clear"
                onClick={() => sim.clearMatch(match)}
              >
                {t("sim.edit.clear")}
              </button>
            )}
          </div>
        </div>
      )}

      {group && standings && (
        <div className="md-standings">
          <h3 className="md-section-title">
            {t("match.standings.title")} · {t("group.badge", { g: group })}
          </h3>
          <div className="table-wrap">
            <table className="standings">
              <thead>
                <tr>
                  <th className="st-pos">#</th>
                  <th className="st-team">{t("standings.team")}</th>
                  <th title={t("st.pj.t")}>{t("st.pj")}</th>
                  <th title={t("st.pg.t")}>{t("st.pg")}</th>
                  <th title={t("st.pe.t")}>{t("st.pe")}</th>
                  <th title={t("st.pp.t")}>{t("st.pp")}</th>
                  <th title={t("st.gf.t")}>{t("st.gf")}</th>
                  <th title={t("st.gc.t")}>{t("st.gc")}</th>
                  <th title={t("st.dg.t")}>{t("st.dg")}</th>
                  <th title={t("st.pts.t")}>{t("st.pts")}</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => {
                  const isMatchTeam =
                    row.team === match.home || row.team === match.away;
                  const classes = [
                    anyPlayed && i < 2 ? "st-qualify" : "",
                    isMatchTeam ? "st-current" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <tr key={row.team} className={classes}>
                      <td className="st-pos">{i + 1}</td>
                      <td className="st-team">
                        <span className="st-flag">{flag(row.team)}</span>
                        {teamName(row.team, lang)}
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
                  );
                })}
              </tbody>
            </table>
          </div>
          {!anyPlayed && <p className="gd-note">{t("groups.noMatches")}</p>}
        </div>
      )}
    </div>
  );
}

// Control +/- de goles para el editor de simulación.
function Stepper({ value, onChange }) {
  return (
    <span className="md-stepper">
      <button
        type="button"
        className="md-stepper-btn"
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label="−"
      >
        −
      </button>
      <span className="md-stepper-val">{value}</span>
      <button
        type="button"
        className="md-stepper-btn"
        onClick={() => onChange(value + 1)}
        aria-label="+"
      >
        +
      </button>
    </span>
  );
}
