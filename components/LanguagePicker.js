"use client";

import { useState } from "react";
import { LANGS, LANG_LABELS } from "../lib/i18n";
import { useLang } from "./LanguageContext";

// Selector de idioma compacto para la barra lateral. Accesible sin sesión, así
// cualquier visitante (no solo los usuarios logueados) puede cambiarlo.
const LANG_FLAGS = { es: "🇪🇸", en: "🇬🇧", pt: "🇧🇷" };

export default function LanguagePicker() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="lang-compact">
      <button
        className="lang-chip"
        onClick={() => setOpen((v) => !v)}
        aria-label="Idioma / Language / Idioma"
      >
        🌐 {LANG_FLAGS[lang]} {LANG_LABELS[lang]} {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="lang-dropdown">
          {LANGS.map((l) => (
            <button
              key={l}
              className={`lang-option ${l === lang ? "active" : ""}`}
              onClick={() => {
                setLang(l);
                setOpen(false);
              }}
            >
              {LANG_FLAGS[l]} {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
