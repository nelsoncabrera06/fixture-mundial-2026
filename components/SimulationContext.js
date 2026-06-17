"use client";

// ---------------------------------------------------------------------------
// SimulationProvider — estado del "Modo simulación · ¿Qué pasa si?".
//
// El usuario tiene hasta 4 escenarios. Al activar uno entra en modo simulación:
// puede simular el resultado de cualquier partido que TODAVÍA no se jugó (los
// jugados son intocables). Los overrides se guardan por usuario+escenario en la
// tabla `simulations` de Supabase (JSONB), NUNCA tocan los resultados reales.
//
// Este contexto:
//  - sincroniza la capa de simulación de lib/results.js (setSimActive/
//    setSimResults) para que toda la app (tabla, cruces) refleje el escenario;
//  - persiste cada cambio en Supabase;
//  - recuerda el escenario activo en localStorage para sobrevivir al reload.
//
// `version` se incrementa con cada cambio: los componentes que muestran
// resultados en vivo (p. ej. el editor de la vista Partido) llaman
// useSimulation() y se re-renderizan. El resto de las pestañas se re-montan al
// navegar, así que leen la capa ya actualizada sin más.
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";
import { matchId, setSimActive, setSimResults } from "../lib/results";

const ACTIVE_KEY = "fixture2026.simScenario";
export const SIM_SCENARIOS = [1, 2, 3, 4];

const SimulationContext = createContext(null);

// Formato guardado en DB { h, a } → formato de la capa de resultados.
function toResultMap(stored) {
  const out = {};
  for (const [id, v] of Object.entries(stored || {})) {
    if (v && v.h != null && v.a != null) {
      out[id] = { homeGoals: v.h, awayGoals: v.a, status: "FT" };
    }
  }
  return out;
}

export function SimulationProvider({ children }) {
  const { user } = useAuth();
  // Escenario activo (1..4) o null si no estamos en modo simulación.
  const [active, setActive] = useState(null);
  // Overrides del escenario activo: matchId → { h, a }.
  const [results, setResults] = useState({});
  // Resumen de TODOS los escenarios del usuario: n → { name, results }.
  const [scenarios, setScenarios] = useState({});
  // Contador para gatillar re-render de los consumidores.
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  // Vuelca el escenario a la capa de results.js y re-renderiza.
  const syncLayer = useCallback((isActive, res) => {
    setSimActive(isActive);
    setSimResults(isActive ? toResultMap(res) : {});
    bump();
  }, []);

  // Trae todos los escenarios del usuario (RLS limita a los propios).
  const loadAll = useCallback(async () => {
    if (!user) return {};
    const { data, error } = await supabase
      .from("simulations")
      .select("scenario, name, results")
      .eq("user_id", user.id);
    if (error || !data) return {};
    const map = {};
    data.forEach((row) => {
      map[row.scenario] = { name: row.name || "", results: row.results || {} };
    });
    setScenarios(map);
    return map;
  }, [user]);

  // Carga inicial al iniciar sesión / cierre al salir. Si había un escenario
  // activo guardado, se reactiva solo.
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setActive(null);
      setResults({});
      setScenarios({});
      syncLayer(false, {});
      return;
    }

    (async () => {
      const map = await loadAll();
      if (cancelled) return;
      const saved = Number(window.localStorage.getItem(ACTIVE_KEY));
      if (saved >= 1 && saved <= 4) {
        const res = map[saved]?.results || {};
        setActive(saved);
        setResults(res);
        syncLayer(true, res);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loadAll, syncLayer]);

  // Inserta/actualiza la fila del escenario en Supabase. Solo manda las
  // columnas que cambian (en conflicto, PostgREST actualiza solo esas).
  const persist = useCallback(
    async (n, patch) => {
      if (!user) return false;
      const row = {
        user_id: user.id,
        scenario: n,
        updated_at: new Date().toISOString(),
      };
      if (patch.results !== undefined) row.results = patch.results;
      if (patch.name !== undefined) row.name = patch.name;
      const { error } = await supabase
        .from("simulations")
        .upsert(row, { onConflict: "user_id,scenario" });
      return !error;
    },
    [user]
  );

  const activate = useCallback(
    async (n) => {
      if (!user) return;
      const map = await loadAll();
      const res = map[n]?.results || {};
      setActive(n);
      setResults(res);
      window.localStorage.setItem(ACTIVE_KEY, String(n));
      syncLayer(true, res);
    },
    [user, loadAll, syncLayer]
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
    async (match, homeGoals, awayGoals) => {
      if (active == null) return;
      const id = matchId(match);
      const next = { ...results, [id]: { h: homeGoals, a: awayGoals } };
      setResults(next);
      setScenarios((s) => ({
        ...s,
        [active]: { ...(s[active] || {}), results: next },
      }));
      syncLayer(true, next);
      await persist(active, { results: next });
    },
    [active, results, syncLayer, persist]
  );

  // Quita el resultado simulado de un partido (vuelve a lo real).
  const clearMatch = useCallback(
    async (match) => {
      if (active == null) return;
      const id = matchId(match);
      const next = { ...results };
      delete next[id];
      setResults(next);
      setScenarios((s) => ({
        ...s,
        [active]: { ...(s[active] || {}), results: next },
      }));
      syncLayer(true, next);
      await persist(active, { results: next });
    },
    [active, results, syncLayer, persist]
  );

  // Borra todos los resultados simulados de un escenario.
  const reset = useCallback(
    async (n) => {
      const next = {};
      setScenarios((s) => ({ ...s, [n]: { ...(s[n] || {}), results: next } }));
      if (n === active) {
        setResults(next);
        syncLayer(true, next);
      }
      await persist(n, { results: next });
    },
    [active, syncLayer, persist]
  );

  const rename = useCallback(
    async (n, name) => {
      setScenarios((s) => ({ ...s, [n]: { ...(s[n] || {}), name } }));
      await persist(n, { name });
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
        enabled: !!user,
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
