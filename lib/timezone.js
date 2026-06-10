// Utilidades de zona horaria. Cada partido se guarda como instante UTC absoluto
// y acá lo formateamos en la zona elegida con la API Intl del navegador.

import { langToLocale } from "./i18n";

export const DEFAULT_TZ = "Europe/Helsinki"; // Finlandia (tu zona por defecto)

// Opciones del selector. "auto" usa la zona del dispositivo.
export const TIMEZONES = [
  { value: "auto", label: "Automática (tu dispositivo)" },
  { value: "Europe/Helsinki", label: "Finlandia — Helsinki (EET/EEST)" },
  { value: "Europe/Madrid", label: "España — Madrid (CET/CEST)" },
  { value: "Europe/London", label: "Reino Unido — Londres (GMT/BST)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina — Buenos Aires (ART)" },
  { value: "America/Mexico_City", label: "México — Ciudad de México (CST)" },
  { value: "America/New_York", label: "EE.UU. Este — Nueva York (ET)" },
  { value: "America/Chicago", label: "EE.UU. Centro — Chicago (CT)" },
  { value: "America/Los_Angeles", label: "EE.UU. Oeste — Los Ángeles (PT)" },
  { value: "UTC", label: "UTC" },
];

export function resolveTz(tz) {
  if (!tz || tz === "auto") {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }
  return tz;
}

export function tzLabel(tz) {
  const resolved = resolveTz(tz);
  const match = TIMEZONES.find((t) => t.value === tz);
  if (tz === "auto") return `${resolved} (detectada)`;
  return match ? match.label : resolved;
}

// "jue 11 jun" (capitalizado) — `lang` define el locale (es/en/pt).
export function formatDate(instant, tz, lang = "es") {
  const s = new Intl.DateTimeFormat(langToLocale(lang), {
    timeZone: resolveTz(tz),
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(instant);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// "22:00"
export function formatTime(instant, tz, lang = "es") {
  return new Intl.DateTimeFormat(langToLocale(lang), {
    timeZone: resolveTz(tz),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(instant);
}

// Clave de agrupación por día calendario en la zona elegida (AAAA-MM-DD).
export function dayKey(instant, tz) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveTz(tz),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
  return parts;
}
