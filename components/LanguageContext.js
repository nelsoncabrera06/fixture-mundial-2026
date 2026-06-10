"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LANG, detectLang, t as translate } from "../lib/i18n";

const LanguageContext = createContext(null);

const STORAGE_KEY = "fixture2026.lang";

export function LanguageProvider({ children }) {
  // Arranca en español (igual que el HTML prerenderizado) para no romper la
  // hidratación; ya en cliente se resuelve el idioma real en el useEffect.
  const [lang, setLangState] = useState(DEFAULT_LANG);

  // Resolución del idioma en cliente: si hay uno guardado se respeta; si no, se
  // detecta del navegador (es/en/pt, default inglés). Mismo patrón que la zona
  // horaria en app/page.js.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setLangState(saved || detectLang());
  }, []);

  // Mantiene <html lang> en sincronía (accesibilidad / SEO).
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (value) => {
    setLangState(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  };

  // t(key, vars) ya ligado al idioma activo.
  const t = (key, vars) => translate(lang, key, vars);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang debe usarse dentro de <LanguageProvider>");
  return ctx;
}
