"use client";

import { useEffect, useRef, useState } from "react";
import { flag } from "../lib/teams";
import { teamName } from "../lib/i18n";
import { useLang } from "./LanguageContext";
import { googleCalUrl, outlookCalUrl, icsDataUri } from "../lib/calendar";

// Botón "Agregar al calendario" con menú (Google / Outlook / Apple u otro).
// Props: home, away, venue, city, label (ej. "Grupo A"), start (Date absoluto).
// compact = solo el emoji 📅 (el texto aparece como tooltip al pasar el mouse).
export default function AddToCalendar({
  home,
  away,
  venue,
  city,
  label,
  start,
  compact = false,
}) {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cerrar al hacer click afuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const title = `${flag(home)} ${teamName(home, lang)} ${t("vs")} ${flag(away)} ${teamName(away, lang)}`;
  const location = [venue, city].filter(Boolean).join(", ");
  const details = `${label} · ${t("event.worldcup")}\nhttps://fixturemundial.vercel.app`;
  const event = { title, start, location, details };

  const fileName = `${home}-vs-${away}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca acentos
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();

  return (
    <div className={`atc ${compact ? "atc--compact" : ""}`} ref={ref}>
      <button
        type="button"
        className={`atc-btn ${compact ? "atc-btn--compact" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("atc.add")}
        title={t("atc.add")}
      >
        📅{compact ? "" : ` ${t("atc.add")}`}
      </button>
      {open && (
        <div className="atc-menu" role="menu">
          <a
            className="atc-item"
            role="menuitem"
            href={googleCalUrl(event)}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            <span className="atc-ico">📆</span> Google Calendar
          </a>
          <a
            className="atc-item"
            role="menuitem"
            href={outlookCalUrl(event)}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            <span className="atc-ico">📧</span> Outlook
          </a>
          <a
            className="atc-item"
            role="menuitem"
            href={icsDataUri(event)}
            download={`${fileName}.ics`}
            onClick={() => setOpen(false)}
          >
            <span className="atc-ico">🍎</span> {t("atc.apple")}
          </a>
        </div>
      )}
    </div>
  );
}
