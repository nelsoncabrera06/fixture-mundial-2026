"use client";

import { ROUNDS, kickoff } from "../lib/knockout";
import { formatDate, formatTime } from "../lib/timezone";

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

function MatchCard({ match, tz }) {
  const instant = kickoff(match);
  return (
    <div className="bk-match">
      <div className="bk-team">{match.home}</div>
      <div className="bk-team">{match.away}</div>
      <div className="bk-when">
        <span className="t">{formatTime(instant, tz)}</span> ·{" "}
        {formatDate(instant, tz)}
      </div>
    </div>
  );
}

// Nodo recursivo. side "left": hijos a la izquierda, partido a la derecha.
// side "right": espejado.
function Tree({ node, side, tz }) {
  const hasKids = node.children.length > 0;
  const branches = hasKids ? (
    <div className="bk-branches">
      {node.children.map((c) => (
        <Tree key={c.match.id} node={c} side={side} tz={tz} />
      ))}
    </div>
  ) : null;
  const card = (
    <div className="bk-node">
      <MatchCard match={node.match} tz={tz} />
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
  const left = buildTree("101"); // semifinal izquierda y su rama
  const right = buildTree("102"); // semifinal derecha y su rama
  const full = buildTree("104"); // bracket completo (R32 → Final) para mobile
  const final = byId["104"];
  const third = byId["103"];

  const leftHeaders = ["Ronda de 32", "Octavos", "Cuartos", "Semifinal"];
  const rightHeaders = ["Semifinal", "Cuartos", "Octavos", "Ronda de 32"];

  return (
    <>
      <p className="tz-text" style={{ marginTop: 0, marginBottom: 16 }}>
        Avanzan los 2 primeros de cada grupo más los 8 mejores terceros (32
        equipos). Los cruces se definen al terminar la fase de grupos.
      </p>
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
            {left && <Tree node={left} side="left" tz={tz} />}
          </div>

          <div className="bk-center">
            <div className="bk-final">
              <div className="bk-final-label">🏆 Final</div>
              <div className="bk-final-wrap">
                <MatchCard match={final} tz={tz} />
              </div>
            </div>
            <div className="bk-third">
              <div className="bk-third-wrap">
                <MatchCard match={third} tz={tz} />
              </div>
              <div className="bk-third-label">3.º puesto</div>
            </div>
          </div>

          <div className="bk-side bk-side-right">
            {right && <Tree node={right} side="right" tz={tz} />}
          </div>
        </div>
      </div>

      {/* Vista mobile: el mismo bracket pero horizontal y con scroll-snap.
          Cada columna mide ~media pantalla, así que se ven 2 rondas a la vez;
          deslizando hacia la izquierda aparecen las siguientes
          (Ronda de 32 → Octavos → Cuartos → Semifinal → Final). El 3.º puesto
          va aparte porque no cuelga del árbol de la final. */}
      <div className="bk-mobile">
        <p className="bkm-hint">Deslizá para ver las siguientes rondas →</p>
        <div className="bkm-scroll">
          <div className="bkm-headers">
            {["Ronda de 32", "Octavos", "Cuartos", "Semifinal", "Final"].map(
              (h) => (
                <div className="bkm-head" key={h}>
                  {h}
                </div>
              )
            )}
          </div>
          <div className="bkm-body bk-side bk-side-left">
            {full && <Tree node={full} side="left" tz={tz} />}
          </div>
        </div>
        <div className="bkm-third">
          <h3 className="bk-round-title">🥉 Tercer puesto</h3>
          <MatchCard match={third} tz={tz} />
        </div>
      </div>
    </>
  );
}
