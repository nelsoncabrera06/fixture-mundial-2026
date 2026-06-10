"use client";

// Cartelito de estado de un partido: 🔴 EN VIVO 67' / ENTRETIEMPO / Finalizado.
// Recibe el `status` ya normalizado (LIVE | HT | FT) y el minuto opcional.
// Devuelve null si no hay estado (partido sin empezar).
import { useLang } from "./LanguageContext";

export default function LiveBadge({ status, elapsed }) {
  const { t } = useLang();
  if (!status) return null;

  if (status === "LIVE") {
    return (
      <span className="live-badge live-badge--live">
        <span className="live-dot" />
        {t("live.now")}
        {elapsed != null ? ` ${elapsed}'` : ""}
      </span>
    );
  }
  if (status === "HT") {
    return <span className="live-badge live-badge--ht">{t("live.ht")}</span>;
  }
  if (status === "FT") {
    return <span className="live-badge live-badge--ft">{t("live.ft")}</span>;
  }
  return null;
}
