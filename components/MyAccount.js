"use client";

import { useState } from "react";
import { flag } from "../lib/teams";
import { TIMEZONES } from "../lib/timezone";
import { useAuth } from "./AuthContext";
import { changePassword, deleteAccount } from "../lib/auth";
import AuthModal from "./AuthModal";

export default function MyAccount({ myTeam, tz, onTzChange }) {
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // Cambio de contraseña.
  const [showPwd, setShowPwd] = useState(false);
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState(null); // { type: "ok" | "error", text }

  // Eliminar cuenta (requiere escribir el nombre de usuario).
  const [showDelete, setShowDelete] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [delError, setDelError] = useState("");

  // Sin sesión: pantalla bloqueada con acceso al modal.
  if (!user) {
    return (
      <div className="locked-screen">
        <div className="locked-icon">👤</div>
        <h2>Iniciá sesión</h2>
        <p>Accedé a tu cuenta para gestionar tu perfil.</p>
        <button className="auth-submit" onClick={() => setAuthOpen(true)}>
          Iniciar sesión
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  const submitPwd = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    try {
      await changePassword({
        email: user.email,
        currentPassword: curPwd,
        newPassword: newPwd,
      });
      setPwdMsg({ type: "ok", text: "Contraseña actualizada." });
      setCurPwd("");
      setNewPwd("");
      setShowPwd(false);
    } catch (err) {
      setPwdMsg({ type: "error", text: err.message });
    }
  };

  const confirmDelete = async () => {
    if (confirmName !== user.username) {
      setDelError("El nombre no coincide.");
      return;
    }
    try {
      await deleteAccount(user.username);
      await signOut();
    } catch (err) {
      setDelError(err.message);
    }
  };

  return (
    <div className="account-container">
      <div className="account-avatar">{user.username[0].toUpperCase()}</div>

      <div className="account-card">
        <div className="account-row">
          <span className="account-label">👤 Usuario</span>
          <span className="account-value">
            {user.username}
            {user.role === "admin" && (
              <span className="account-role-badge">admin</span>
            )}
          </span>
        </div>
        <div className="account-row">
          <span className="account-label">📧 Email</span>
          <span className="account-value">{user.email}</span>
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

      {/* Cambio de contraseña */}
      {!showPwd ? (
        <button
          className="account-btn"
          onClick={() => {
            setShowPwd(true);
            setPwdMsg(null);
          }}
        >
          🔑 Cambiar contraseña
        </button>
      ) : (
        <form className="account-form" onSubmit={submitPwd}>
          <label className="auth-field">
            <span>Contraseña actual</span>
            <input
              type="password"
              value={curPwd}
              onChange={(e) => setCurPwd(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label className="auth-field">
            <span>Nueva contraseña</span>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <div className="account-form-actions">
            <button
              type="button"
              className="account-btn account-btn--ghost"
              onClick={() => {
                setShowPwd(false);
                setCurPwd("");
                setNewPwd("");
                setPwdMsg(null);
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="account-btn">
              Guardar
            </button>
          </div>
        </form>
      )}

      {pwdMsg && (
        <p
          className={
            pwdMsg.type === "ok" ? "account-msg-ok" : "account-msg-error"
          }
        >
          {pwdMsg.text}
        </p>
      )}

      <button className="account-btn account-btn--ghost" onClick={signOut}>
        🚪 Cerrar sesión
      </button>

      {/* Eliminar cuenta */}
      {!showDelete ? (
        <button
          className="account-btn account-btn--danger"
          onClick={() => {
            setShowDelete(true);
            setConfirmName("");
            setDelError("");
          }}
        >
          🗑️ Eliminar cuenta
        </button>
      ) : (
        <div className="account-danger-box">
          <p className="account-danger-text">
            Esta acción es irreversible. Para confirmar, escribí tu usuario{" "}
            <strong>{user.username}</strong>:
          </p>
          <input
            className="account-danger-input"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={user.username}
          />
          {delError && <p className="account-msg-error">{delError}</p>}
          <div className="account-form-actions">
            <button
              type="button"
              className="account-btn account-btn--ghost"
              onClick={() => {
                setShowDelete(false);
                setConfirmName("");
                setDelError("");
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="account-btn account-btn--danger"
              onClick={confirmDelete}
            >
              Eliminar definitivamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
