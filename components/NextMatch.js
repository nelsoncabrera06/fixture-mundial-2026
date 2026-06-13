"use client";

import { useEffect, useState } from "react";
import { GROUP_MATCHES, kickoff } from "../lib/matches";
import { ROUNDS } from "../lib/knockout";
import { flag } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";
import { teamName, roundName } from "../lib/i18n";
import { getResult } from "../lib/results";
import { useLang } from "./LanguageContext";
import { useLiveResults } from "./LiveScoresProvider";
import { useOpenMatch } from "./MatchNavContext";
import LiveBadge from "./LiveBadge";
import AddToCalendar from "./AddToCalendar";

// Un partido se considera "mirable" (en juego) hasta 2 h después del inicio.
const WINDOW_MS = 2 * 60 * 60 * 1000;

// Lista unificada de TODOS los partidos del Mundial (grupos + eliminatorias),
// cada uno con una etiqueta de fase para mostrar ("Grupo A", "Final", etc.).
const ALL_MATCHES = [
  ...GROUP_MATCHES.map((m) => ({ ...m, label: `Grupo ${m.group}` })),
  ...ROUNDS.flatMap((r) => r.matches.map((m) => ({ ...m, label: r.name }))),
].map((m) => ({ ...m, t: kickoff(m).getTime() }));

// El instante del primer partido del torneo = partido inaugural.
const FIRST_KICKOFF = Math.min(...ALL_MATCHES.map((m) => m.t));

// "Faltan 3 d 4 h" / "Faltan 2 h 15 min" / "Faltan 12 min"
function countdown(ms, t) {
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return t("nm.count.days", { d: days, h: hours });
  if (hours > 0) return t("nm.count.hours", { h: hours, m: mins });
  return t("nm.count.mins", { m: mins });
}

function TeamRow({ name, lang }) {
  return (
    <span className="nm-team">
      <span className="nm-flag">{flag(name)}</span> {teamName(name, lang)}
    </span>
  );
}

export default function NextMatch({ tz }) {
  const { lang, t } = useLang();
  useLiveResults(); // re-render cuando llegan marcadores nuevos
  const openMatch = useOpenMatch();
  // Etiqueta traducida del partido: grupo o nombre de ronda.
  const matchLabel = (m) =>
    m.group ? t("group.badge", { g: m.group }) : roundName(m.label, lang);
  // `now` arranca en null y se setea al montar, para no romper la hidratación
  // (el reloj del server al prerenderizar no coincide con el del cliente).
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30000); // refresca el contador
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;

  // Partidos que todavía no terminaron (siguen siendo "mirables").
  const live = ALL_MATCHES.filter((m) => m.t + WINDOW_MS > now).sort(
    (a, b) => a.t - b.t
  );

  if (live.length === 0) {
    return (
      <div className="nextmatch">
        <div className="nm-card nm-card--empty">
          <div className="nm-trophy">🏆</div>
          <h2>{t("nm.ended.title")}</h2>
          <p>{t("nm.ended.sub")}</p>
        </div>
      </div>
    );
  }

  // El próximo horario y TODOS los partidos que arrancan en ese mismo instante
  // (puede haber varios en simultáneo).
  const nextT = live[0].t;
  const matches = live.filter((m) => m.t === nextT);

  const started = nextT <= now; // ya arrancó (está en juego)
  const isInaugural = nextT === FIRST_KICKOFF;
  const diff = nextT - now;

  // Si el partido ya arrancó, buscar el siguiente slot
  const afterMatches = started ? live.filter((m) => m.t > nextT) : [];
  const nextUpT = afterMatches.length > 0 ? afterMatches[0].t : null;
  const nextUpMatches = nextUpT ? afterMatches.filter((m) => m.t === nextUpT) : [];

  return (
    <div className="nextmatch">
      <div className={`nm-card ${started ? "nm-card--live" : ""}`}>
        <div className="nm-status">
          {started ? (
            <span className="nm-now">
              <span className="nm-dot" /> {t("nm.live")}
            </span>
          ) : (
            <span className="nm-label">
              {isInaugural ? t("nm.inaugural") : t("nm.next")}
            </span>
          )}
          {!started && (
            <span className="nm-countdown">{countdown(diff, t)}</span>
          )}
        </div>

        {matches.length > 1 && (
          <p className="nm-simul">{t("nm.simul", { n: matches.length })}</p>
        )}

        <div className="nm-list">
          {matches.map((m, i) => {
            const instant = new Date(m.t);
            const r = getResult(m);
            const played = !!r && r.homeGoals != null && r.awayGoals != null;
            return (
              <div
                className="nm-match nm-match--clickable"
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
                <div className="nm-teams">
                  <TeamRow name={m.home} lang={lang} />
                  {played ? (
                    <span className="nm-vs nm-score">
                      {r.homeGoals} - {r.awayGoals}
                    </span>
                  ) : (
                    <span className="nm-vs">{t("vs")}</span>
                  )}
                  <TeamRow name={m.away} lang={lang} />
                </div>
                {played && r.status && (
                  <div className="nm-badge">
                    <LiveBadge status={r.status} elapsed={r.elapsed} />
                  </div>
                )}
                <div className="nm-when">
                  📅 {formatDate(instant, tz, lang)} · {formatTime(instant, tz, lang)}
                </div>
                <div className="nm-venue">
                  📍 {m.venue}, {m.city}
                </div>
                <div className="nm-group">{matchLabel(m)}</div>
                <div className="nm-cal" onClick={(e) => e.stopPropagation()}>
                  <AddToCalendar
                    home={m.home}
                    away={m.away}
                    venue={m.venue}
                    city={m.city}
                    label={matchLabel(m)}
                    start={instant}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Siguiente partido cuando hay uno en juego */}
      {started && nextUpMatches.length > 0 && (
        <div className="nm-card nm-card--upcoming">
          <div className="nm-status">
            <span className="nm-label">{t("nm.next")}</span>
            <span className="nm-countdown">{countdown(nextUpT - now, t)}</span>
          </div>
          {nextUpMatches.length > 1 && (
            <p className="nm-simul">{t("nm.simul", { n: nextUpMatches.length })}</p>
          )}
          <div className="nm-list">
            {nextUpMatches.map((m, i) => {
              const instant = new Date(m.t);
              return (
                <div
                  className="nm-match nm-match--clickable"
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
                  <div className="nm-teams">
                    <TeamRow name={m.home} lang={lang} />
                    <span className="nm-vs">{t("vs")}</span>
                    <TeamRow name={m.away} lang={lang} />
                  </div>
                  <div className="nm-when">
                    📅 {formatDate(instant, tz, lang)} · {formatTime(instant, tz, lang)}
                  </div>
                  <div className="nm-venue">📍 {m.venue}, {m.city}</div>
                  <div className="nm-group">{matchLabel(m)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
