"use client";

import { useState } from "react";
import { TIMEZONES, tzLabel } from "../lib/timezone";

export default function TimezonePicker({ tz, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="tz-compact">
      <button className="tz-chip" onClick={() => setOpen((v) => !v)}>
        🕒 {tzLabel(tz)} {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="tz-dropdown">
          <select
            aria-label="Elegí tu zona horaria"
            value={tz}
            onChange={(e) => { onChange(e.target.value); setOpen(false); }}
            size={6}
          >
            {TIMEZONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
