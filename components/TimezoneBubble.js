"use client";

// Aviso suave de zona horaria. Muchos usuarios quedaron con la zona del dev
// (Europe/Helsinki) por un default viejo del signup. Esta burbuja detecta la
// zona real del dispositivo (Intl) y, SOLO si la hora mostrada difiere de la
// configurada, sugiere corregirla. Si coinciden (o ya está en "auto"), no
// aparece — así no molesta a quien la tiene bien.

import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useLang } from "./LanguageContext";
import { resolveTz, tzLabel, formatTime } from "../lib/timezone";

const DISMISS_KEY = "fixture2026.tzBubbleDismissed";

// "America/Argentina/Buenos_Aires" → "Buenos Aires"
function prettyZone(zone) {
  const last = zone.split("/").pop() || zone;
  return last.replace(/_/g, " ");
}

export default function TimezoneBubble({ tz, onGoToAccount }) {
  const { user } = useAuth();
  const { t } = useLang();
  // Se evalúa solo en cliente (Intl + localStorage) para no romper la
  // hidratación del SSR.
  const [detected, setDetected] = useState(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    setDetected(resolveTz("auto"));
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  // No mostrar si: no hay sesión, ya la cerró, todavía no detectamos la zona,
  // o el usuario usa "auto" (que ya sigue al dispositivo).
  if (!user || dismissed || !detected || tz === "auto") return null;

  // Comparamos por la HORA mostrada, no por el nombre de la zona: dos zonas
  // distintas con el mismo offset (p.ej. Madrid vs París) muestran lo mismo,
  // así que no tiene sentido avisar.
  const now = new Date();
  if (formatTime(now, tz) === formatTime(now, "auto")) return null;

  return (
    <div className="tz-bubble" role="status">
      <span className="tz-bubble-icon">🕒</span>
      <span className="tz-bubble-text">
        {t("tzbubble.text", {
          stored: tzLabel(tz),
          detected: prettyZone(detected),
        })}
      </span>
      <button className="tz-bubble-cta" onClick={onGoToAccount}>
        {t("tzbubble.cta")}
      </button>
      <button
        className="tz-bubble-close"
        onClick={dismiss}
        aria-label={t("tzbubble.dismiss")}
        title={t("tzbubble.dismiss")}
      >
        ✕
      </button>
    </div>
  );
}
