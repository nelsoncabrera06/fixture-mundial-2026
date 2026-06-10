"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useLang } from "./LanguageContext";
import { listUsers, updateUser, adminDeleteUser } from "../lib/auth";
import { flag, FLAGS } from "../lib/teams";
import { TIMEZONES, tzLabel } from "../lib/timezone";
import { teamName } from "../lib/i18n";

export default function Admin() {
  const { user, refresh } = useAuth();
  const { lang, t } = useLang();
  const [section, setSection] = useState("usuarios");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");

  const teams = Object.keys(FLAGS).sort();
  const isAdmin = user && user.role === "admin";

  const reload = async () => {
    setLoading(true);
    try {
      setUsers(await listUsers());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin]);

  // Defensa en profundidad: además de ocultar la pestaña en el sidebar.
  if (!isAdmin) {
    return (
      <div className="locked-screen">
        <div className="locked-icon">🛡️</div>
        <h2>{t("admin.restricted.title")}</h2>
        <p>{t("admin.restricted.sub")}</p>
      </div>
    );
  }

  const startEdit = (u) => {
    setEditingId(u.id);
    setDraft({ username: u.username, team: u.team, timezone: u.timezone });
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
    setError("");
  };

  const saveEdit = async (id) => {
    try {
      await updateUser(id, draft);
      cancelEdit();
      await reload();
      await refresh(); // por si se editó al admin de la sesión actual
    } catch (err) {
      setError(err.message);
    }
  };

  const removeUser = async (u) => {
    if (!window.confirm(t("admin.confirmDelete", { name: u.username }))) {
      return;
    }
    try {
      await adminDeleteUser(u.id);
      await reload();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-container">
      <div className="myteam-tabs">
        <button
          className={`myteam-tab ${section === "usuarios" ? "active" : ""}`}
          onClick={() => setSection("usuarios")}
        >
          {t("admin.users")}
        </button>
      </div>

      {section === "usuarios" && (
        <>
        <div className="admin-stats">
          <div className="admin-stat">
            <span className="admin-stat-num">
              {loading ? "…" : users.length}
            </span>
            <span className="admin-stat-label">
              {users.length === 1
                ? t("admin.userCount.one")
                : t("admin.userCount.other")}
            </span>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.col.user")}</th>
                <th>{t("admin.col.email")}</th>
                <th>{t("admin.col.team")}</th>
                <th>{t("admin.col.tz")}</th>
                <th className="admin-th-actions">{t("admin.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const editing = editingId === u.id;
                return (
                  <tr key={u.id}>
                    {editing ? (
                      <>
                        <td>
                          <input
                            className="admin-input"
                            value={draft.username}
                            onChange={(e) =>
                              setDraft({ ...draft, username: e.target.value })
                            }
                          />
                        </td>
                        <td className="admin-readonly">{u.email}</td>
                        <td>
                          <select
                            className="admin-input"
                            value={draft.team}
                            onChange={(e) =>
                              setDraft({ ...draft, team: e.target.value })
                            }
                          >
                            {teams.map((teamOpt) => (
                              <option key={teamOpt} value={teamOpt}>
                                {teamName(teamOpt, lang)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="admin-input"
                            value={draft.timezone}
                            onChange={(e) =>
                              setDraft({ ...draft, timezone: e.target.value })
                            }
                          >
                            {TIMEZONES.map((tzOpt) => (
                              <option key={tzOpt.value} value={tzOpt.value}>
                                {tzOpt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="admin-actions">
                          <button
                            className="admin-btn"
                            onClick={() => saveEdit(u.id)}
                          >
                            {t("common.save")}
                          </button>
                          <button
                            className="admin-btn admin-btn--ghost"
                            onClick={cancelEdit}
                          >
                            {t("common.cancel")}
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          {u.username}
                          {u.role === "admin" && (
                            <span className="account-role-badge">admin</span>
                          )}
                        </td>
                        <td>{u.email}</td>
                        <td>
                          {flag(u.team)} {teamName(u.team, lang)}
                        </td>
                        <td>{tzLabel(u.timezone)}</td>
                        <td className="admin-actions">
                          <button
                            className="admin-btn admin-btn--ghost"
                            onClick={() => startEdit(u)}
                          >
                            {t("admin.edit")}
                          </button>
                          <button
                            className="admin-btn admin-btn--danger"
                            onClick={() => removeUser(u)}
                            title={t("admin.deleteTitle")}
                          >
                            🗑️
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    {t("admin.empty")}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    {t("admin.loading")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {error && <p className="account-msg-error">{error}</p>}
        </div>
        </>
      )}
    </div>
  );
}
