"use client";

// ---------------------------------------------------------------------------
// ProfileProvider — reemplaza al viejo AuthProvider de Supabase.
//
// Expone el perfil local (ver lib/localProfile.js) con una forma casi idéntica
// a la que usaban los componentes antes, para que el cambio sea chico:
//
//   const { user, ready, updatePrefs, reset } = useProfile();
//
// `user` nunca es null una vez que `ready` es true: el perfil se crea solo en
// la primera visita. Por eso ya no hay pantallas bloqueadas ni modal de login.
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  PROFILE_KEY,
  loadProfile,
  patchProfile,
  resetAll,
} from "../lib/localProfile";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  // null hasta que se resuelve el perfil en el cliente (evita desajuste de
  // hidratación: el SSR no tiene localStorage).
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(loadProfile());
    setReady(true);

    // Otra pestaña cambió el perfil: lo releemos.
    const onStorage = (e) => {
      if (!e.key || e.key === PROFILE_KEY) setUser(loadProfile());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Actualiza equipo / zona horaria / favoritos / nombre. Sigue siendo async
  // para no tocar a los que ya hacían `await updatePrefs(...)`.
  const updatePrefs = useCallback(async (patch) => {
    const next = patchProfile(patch);
    setUser(next);
    return next;
  }, []);

  // Borra perfil + simulaciones + preferencias de este navegador.
  const reset = useCallback(() => {
    resetAll();
    setUser(loadProfile());
  }, []);

  return (
    <ProfileContext.Provider value={{ user, ready, updatePrefs, reset }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx)
    throw new Error("useProfile debe usarse dentro de <ProfileProvider>");
  return ctx;
}
