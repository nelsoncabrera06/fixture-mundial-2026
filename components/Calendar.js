"use client";

import { useEffect, useMemo, useState } from "react";
import { GROUP_MATCHES, kickoff } from "../lib/matches";
import { ROUNDS } from "../lib/knockout";
import { flag } from "../lib/teams";
import { formatTime, dayKey } from "../lib/timezone";
import { teamName, roundName, roundShort, langToLocale } from "../lib/i18n";
import { useLang } from "./LanguageContext";

// Lista unificada de TODOS los partidos (grupos + eliminatorias), con etiqueta
// de fase y su instante absoluto. Los instantes son fijos; el agrupado por
// día/semana/hora depende de la zona elegida y se calcula en el render.
const ALL_MATCHES = [
  ...GROUP_MATCHES.map((m) => ({ ...m, label: `Grupo ${m.group}` })),
  ...ROUNDS.flatMap((r) => r.matches.map((m) => ({ ...m, label: r.name }))),
]
  .map((m) => ({ ...m, instant: kickoff(m) }))
  .sort((a, b) => a.instant - b.instant);

const KNOCKOUT_LABELS = new Set(ROUNDS.map((r) => r.name));

// Grilla semanal (desktop): alto por hora y duración visual de un partido.
const HOUR_H = 56; // px por hora
const BLOCK_MIN = 120; // bloque de 2 h por partido
const PX_PER_MIN = HOUR_H / 60;

// ── Helpers de fechas (operan sobre claves "AAAA-MM-DD") ──────────────────
function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}
function fmtKey(dt) {
  return dt.toISOString().slice(0, 10);
}
// Lunes de la semana a la que pertenece un día.
function weekStartKey(key) {
  const dt = parseKey(key);
  const dow = dt.getUTCDay(); // 0=Dom … 6=Sáb
  dt.setUTCDate(dt.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return fmtKey(dt);
}
function addDays(key, n) {
  const dt = parseKey(key);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fmtKey(dt);
}
// "Jueves, 11 jun" (capitalizado) — `locale` según el idioma activo.
function dayLabel(key, locale) {
  const s = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(parseKey(key));
  return s.charAt(0).toUpperCase() + s.slice(1);
}
// "11 – 14 jun" / "29 jun – 5 jul"
function weekRange(firstKey, lastKey, locale) {
  const m = (k) =>
    new Intl.DateTimeFormat(locale, { timeZone: "UTC", month: "short" }).format(
      parseKey(k)
    );
  const d = (k) => parseKey(k).getUTCDate();
  return m(firstKey) === m(lastKey)
    ? `${d(firstKey)} – ${d(lastKey)} ${m(lastKey)}`
    : `${d(firstKey)} ${m(firstKey)} – ${d(lastKey)} ${m(lastKey)}`;
}

// Minutos desde medianoche de un instante, en la zona elegida.
function minutesInTz(instant, tz) {
  const [h, m] = formatTime(instant, tz).split(":").map(Number);
  return h * 60 + m;
}

// Reparte en "carriles" los partidos que se superponen dentro de una columna
// (p. ej. dos partidos a la misma hora van lado a lado). Devuelve cada ítem
// con { lane, cols } para calcular su ancho y posición horizontal.
function layoutColumn(items) {
  items.forEach((it) => (it.end = it.start + BLOCK_MIN));
  // Clusters = grupos contiguos que se solapan (un hueco corta el cluster).
  const clusters = [];
  let cur = [];
  let curEnd = -Infinity;
  for (const it of items) {
    if (cur.length && it.start >= curEnd) {
      clusters.push(cur);
      cur = [];
      curEnd = -Infinity;
    }
    cur.push(it);
    curEnd = Math.max(curEnd, it.end);
  }
  if (cur.length) clusters.push(cur);

  for (const cluster of clusters) {
    const laneEnds = [];
    for (const it of cluster) {
      let lane = laneEnds.findIndex((e) => e <= it.start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(it.end);
      } else {
        laneEnds[lane] = it.end;
      }
      it.lane = lane;
    }
    for (const it of cluster) it.cols = laneEnds.length;
  }
  return items;
}

export default function Calendar({ tz }) {
  const { lang, t } = useLang();
  const locale = langToLocale(lang);
  const DAY_NAMES = t("cal.dayNames");

  // Etiqueta de fase traducida (grupo "Grupo X" o nombre de ronda).
  const matchLabel = (m) =>
    m.group ? t("group.badge", { g: m.group }) : roundName(m.label, lang);
  const matchShort = (m) =>
    m.group ? t("group.badge", { g: m.group }) : roundShort(m.label, lang);

  const [now, setNow] = useState(null); // ms; null en SSR
  const [todayKey, setTodayKey] = useState(null);
  const [weekIdx, setWeekIdx] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    setTodayKey(dayKey(new Date(), tz));
  }, [tz]);

  // Agrupado por día (en la zona elegida) y por semana. Memo para no rehacerlo
  // en cada render salvo que cambie la zona.
  const { dayMap, weekStarts, listWeeks } = useMemo(() => {
    const dm = new Map();
    for (const m of ALL_MATCHES) {
      const k = dayKey(m.instant, tz);
      if (!dm.has(k)) dm.set(k, []);
      dm.get(k).push(m);
    }
    const wmap = new Map();
    for (const [k, matches] of dm) {
      const ws = weekStartKey(k);
      if (!wmap.has(ws)) wmap.set(ws, []);
      wmap.get(ws).push({ key: k, matches });
    }
    const starts = [...wmap.keys()].sort();
    const lw = starts.map((s) => ({
      start: s,
      days: wmap.get(s).sort((a, b) => (a.key < b.key ? -1 : 1)),
    }));
    return { dayMap: dm, weekStarts: starts, listWeeks: lw };
  }, [tz]);

  // Al saber el "hoy", saltar a la semana que lo contiene (si está en rango).
  useEffect(() => {
    if (!todayKey || weekStarts.length === 0) return;
    const i = weekStarts.indexOf(weekStartKey(todayKey));
    if (i >= 0) setWeekIdx(i);
  }, [todayKey, weekStarts]);

  const safeIdx = Math.min(weekIdx, Math.max(0, weekStarts.length - 1));
  const weekStart = weekStarts[safeIdx];

  // Columnas de la semana actual (los 7 días Lun→Dom).
  const columns = [];
  if (weekStart) {
    for (let i = 0; i < 7; i++) {
      const key = addDays(weekStart, i);
      columns.push({ key, matches: dayMap.get(key) || [] });
    }
  }

  // Rango horario dinámico según los partidos de la semana.
  const allMin = columns.flatMap((c) =>
    c.matches.map((m) => minutesInTz(m.instant, tz))
  );
  let startHour = 12;
  let endHour = 20;
  if (allMin.length) {
    startHour = Math.floor(Math.min(...allMin) / 60);
    endHour = Math.min(24, Math.ceil(Math.max(...allMin) / 60) + 2);
    if (endHour - startHour < 6) endHour = Math.min(24, startHour + 6);
  }
  const gridHeight = (endHour - startHour) * HOUR_H;
  const hours = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);

  const nowMin =
    now !== null ? minutesInTz(new Date(now), tz) : null;

  return (
    <div className="calendar">
      {/* ── Vista semanal tipo agenda (desktop) ── */}
      <div className="cw-view">
        <div className="cw-toolbar">
          <div className="cw-nav">
            <button
              className="cw-nav-btn"
              onClick={() => setWeekIdx((i) => Math.max(0, i - 1))}
              disabled={safeIdx === 0}
              aria-label={t("cal.prevWeek")}
            >
              ←
            </button>
            <button
              className="cw-nav-btn cw-nav-today"
              onClick={() => {
                const i = todayKey
                  ? weekStarts.indexOf(weekStartKey(todayKey))
                  : 0;
                setWeekIdx(i >= 0 ? i : 0);
              }}
            >
              {t("cal.today")}
            </button>
            <button
              className="cw-nav-btn"
              onClick={() =>
                setWeekIdx((i) => Math.min(weekStarts.length - 1, i + 1))
              }
              disabled={safeIdx === weekStarts.length - 1}
              aria-label={t("cal.nextWeek")}
            >
              →
            </button>
          </div>
          <span className="cw-range">
            {t("cal.week", { n: safeIdx + 1 })}
            {weekStart && (
              <span className="cw-range-dates">
                · {weekRange(columns[0].key, columns[6].key, locale)}
              </span>
            )}
          </span>
        </div>

        <div className="cw-grid">
          {/* Encabezado de días */}
          <div className="cw-head">
            <div className="cw-gutter-head" />
            {columns.map((c, i) => (
              <div
                className={`cw-col-head ${
                  c.key === todayKey ? "cw-col-head--today" : ""
                }`}
                key={c.key}
              >
                <span className="cw-col-name">{DAY_NAMES[i]}</span>
                <span
                  className={`cw-col-date ${
                    c.key === todayKey ? "cw-col-date--today" : ""
                  }`}
                >
                  {parseKey(c.key).getUTCDate()}
                </span>
              </div>
            ))}
          </div>

          {/* Cuerpo: gutter de horas + columnas */}
          <div className="cw-body">
            <div className="cw-gutter" style={{ height: gridHeight }}>
              {hours.map((h) => (
                <div
                  className="cw-hour-label"
                  key={h}
                  style={{ top: (h - startHour) * HOUR_H }}
                >
                  {String(h % 24).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            <div className="cw-cols">
              {columns.map((c) => {
                const laid = layoutColumn(
                  c.matches
                    .map((m) => ({ m, start: minutesInTz(m.instant, tz) }))
                    .sort((a, b) => a.start - b.start)
                );
                const isToday = c.key === todayKey;
                return (
                  <div
                    className={`cw-col ${isToday ? "cw-col--today" : ""}`}
                    key={c.key}
                    style={{ height: gridHeight }}
                  >
                    {hours.map((h) => (
                      <div
                        className="cw-hline"
                        key={h}
                        style={{ top: (h - startHour) * HOUR_H }}
                      />
                    ))}

                    {laid.map((it, j) => {
                      const top = (it.start - startHour * 60) * PX_PER_MIN;
                      const visibleEnd = Math.min(it.end, endHour * 60);
                      const height =
                        Math.max(28, (visibleEnd - it.start) * PX_PER_MIN) - 3;
                      const widthPct = 100 / it.cols;
                      const ko = KNOCKOUT_LABELS.has(it.m.label);
                      return (
                        <div
                          className={`cw-event ${ko ? "cw-event--ko" : ""}`}
                          key={j}
                          title={`${teamName(it.m.home, lang)} ${t("vs")} ${teamName(it.m.away, lang)} · ${matchLabel(it.m)} · ${it.m.venue}, ${it.m.city}`}
                          style={{
                            top,
                            height,
                            left: `calc(${it.lane * widthPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                          }}
                        >
                          {ko && (
                            <span className="cw-ev-round">
                              {matchShort(it.m)}
                            </span>
                          )}
                          <span className="cw-ev-time">
                            {formatTime(it.m.instant, tz, lang)}
                          </span>
                          <span className="cw-ev-team">
                            {flag(it.m.home)} {teamName(it.m.home, lang)}
                          </span>
                          <span className="cw-ev-team">
                            {flag(it.m.away)} {teamName(it.m.away, lang)}
                          </span>
                        </div>
                      );
                    })}

                    {isToday &&
                      nowMin !== null &&
                      nowMin >= startHour * 60 &&
                      nowMin <= endHour * 60 && (
                        <div
                          className="cw-now"
                          style={{ top: (nowMin - startHour * 60) * PX_PER_MIN }}
                        />
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Vista lista por semana/día (mobile) ── */}
      <div className="cal-list">
        <p className="tz-text" style={{ marginTop: 0, marginBottom: 18 }}>
          {t("cal.intro")}
        </p>

        {listWeeks.map((week, i) => {
          const first = week.days[0].key;
          const last = week.days[week.days.length - 1].key;
          const total = week.days.reduce((n, d) => n + d.matches.length, 0);
          return (
            <section className="cal-week" key={week.start}>
              <h2 className="cal-week-title">
                {t("cal.week", { n: i + 1 })}
                <span className="cal-week-range">
                  · {weekRange(first, last, locale)}
                </span>
                <span className="cal-week-count">
                  {total} {t("cal.match.other")}
                </span>
              </h2>

              {week.days.map((day) => (
                <div
                  className={`cal-day ${
                    day.key === todayKey ? "cal-day--today" : ""
                  }`}
                  key={day.key}
                >
                  <div className="cal-day-head">
                    <span className="cal-day-name">{dayLabel(day.key, locale)}</span>
                    {day.key === todayKey && (
                      <span className="cal-today-chip">{t("cal.today")}</span>
                    )}
                    <span className="cal-day-count">
                      {day.matches.length}{" "}
                      {day.matches.length === 1
                        ? t("cal.match.one")
                        : t("cal.match.other")}
                    </span>
                  </div>

                  <div className="cal-day-matches">
                    {day.matches.map((m, j) => (
                      <div className="cal-match" key={j}>
                        <span className="cal-match-time">
                          {formatTime(m.instant, tz, lang)}
                        </span>
                        <span className="cal-match-main">
                          <span className="cal-match-teams">
                            {flag(m.home)} {teamName(m.home, lang)}
                            <span className="sep">{t("vs")}</span>
                            {flag(m.away)} {teamName(m.away, lang)}
                          </span>
                          <span className="cal-match-venue">
                            📍 {m.venue}, {m.city}
                          </span>
                        </span>
                        <span
                          className={`cal-match-label ${
                            KNOCKOUT_LABELS.has(m.label)
                              ? "cal-match-label--ko"
                              : ""
                          }`}
                        >
                          {matchLabel(m)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
