"use client";

import { useEffect, useState } from "react";
import { GROUP_MATCHES, kickoff } from "../lib/matches";
import { ROUNDS } from "../lib/knockout";
import { flag } from "../lib/teams";
import { formatDate, formatTime } from "../lib/timezone";

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
function countdown(ms) {
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `Faltan ${days} d ${hours} h`;
  if (hours > 0) return `Faltan ${hours} h ${mins} min`;
  return `Faltan ${mins} min`;
}

function TeamRow({ name }) {
  return (
    <span className="nm-team">
      <span className="nm-flag">{flag(name)}</span> {name}
    </span>
  );
}

export default function NextMatch({ tz }) {
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
          <h2>El Mundial terminó</h2>
          <p>No quedan más partidos por jugarse. ¡Gracias por seguirlo!</p>
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

  return (
    <div className="nextmatch">
      <div className={`nm-card ${started ? "nm-card--live" : ""}`}>
        <div className="nm-status">
          {started ? (
            <span className="nm-now">
              <span className="nm-dot" /> En juego ahora
            </span>
          ) : (
            <span className="nm-label">
              {isInaugural ? "🎉 Partido inaugural" : "⏭️ Siguiente partido"}
            </span>
          )}
          {!started && <span className="nm-countdown">{countdown(diff)}</span>}
        </div>

        {matches.length > 1 && (
          <p className="nm-simul">
            🔥 {matches.length} partidos en simultáneo
          </p>
        )}

        <div className="nm-list">
          {matches.map((m, i) => {
            const instant = new Date(m.t);
            return (
              <div className="nm-match" key={i}>
                <div className="nm-teams">
                  <TeamRow name={m.home} />
                  <span className="nm-vs">vs</span>
                  <TeamRow name={m.away} />
                </div>
                <div className="nm-when">
                  📅 {formatDate(instant, tz)} · {formatTime(instant, tz)}
                </div>
                <div className="nm-venue">
                  📍 {m.venue}, {m.city}
                </div>
                <div className="nm-group">{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
