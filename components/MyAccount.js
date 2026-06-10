"use client";

import { useState } from "react";
import { flag } from "../lib/teams";
import { TIMEZONES } from "../lib/timezone";
import { teamName, LANGS, LANG_LABELS } from "../lib/i18n";
import { useAuth } from "./AuthContext";
import { useLang } from "./LanguageContext";
import { changePassword, deleteAccount } from "../lib/auth";
import AuthModal from "./AuthModal";

export default function MyAccount({ myTeam, tz, onTzChange }) {
  const { user, signOut } = useAuth();
  const { lang, setLang, t } = useLang();
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
        <h2>{t("account.locked.title")}</h2>
        <p>{t("account.locked.sub")}</p>
        <button className="auth-submit" onClick={() => setAuthOpen(true)}>
          {t("account.locked.cta")}
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
      setPwdMsg({ type: "ok", text: t("account.pwd.updated") });
      setCurPwd("");
      setNewPwd("");
      setShowPwd(false);
    } catch (err) {
      setPwdMsg({ type: "error", text: err.message });
    }
  };

  const confirmDelete = async () => {
    if (confirmName !== user.username) {
      setDelError(t("account.delete.nameMismatch"));
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
          <span className="account-label">{t("account.user")}</span>
          <span className="account-value">
            {user.username}
            {user.role === "admin" && (
              <span className="account-role-badge">admin</span>
            )}
          </span>
        </div>
        <div className="account-row">
          <span className="account-label">{t("account.email")}</span>
          <span className="account-value">{user.email}</span>
        </div>
        <div className="account-row">
          <span className="account-label">{t("account.myteam")}</span>
          <span className="account-value">
            {flag(myTeam)} {teamName(myTeam, lang)}
          </span>
        </div>
        <div className="account-row account-row--select">
          <span className="account-label">{t("account.timezone")}</span>
          <select
            className="account-tz-select"
            value={tz}
            onChange={(e) => onTzChange(e.target.value)}
          >
            {TIMEZONES.map((tzOpt) => (
              <option key={tzOpt.value} value={tzOpt.value}>
                {tzOpt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="account-row account-row--select">
          <span className="account-label">{t("account.language")}</span>
          <select
            className="account-tz-select"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_LABELS[l]}
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
          {t("account.pwd.change")}
        </button>
      ) : (
        <form className="account-form" onSubmit={submitPwd}>
          <label className="auth-field">
            <span>{t("account.pwd.current")}</span>
            <input
              type="password"
              value={curPwd}
              onChange={(e) => setCurPwd(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label className="auth-field">
            <span>{t("account.pwd.new")}</span>
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
              {t("common.cancel")}
            </button>
            <button type="submit" className="account-btn">
              {t("common.save")}
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
        {t("account.logout")}
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
          {t("account.delete")}
        </button>
      ) : (
        <div className="account-danger-box">
          <p className="account-danger-text">
            {t("account.delete.warnPre")}
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
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="account-btn account-btn--danger"
              onClick={confirmDelete}
            >
              {t("account.delete.confirm")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
