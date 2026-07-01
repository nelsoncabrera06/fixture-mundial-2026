"use client";

import { ROUNDS, kickoff } from "../lib/knockout";
import { formatDate, formatTime } from "../lib/timezone";
import { teamName, roundShort, roundName } from "../lib/i18n";
import { getResult, isNoScoreStatus } from "../lib/results";
import { resolveSlot, hasR32Projections } from "../lib/playoffPath";
import { flag } from "../lib/teams";
import { useRef, useState, useEffect } from "react";
import { useLang } from "./LanguageContext";
import { useLiveResults, useLiveLoading } from "./LiveScoresProvider";
import { useOpenMatch } from "./MatchNavContext";
import LiveBadge from "./LiveBadge";

// Índice rápido id -> partido (los datos viven en lib/knockout.js)
const byId = {};
ROUNDS.forEach((r) => r.matches.forEach((m) => (byId[m.id] = m)));

// Si una ranura es "Ganador N", devuelve N (el partido que la alimenta).
function feederId(slot) {
  const m = /Ganador (\d+)/.exec(slot || "");
  return m ? m[1] : null;
}

// Arma el árbol del cuadro a partir de los "Ganador N" de cada partido.
// Las hojas son los partidos de Ronda de 32 (sus rivales no son "Ganador N").
function buildTree(id) {
  const match = byId[id];
  if (!match) return null;
  const children = [feederId(match.home), feederId(match.away)]
    .filter(Boolean)
    .map(buildTree)
    .filter(Boolean);
  return { match, children };
}

// Dibuja una ranura del cruce: si se puede proyectar desde la tabla del grupo
// muestra el equipo con bandera; si no, el texto del placeholder tal cual.
function SlotName({ label, lang, proj }) {
  if (proj) {
    return (
      <span className="bk-team-name bk-team-name--proj">
        <span className="bk-proj-flag">{flag(proj.team)}</span>
        {teamName(proj.team, lang)}
      </span>
    );
  }
  return <span className="bk-team-name">{teamName(label, lang)}</span>;
}

function MatchCard({ match, tz, lang }) {
  const openMatch = useOpenMatch();
  const instant = kickoff(match);
  const r = getResult(match);
  const played = !!r && r.homeGoals != null && r.awayGoals != null;
  // Aplazado/cancelado: sin marcador, pero igual mostramos el badge en lugar
  // de la hora (y no la proyección tentativa de un partido que no se jugará).
  const noScore = isNoScoreStatus(r);

  // Proyección de slots desde la tabla y los resultados: resolvemos el equipo
  // tanto de un "1.º/2.º Grupo X" como de un "Ganador N" (recursivo) aunque ya
  // haya un resultado (p. ej. simulado), para no volver a mostrar el placeholder.
  const homeProj = resolveSlot(match.home);
  const awayProj = resolveSlot(match.away);
  // El borde tentativo/confirmado solo tiene sentido antes de que haya marcador.
  // Verde si AMBOS equipos están confirmados (grupos terminados); si alguno es
  // tentativo —o un tercero por definir junto a uno confirmado—, amarillo.
  let projClass = "";
  if (!played && !noScore && (homeProj || awayProj)) {
    const allConfirmed =
      homeProj?.status === "confirmed" &&
      awayProj?.status === "confirmed";
    projClass = allConfirmed ? "bk-match--confirmed" : "bk-match--tentative";
  }

  return (
    <div
      className={`bk-match bk-match--clickable ${played ? "bk-match--played" : ""} ${projClass}`}
      role="button"
      tabIndex={0}
      onClick={() => openMatch(match)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openMatch(match);
        }
      }}
    >
      <div className="bk-team">
        <SlotName label={match.home} lang={lang} proj={homeProj} />
        {played && (
          <span className="bk-goals">
            {r.homeGoals}
            {r.penaltyHome != null && <span className="bk-pen">({r.penaltyHome})</span>}
          </span>
        )}
      </div>
      <div className="bk-team">
        <SlotName label={match.away} lang={lang} proj={awayProj} />
        {played && (
          <span className="bk-goals">
            {r.awayGoals}
            {r.penaltyAway != null && <span className="bk-pen">({r.penaltyAway})</span>}
          </span>
        )}
      </div>
      {(played && r.status) || noScore ? (
        <div className="bk-when bk-when--live">
          <LiveBadge status={r.status} elapsed={r.elapsed} />
        </div>
      ) : (
        <div className="bk-when">
          <span className="t">{formatTime(instant, tz, lang)}</span> ·{" "}
          {formatDate(instant, tz, lang)}
        </div>
      )}
    </div>
  );
}

// Nodo recursivo. side "left": hijos a la izquierda, partido a la derecha.
// side "right": espejado.
function Tree({ node, side, tz, lang }) {
  const hasKids = node.children.length > 0;
  const branches = hasKids ? (
    <div className="bk-branches">
      {node.children.map((c) => (
        <Tree key={c.match.id} node={c} side={side} tz={tz} lang={lang} />
      ))}
    </div>
  ) : null;
  const card = (
    <div className="bk-node">
      <MatchCard match={node.match} tz={tz} lang={lang} />
    </div>
  );
  return (
    <div className={`bk-tree ${hasKids ? "has-kids" : "leaf"}`}>
      {side === "left" ? (
        <>
          {branches}
          {card}
        </>
      ) : (
        <>
          {card}
          {branches}
        </>
      )}
    </div>
  );
}

export default function Knockout({ tz }) {
  const { lang, t } = useLang();
  const version = useLiveResults();
  const providerLoading = useLiveLoading();
  const mountVersion = useRef(version);
  // Si el provider aún estaba cargando al montar (tab default), ignoramos el
  // primer increment (fetch inicial) y esperamos el siguiente poll real.
  const skipFirst = useRef(providerLoading);
  const [tabLoading, setTabLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setTabLoading(false), 35000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (version > mountVersion.current) {
      if (skipFirst.current) {
        skipFirst.current = false;
        mountVersion.current = version; // esperar el siguiente poll
      } else {
        setTabLoading(false);
      }
    }
  }, [version]);

  const left = buildTree("101"); // semifinal izquierda y su rama
  const right = buildTree("102"); // semifinal derecha y su rama
  const full = buildTree("104"); // bracket completo (R32 → Final) para mobile
  const final = byId["104"];
  const third = byId["103"];

  // Encabezados (forma corta) derivados de los nombres de ronda en español.
  const r32 = roundShort("Ronda de 32", lang);
  const r16 = roundShort("Octavos de final", lang);
  const qf = roundShort("Cuartos de final", lang);
  const sf = roundShort("Semifinales", lang);
  const fin = roundShort("Final", lang);
  const leftHeaders = [r32, r16, qf, sf];
  const rightHeaders = [sf, qf, r16, r32];
  const showProjLegend = hasR32Projections();

  return (
    <>
      {tabLoading && (
        <div className="live-loading-hint">
          <span className="live-loading-dot" />
          {t("ko.loadingScores")}
        </div>
      )}
      <p className="tz-text" style={{ marginTop: 0, marginBottom: 16 }}>
        {t("ko.intro")}
      </p>
      {showProjLegend && (
        <div className="bk-proj-legend" role="note">
          <span className="bk-proj-legend-lead">{t("ko.projLead")}</span>
          <span className="bk-proj-chip bk-proj-chip--tentative">
            {t("ko.projTentative")}
          </span>
          <span className="bk-proj-chip bk-proj-chip--confirmed">
            {t("ko.projConfirmed")}
          </span>
        </div>
      )}
      <div className="bracket2">
        <div className="bk-headers">
          {leftHeaders.map((h, i) => (
            <div className="bk-head" key={`lh-${i}`}>
              {h}
            </div>
          ))}
          <div className="bk-head bk-head-final" aria-hidden="true"></div>
          {rightHeaders.map((h, i) => (
            <div className="bk-head" key={`rh-${i}`}>
              {h}
            </div>
          ))}
        </div>

        <div className="bk-body">
          <div className="bk-side bk-side-left">
            {left && <Tree node={left} side="left" tz={tz} lang={lang} />}
          </div>

          <div className="bk-center">
            <div className="bk-final">
              <div className="bk-final-label">🏆 {fin}</div>
              <div className="bk-final-wrap">
                <MatchCard match={final} tz={tz} lang={lang} />
              </div>
            </div>
            <div className="bk-third">
              <div className="bk-third-wrap">
                <MatchCard match={third} tz={tz} lang={lang} />
              </div>
              <div className="bk-third-label">
                {roundShort("Tercer puesto", lang)}
              </div>
            </div>
          </div>

          <div className="bk-side bk-side-right">
            {right && <Tree node={right} side="right" tz={tz} lang={lang} />}
          </div>
        </div>
      </div>

      {/* Vista mobile: el mismo bracket pero horizontal y con scroll-snap.
          Cada columna mide ~media pantalla, así que se ven 2 rondas a la vez;
          deslizando hacia la izquierda aparecen las siguientes
          (Ronda de 32 → Octavos → Cuartos → Semifinal → Final). El 3.º puesto
          va aparte porque no cuelga del árbol de la final. */}
      <div className="bk-mobile">
        <p className="bkm-hint">{t("ko.swipeHint")}</p>
        <div className="bkm-scroll">
          <div className="bkm-headers">
            {[r32, r16, qf, sf, fin].map((h, i) => (
              <div className="bkm-head" key={i}>
                {h}
              </div>
            ))}
          </div>
          <div className="bkm-body bk-side bk-side-left">
            {full && <Tree node={full} side="left" tz={tz} lang={lang} />}
          </div>
        </div>
        <div className="bkm-third">
          <h3 className="bk-round-title">🥉 {roundName("Tercer puesto", lang)}</h3>
          <MatchCard match={third} tz={tz} lang={lang} />
        </div>
      </div>
    </>
  );
}
