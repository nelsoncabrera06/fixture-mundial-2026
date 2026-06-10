"use client";

import { GROUP_NAMES, GROUPS, GROUP_MATCHES, kickoff } from "../lib/matches";
import { flag } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";
import { teamName } from "../lib/i18n";
import { getResult } from "../lib/results";
import { useLang } from "./LanguageContext";
import { useLiveResults } from "./LiveScoresProvider";
import LiveBadge from "./LiveBadge";
import AddToCalendar from "./AddToCalendar";

function TeamLabel({ name, lang }) {
  return (
    <span>
      {flag(name)} {teamName(name, lang)}
    </span>
  );
}

export default function GroupStage({ tz, onOpenGroup }) {
  const { lang, t } = useLang();
  useLiveResults(); // re-render cuando llegan marcadores nuevos
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
              title={t("group.seeDetailTitle", { g })}
            >
              <span className="group-badge">{t("group.badge", { g })}</span>
              <span className="group-link-cta">{t("group.seeTable")}</span>
            </button>
            <ul className="team-list">
              {GROUPS[g].map((team) => (
                <li key={team}>
                  {flag(team)} {teamName(team, lang)}
                </li>
              ))}
            </ul>

            {matches.map((m, i) => {
              const instant = kickoff(m);
              const r = getResult(m);
              const played = !!r && r.homeGoals != null && r.awayGoals != null;
              return (
                <div className="match" key={i}>
                  <div className="when">
                    <div className="date">{formatDate(instant, tz, lang)}</div>
                    <div className="time">{formatTime(instant, tz, lang)}</div>
                    <AddToCalendar
                      home={m.home}
                      away={m.away}
                      venue={m.venue}
                      city={m.city}
                      label={t("group.badge", { g: m.group })}
                      start={instant}
                      compact
                    />
                  </div>
                  <div className="vs">
                    {played && (
                      <div className="match-badge">
                        <LiveBadge status={r.status} elapsed={r.elapsed} />
                      </div>
                    )}
                    <div className="teams">
                      <TeamLabel name={m.home} lang={lang} />
                      {played ? (
                        <span className="sep score">
                          {r.homeGoals} - {r.awayGoals}
                        </span>
                      ) : (
                        <span className="sep">{t("vs")}</span>
                      )}
                      <TeamLabel name={m.away} lang={lang} />
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
