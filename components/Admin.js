"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { listUsers, updateUser, adminDeleteUser } from "../lib/auth";
import { flag, FLAGS } from "../lib/teams";
import { TIMEZONES, tzLabel } from "../lib/timezone";

export default function Admin() {
  const { user, refresh } = useAuth();
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
        <h2>Acceso restringido</h2>
        <p>Solo los administradores pueden ver esta sección.</p>
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
    if (
      !window.confirm(
        `¿Eliminar al usuario "${u.username}"? Esta acción no se puede deshacer.`
      )
    ) {
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
          👥 Usuarios
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
              {users.length === 1 ? "usuario registrado" : "usuarios registrados"}
            </span>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Equipo</th>
                <th>Zona horaria</th>
                <th className="admin-th-actions">Acciones</th>
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
                            {teams.map((t) => (
                              <option key={t} value={t}>
                                {t}
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
                            {TIMEZONES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="admin-actions">
                          <button
                            className="admin-btn"
                            onClick={() => saveEdit(u.id)}
                          >
                            Guardar
                          </button>
                          <button
                            className="admin-btn admin-btn--ghost"
                            onClick={cancelEdit}
                          >
                            Cancelar
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
                          {flag(u.team)} {u.team}
                        </td>
                        <td>{tzLabel(u.timezone)}</td>
                        <td className="admin-actions">
                          <button
                            className="admin-btn admin-btn--ghost"
                            onClick={() => startEdit(u)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="admin-btn admin-btn--danger"
                            onClick={() => removeUser(u)}
                            title="Eliminar usuario"
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
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    Cargando usuarios…
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
