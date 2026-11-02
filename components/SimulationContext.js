"use client";

// ---------------------------------------------------------------------------
// SimulationProvider — estado del "Modo simulación · ¿Qué pasa si?".
//
// El usuario tiene hasta 4 escenarios. Al activar uno entra en modo simulación:
// puede simular el resultado de cualquier partido que TODAVÍA no se jugó (los
// jugados son intocables). Los overrides se guardan por escenario en el
// localStorage de este navegador, NUNCA tocan los resultados reales.
//
// Este contexto:
//  - sincroniza la capa de simulación de lib/results.js (setSimActive/
//    setSimResults) para que toda la app (tabla, cruces) refleje el escenario;
//  - persiste cada cambio en localStorage (antes: tabla `simulations`);
//  - recuerda el escenario activo para sobrevivir al reload.
//
// `version` se incrementa con cada cambio: los componentes que muestran
// resultados (p. ej. el editor de la vista Partido) llaman useSimulation() y se
// re-renderizan. El resto de las pestañas se re-montan al navegar, así que leen
// la capa ya actualizada sin más.
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { RESET_EVENT, SIM_KEY } from "../lib/localProfile";
import { matchId, setSimActive, setSimResults } from "../lib/results";

const ACTIVE_KEY = "fixture2026.simScenario";
export const SIM_SCENARIOS = [1, 2, 3, 4];

const SimulationContext = createContext(null);

// Formato guardado { h, a } → formato de la capa de resultados.
function toResultMap(stored) {
  const out = {};
  for (const [id, v] of Object.entries(stored || {})) {
    if (v && v.h != null && v.a != null) {
      out[id] = { homeGoals: v.h, awayGoals: v.a, status: "FT" };
    }
  }
  return out;
}

// Todos los escenarios: { [n]: { name, results } }.
function readAll() {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(window.localStorage.getItem(SIM_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SIM_KEY, JSON.stringify(map));
}

export function SimulationProvider({ children }) {
  // Escenario activo (1..4) o null si no estamos en modo simulación.
  const [active, setActive] = useState(null);
  // Overrides del escenario activo: matchId → { h, a }.
  const [results, setResults] = useState({});
  // Resumen de TODOS los escenarios: n → { name, results }.
  const [scenarios, setScenarios] = useState({});
  // Contador para gatillar re-render de los consumidores.
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  // Vuelca el escenario a la capa de results.js y re-renderiza.
  const syncLayer = useCallback((isActive, res) => {
    setSimActive(isActive);
    setSimResults(isActive ? toResultMap(res) : {});
    setVersion((v) => v + 1);
  }, []);

  // Carga inicial: escenarios guardados + reactivación del que estaba activo.
  // También escucha el borrado global de datos locales.
  useEffect(() => {
    const map = readAll();
    setScenarios(map);
    const saved = Number(window.localStorage.getItem(ACTIVE_KEY));
    if (saved >= 1 && saved <= 4) {
      const res = map[saved]?.results || {};
      setActive(saved);
      setResults(res);
      syncLayer(true, res);
    }

    const onReset = () => {
      window.localStorage.removeItem(ACTIVE_KEY);
      setActive(null);
      setResults({});
      setScenarios({});
      syncLayer(false, {});
    };
    window.addEventListener(RESET_EVENT, onReset);
    return () => window.removeEventListener(RESET_EVENT, onReset);
  }, [syncLayer]);

  // Inserta/actualiza el escenario en localStorage y refresca el estado.
  const persist = useCallback((n, patch) => {
    const map = readAll();
    map[n] = { ...(map[n] || {}), ...patch };
    writeAll(map);
    setScenarios(map);
    return map;
  }, []);

  const activate = useCallback(
    (n) => {
      const res = readAll()[n]?.results || {};
      setActive(n);
      setResults(res);
      window.localStorage.setItem(ACTIVE_KEY, String(n));
      syncLayer(true, res);
    },
    [syncLayer]
  );

  const deactivate = useCallback(() => {
    setActive(null);
    setResults({});
    window.localStorage.removeItem(ACTIVE_KEY);
    syncLayer(false, {});
  }, [syncLayer]);

  // Guarda (o reemplaza) el resultado simulado de un partido en el escenario
  // activo.
  const saveMatch = useCallback(
    (match, homeGoals, awayGoals) => {
      if (active == null) return;
      const id = matchId(match);
      const next = { ...results, [id]: { h: homeGoals, a: awayGoals } };
      setResults(next);
      persist(active, { results: next });
      syncLayer(true, next);
    },
    [active, results, syncLayer, persist]
  );

  // Quita el resultado simulado de un partido (vuelve a lo real).
  const clearMatch = useCallback(
    (match) => {
      if (active == null) return;
      const id = matchId(match);
      const next = { ...results };
      delete next[id];
      setResults(next);
      persist(active, { results: next });
      syncLayer(true, next);
    },
    [active, results, syncLayer, persist]
  );

  // Borra todos los resultados simulados de un escenario.
  const reset = useCallback(
    (n) => {
      const next = {};
      persist(n, { results: next });
      if (n === active) {
        setResults(next);
        syncLayer(true, next);
      }
    },
    [active, syncLayer, persist]
  );

  const rename = useCallback(
    (n, name) => {
      persist(n, { name });
    },
    [persist]
  );

  // Cantidad de partidos simulados de un escenario.
  const countOf = useCallback(
    (n) => Object.keys(scenarios[n]?.results || {}).length,
    [scenarios]
  );

  // Nombre guardado del escenario (vacío si nunca se renombró).
  const nameOf = useCallback((n) => scenarios[n]?.name || "", [scenarios]);

  return (
    <SimulationContext.Provider
      value={{
        active,
        scenarios,
        version,
        activate,
        deactivate,
        saveMatch,
        clearMatch,
        reset,
        rename,
        countOf,
        nameOf,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx)
    throw new Error("useSimulation debe usarse dentro de <SimulationProvider>");
  return ctx;
}
