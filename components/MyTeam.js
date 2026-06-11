"use client";

import { useState } from "react";
import { GROUP_MATCHES, kickoff } from "../lib/matches";
import { flag, FLAGS } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";
import { teamName } from "../lib/i18n";
import { useLang } from "./LanguageContext";
import { useOpenMatch } from "./MatchNavContext";
import AddToCalendar from "./AddToCalendar";
import MyTeamPlayoff from "./MyTeamPlayoff";
import { useAuth } from "./AuthContext";
import AuthModal from "./AuthModal";

const DEFAULT_TEAM = "Argentina";

function TeamLabel({ name, lang }) {
  return (
    <span>
      {flag(name)} {teamName(name, lang)}
    </span>
  );
}

export default function MyTeam({ tz }) {
  const { user, ready, updatePrefs } = useAuth();
  const { lang, t } = useLang();
  const openMatch = useOpenMatch();
  const [authOpen, setAuthOpen] = useState(false);

  const [picking, setPicking] = useState(false);
  const [section, setSection] = useState("grupos");

  // Hasta saber si hay sesión, no renderizamos nada (evita parpadeo).
  if (!ready) return null;

  if (!user) {
    return (
      <div className="locked-screen">
        <div className="locked-icon">🔒</div>
        <h2>{t("myteam.locked.title")}</h2>
        <p>{t("myteam.locked.sub")}</p>
        <button className="auth-submit" onClick={() => setAuthOpen(true)}>
          {t("common.signin")}
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
          <h2>{teamName(myTeam, lang)}</h2>
        </div>
        <button className="btn-change" onClick={() => setPicking((v) => !v)}>
          {picking ? t("common.cancel") : t("myteam.change")}
        </button>
      </div>

      <div className="myteam-tabs">
        <button
          className={`myteam-tab ${section === "grupos" ? "active" : ""}`}
          onClick={() => setSection("grupos")}
        >
          {t("tab.groupstage")}
        </button>
        <button
          className={`myteam-tab ${section === "playoff" ? "active" : ""}`}
          onClick={() => setSection("playoff")}
        >
          {t("tab.playoffs")}
        </button>
      </div>

      {picking && (
        <div className="team-picker">
          <p className="picker-hint">{t("myteam.pick")}</p>
          <div className="picker-grid">
            {allTeams.map((team) => (
              <button
                key={team}
                className={`picker-item ${team === myTeam ? "selected" : ""}`}
                onClick={() => handleSelect(team)}
              >
                {flag(team)} {teamName(team, lang)}
              </button>
            ))}
          </div>
        </div>
      )}

      {section === "grupos" && (
        matches.length === 0 ? (
          <p className="no-matches">{t("myteam.noMatches")}</p>
        ) : (
          <div className="myteam-matches">
            {matches.map((m, i) => {
              const instant = kickoff(m);
              const isHome = m.home === myTeam;
              return (
                <div
                  className="match match--highlight match--clickable"
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
                  <div className="when">
                    <div className="date">{formatDate(instant, tz, lang)}</div>
                    <div className="time">{formatTime(instant, tz, lang)}</div>
                    <span className="atc-stop" onClick={(e) => e.stopPropagation()}>
                      <AddToCalendar
                        home={m.home}
                        away={m.away}
                        venue={m.venue}
                        city={m.city}
                        label={t("group.badge", { g: m.group })}
                        start={instant}
                        compact
                      />
                    </span>
                  </div>
                  <div className="vs">
                    <div className="teams">
                      <span className={isHome ? "my-team-name" : ""}>
                        <TeamLabel name={m.home} lang={lang} />
                      </span>
                      <span className="sep">{t("vs")}</span>
                      <span className={!isHome ? "my-team-name" : ""}>
                        <TeamLabel name={m.away} lang={lang} />
                      </span>
                    </div>
                    <div className="venue">
                      📍 {m.venue}, {m.city}
                    </div>
                    <div className="group-badge-small">
                      {t("group.badge", { g: m.group })}
                    </div>
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
