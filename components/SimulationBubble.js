"use client";

// Indicador de "Modo simulación" presente en TODAS las pestañas mientras hay un
// escenario activo. A diferencia de TimezoneBubble, no se descarta: es un
// indicador de estado. Trae accesos rápidos para gestionar o salir del modo.

import { useSimulation } from "./SimulationContext";
import { useLang } from "./LanguageContext";

export default function SimulationBubble({ onManage }) {
  const { active, deactivate, nameOf, version } = useSimulation();
  const { t } = useLang();
  void version; // re-render al cambiar el estado de simulación

  if (active == null) return null;

  const name = nameOf(active) || `${t("sim.scenario")} ${active}`;

  return (
    <div className="sim-bubble" role="status">
      <span className="sim-bubble-icon">🧪</span>
      <span className="sim-bubble-text">
        <strong>{t("sim.bubble.label")}</strong> · {name}
      </span>
      <button className="sim-bubble-cta" onClick={onManage}>
        {t("sim.bubble.manage")}
      </button>
      <button className="sim-bubble-exit" onClick={deactivate}>
        {t("sim.bubble.exit")}
      </button>
    </div>
  );
}
