"use client";

import { GROUP_NAMES, GROUP_MATCHES, kickoff } from "../lib/matches";
import { flag } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";
import { teamName } from "../lib/i18n";
import { useLang } from "./LanguageContext";
import { getResult, isNoScoreStatus } from "../lib/results";
import { computeStandings } from "../lib/standings";
import { useLiveResults } from "./LiveScoresProvider";
import { useOpenMatch } from "./MatchNavContext";
import LiveBadge from "./LiveBadge";
import AddToCalendar from "./AddToCalendar";

function TeamLabel({ name, lang }) {
  return (
    <span>
      {flag(name)} {teamName(name, lang)}
    </span>
  );
}

export default function Groups({ tz, group, onSelectGroup }) {
  const { lang, t } = useLang();
  useLiveResults(); // re-render cuando llegan marcadores nuevos
  const openMatch = useOpenMatch();
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
        <span className="group-badge">{t("group.badge", { g: active })}</span>
      </h2>

      {/* Tabla de posiciones */}
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
            {standings.map((row, i) => (
              <tr key={row.team} className={anyPlayed && i < 2 ? "st-qualify" : ""}>
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
            ))}
          </tbody>
        </table>
      </div>

      {!anyPlayed && (
        <p className="gd-note">{t("groups.noMatches")}</p>
      )}

      {/* Partidos del grupo */}
      <h3 className="gd-subtitle">{t("groups.matches")}</h3>
      <div className="gd-matches">
        {matches.map((m, i) => {
          const instant = kickoff(m);
          const r = getResult(m);
          const played = !!r && r.homeGoals != null && r.awayGoals != null;
          const noScore = isNoScoreStatus(r); // aplazado/cancelado: badge sin marcador
          return (
            <div
              className="gd-match gd-match--clickable"
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => openMatch(m)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openMatch(m);
                }
              }}
            >
              <div className="gd-match-when">
                {formatDate(instant, tz, lang)} · {formatTime(instant, tz, lang)}
                <span className="atc-stop" onClick={(e) => e.stopPropagation()}>
                  <AddToCalendar
                    home={m.home}
                    away={m.away}
                    venue={m.venue}
                    city={m.city}
                    label={t("group.badge", { g: active })}
                    start={instant}
                    compact
                  />
                </span>
              </div>
              <div className="gd-match-row">
                <span className="gd-home">
                  <TeamLabel name={m.home} lang={lang} />
                </span>
                {played ? (
                  <span className="gd-score">
                    {r.homeGoals} <span className="gd-dash">-</span> {r.awayGoals}
                  </span>
                ) : (
                  <span className="gd-vs">{t("vs")}</span>
                )}
                <span className="gd-away">
                  <TeamLabel name={m.away} lang={lang} />
                </span>
              </div>
              {((played && r.status) || noScore) && (
                <div className="gd-match-badge">
                  <LiveBadge status={r.status} elapsed={r.elapsed} />
                </div>
              )}
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
