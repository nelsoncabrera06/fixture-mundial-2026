"use client";

// Contexto mínimo para abrir el detalle de un partido desde cualquier tarjeta
// (Fase de grupos, Calendario, Playoffs, etc.) sin pasar props por toda la app.
// El estado real (qué partido + cambiar a la pestaña "Partido") vive en page.js;
// acá sólo se expone la función openMatch(match) vía contexto.
import { createContext, useContext } from "react";

export const MatchNavContext = createContext(() => {});

export function useOpenMatch() {
  return useContext(MatchNavContext);
}
