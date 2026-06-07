"use client";

import { flag } from "../lib/teams";
import { TIMEZONES, tzLabel } from "../lib/timezone";

// Usuario hardcodeado para desarrollo. Reemplazar con auth real (NextAuth + Google SSO).
const DEV_USER = {
  username: "dev",
  email: "dev@example.com",
};

export default function MyAccount({ myTeam, tz, onTzChange }) {
  return (
    <div className="account-container">
      <div className="account-avatar">
        {DEV_USER.username[0].toUpperCase()}
      </div>

      <div className="account-card">
        <div className="account-row">
          <span className="account-label">👤 Usuario</span>
          <span className="account-value">{DEV_USER.username}</span>
        </div>
        <div className="account-row">
          <span className="account-label">📧 Email</span>
          <span className="account-value">{DEV_USER.email}</span>
        </div>
        <div className="account-row">
          <span className="account-label">⭐ Mi equipo</span>
          <span className="account-value">
            {flag(myTeam)} {myTeam}
          </span>
        </div>
        <div className="account-row account-row--select">
          <span className="account-label">🕒 Zona horaria</span>
          <select
            className="account-tz-select"
            value={tz}
            onChange={(e) => onTzChange(e.target.value)}
          >
            {TIMEZONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="account-dev-badge">
        🛠️ Modo desarrollo — sin autenticación real
      </div>
    </div>
  );
}
