"use client";

import { TIMEZONES, tzLabel } from "../lib/timezone";

export default function TimezonePicker({ tz, onChange }) {
  return (
    <div className="tz-banner">
      <div className="tz-text">
        🕒 Los partidos se juegan en la hora local de cada sede (EE.UU., México y
        Canadá abarcan varias zonas). Acá los ves convertidos a tu hora:{" "}
        <strong>{tzLabel(tz)}</strong>.
      </div>
      <select
        aria-label="Elegí tu zona horaria"
        value={tz}
        onChange={(e) => onChange(e.target.value)}
      >
        {TIMEZONES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
