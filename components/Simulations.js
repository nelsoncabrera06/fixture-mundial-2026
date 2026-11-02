"use client";

// ---------------------------------------------------------------------------
// Pestaña "Simulaciones · ¿Qué pasa si?".
//
// Lista 4 escenarios. El usuario puede activar uno (entra en modo simulación),
// renombrarlo, resetearlo (borra sus resultados simulados) o desactivar el
// modo. La simulación en sí (editar marcadores) se hace en la vista Partido.
//
// Con el Mundial terminado no queda ningún partido simulable (todos tienen
// resultado final), así que se avisa en vez de ofrecer un botón que no hace
// nada. Los escenarios guardados se conservan.
// ---------------------------------------------------------------------------

import { useSimulation, SIM_SCENARIOS } from "./SimulationContext";
import { useLang } from "./LanguageContext";
import { GROUP_MATCHES } from "../lib/matches";
import { ROUNDS } from "../lib/knockout";
import { getResult, isFinalResult } from "../lib/results";

// ¿Queda algún partido sin resultado final? (se calcula una sola vez: los datos
// son estáticos).
const HAS_SIMULABLE = [...GROUP_MATCHES, ...ROUNDS.flatMap((r) => r.matches)].some(
  (m) => !isFinalResult(getResult(m))
);

export default function Simulations({ onGoToMatch }) {
  const {
    active,
    activate,
    deactivate,
    reset,
    rename,
    countOf,
    nameOf,
    version,
  } = useSimulation();
  const { t } = useLang();
  void version;

  return (
    <div className="sim-tab">
      <p className="tz-text" style={{ marginTop: 0, marginBottom: 18 }}>
        {t("sim.intro")}
      </p>

      {!HAS_SIMULABLE && (
        <p className="sim-note" role="note">
          🏁 {t("sim.nothing")}
        </p>
      )}

      <div className="sim-grid">
        {SIM_SCENARIOS.map((n) => {
          const isActive = active === n;
          const count = countOf(n);
          const defaultName = `${t("sim.scenario")} ${n}`;
          return (
            <div
              key={n}
              className={`sim-card ${isActive ? "sim-card--active" : ""}`}
            >
              <div className="sim-card-head">
                <span className="sim-card-num">🧪 {n}</span>
                {isActive && (
                  <span className="sim-card-badge">{t("sim.card.active")}</span>
                )}
              </div>

              <input
                className="sim-card-name"
                defaultValue={nameOf(n)}
                placeholder={defaultName}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== nameOf(n)) rename(n, v);
                }}
              />

              <div className="sim-card-count">
                {count === 0
                  ? t("sim.card.empty")
                  : t("sim.card.matches", { n: count })}
              </div>

              <div className="sim-card-actions">
                {isActive ? (
                  <>
                    {onGoToMatch && HAS_SIMULABLE && (
                      <button
                        className="sim-btn sim-btn--primary"
                        onClick={onGoToMatch}
                      >
                        {t("sim.card.simulate")}
                      </button>
                    )}
                    <button className="sim-btn" onClick={deactivate}>
                      {t("sim.deactivate")}
                    </button>
                  </>
                ) : (
                  <button
                    className="sim-btn sim-btn--primary"
                    onClick={() => activate(n)}
                  >
                    {t("sim.activate")}
                  </button>
                )}
                <button
                  className="sim-btn sim-btn--ghost"
                  disabled={count === 0}
                  onClick={() => {
                    if (window.confirm(t("sim.reset.confirm"))) reset(n);
                  }}
                >
                  {t("sim.reset")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
