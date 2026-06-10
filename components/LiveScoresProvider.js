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

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { setLiveResults } from "../lib/results";
import { rowsToResults } from "../lib/liveScores";

const POLL_MS = 30000;

const LiveScoresContext = createContext(0);

export function LiveScoresProvider({ children }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const { data, error } = await supabase
        .from("live_scores")
        .select("*");
      if (cancelled || error || !data) return;
      setLiveResults(rowsToResults(data));
      setVersion((v) => v + 1); // fuerza re-render de los consumidores
    }

    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <LiveScoresContext.Provider value={version}>
      {children}
    </LiveScoresContext.Provider>
  );
}

// Suscribe al componente a las actualizaciones de marcadores. Devuelve un
// número que cambia con cada refresco (sirve solo para gatillar el re-render;
// los datos se leen con getResult() de lib/results.js).
export function useLiveResults() {
  return useContext(LiveScoresContext);
}
