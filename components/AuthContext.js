"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  getCurrentUser,
  login,
  register,
  setUserPrefs,
} from "../lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `ready` queda en false hasta resolver la sesión inicial.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    // Sesión inicial al cargar la app.
    getCurrentUser().then((u) => {
      if (!active) return;
      setUser(u);
      setReady(true);
    });

    // Supabase nos avisa cuando cambia la sesión (login, logout, refresh de
    // token en otra pestaña, etc.). Re-leemos el usuario en cada cambio.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      getCurrentUser().then((u) => {
        if (active) setUser(u);
      });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // mode: "login" | "register". Lanza Error con mensaje legible si falla.
  const signIn = async (credentials, mode = "login") => {
    const u =
      mode === "register"
        ? await register(credentials)
        : await login(credentials);
    setUser(u);
    return u;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Vuelve a leer la sesión desde la DB (p. ej. tras cambios de admin).
  const refresh = async () => {
    const u = await getCurrentUser();
    setUser(u);
  };

  // Actualiza equipo / zona horaria del usuario logueado.
  const updatePrefs = async (patch) => {
    if (!user) return;
    const updated = await setUserPrefs(user.id, patch);
    if (updated) setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{ user, ready, signIn, signOut, refresh, updatePrefs }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
