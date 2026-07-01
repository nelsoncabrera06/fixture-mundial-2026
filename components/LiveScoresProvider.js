"use client";

// ---------------------------------------------------------------------------
// LiveScoresProvider — trae los marcadores de la tabla `live_scores` de
// Supabase, los vuelca en la capa en vivo de lib/results.js y los refresca por
// polling (cada 30 s). El polling consulta SOLO la base (anon key, lectura
// pública vía RLS): es barato y NO gasta la cuota de football-data (esa la paga
// la Edge Function cada ~6 min).
//
// La data de la tabla cambia como mucho cada ~6 min, así que 30 s de polling
// alcanza de sobra para que se vea "en vivo" sin pesar.
//
// El `version` (contador) se expone por contexto: los componentes que muestran
// resultados llaman useLiveResults() y se re-renderizan cuando llega data nueva.
// ---------------------------------------------------------------------------

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { setLiveResults } from "../lib/results";
import { rowsToResults } from "../lib/liveScores";

const POLL_MS = 30000;
// Si el fetch falla, reintenta con backoff: 3s → 8s → 20s → luego ciclo normal.
const RETRY_DELAYS = [3000, 8000, 20000];

const LiveScoresContext = createContext({ version: 0, loading: true, refresh: () => {} });

export function LiveScoresProvider({ children }) {
  const [state, setState] = useState({ version: 0, loading: true });
  const refreshRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let retryCount = 0;
    let retryTimer = null;

    async function refresh() {
      const { data, error } = await supabase
        .from("live_scores")
        .select("*");
      if (cancelled) return;
      if (error || !data) {
        // Reintento con backoff antes de esperar el ciclo completo de 30s.
        const delay = RETRY_DELAYS[retryCount] ?? POLL_MS;
        retryCount = Math.min(retryCount + 1, RETRY_DELAYS.length);
        retryTimer = setTimeout(refresh, delay);
        return;
      }
      retryCount = 0;
      setLiveResults(rowsToResults(data));
      setState((s) => ({ version: s.version + 1, loading: false }));
    }

    refreshRef.current = refresh;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      refreshRef.current = null;
      clearInterval(id);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return (
    <LiveScoresContext.Provider value={{ ...state, refresh: () => refreshRef.current?.() }}>
      {children}
    </LiveScoresContext.Provider>
  );
}

// Suscribe al componente a las actualizaciones de marcadores. Devuelve un
// número que cambia con cada refresco (sirve solo para gatillar el re-render;
// los datos se leen con getResult() de lib/results.js).
export function useLiveResults() {
  return useContext(LiveScoresContext).version;
}

// Devuelve true mientras el primer fetch no completó exitosamente.
export function useLiveLoading() {
  return useContext(LiveScoresContext).loading;
}

// Dispara un fetch inmediato (sin resetear el intervalo de 30s).
export function useLiveRefresh() {
  return useContext(LiveScoresContext).refresh;
}
