"use client";

// ---------------------------------------------------------------------------
// "Mi cuenta" sin cuentas: el perfil vive en este navegador (lib/localProfile).
// Acá se edita el nombre, el equipo, la zona horaria y el idioma, y se puede
// borrar todo lo guardado localmente.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { flag } from "../lib/teams";
import { TIMEZONES } from "../lib/timezone";
import { teamName, LANGS, LANG_LABELS } from "../lib/i18n";
import { MAX_USERNAME } from "../lib/localProfile";
import { useProfile } from "./ProfileContext";
import { useLang } from "./LanguageContext";

export default function MyAccount({ myTeam, tz, onTzChange }) {
  const { user, ready, updatePrefs, reset } = useProfile();
  const { lang, setLang, t } = useLang();

  // Borrador del nombre: se guarda recién al tocar "Guardar".
  const [nameDraft, setNameDraft] = useState("");
  const [nameMsg, setNameMsg] = useState(null); // { type: "ok" | "error", text }
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (user) setNameDraft(user.username);
  }, [user?.username]);

  // Hasta que el perfil carga no renderizamos (evita parpadeo).
  if (!ready || !user) return null;

  const trimmed = nameDraft.trim();
  const nameChanged = trimmed !== user.username;

  const saveName = async (e) => {
    e.preventDefault();
    if (!trimmed) {
      setNameMsg({ type: "error", text: t("account.name.empty") });
      return;
    }
    if (!nameChanged) return;
    await updatePrefs({ username: trimmed });
    setNameMsg({ type: "ok", text: t("account.saved") });
  };

  const doReset = () => {
    reset();
    setConfirmReset(false);
    setNameMsg(null);
  };

  return (
    <div className="account-container">
      <div className="account-avatar">{user.username[0].toUpperCase()}</div>

      <div className="account-card">
        <div className="account-row">
          <span className="account-label">{t("account.user")}</span>
          <form className="account-name-form" onSubmit={saveName}>
            <input
              className="account-name-input"
              value={nameDraft}
              maxLength={MAX_USERNAME}
              onChange={(e) => {
                setNameDraft(e.target.value);
                setNameMsg(null);
              }}
              aria-label={t("account.user")}
            />
            <button
              type="submit"
              className="account-btn account-btn--sm"
              disabled={!trimmed || !nameChanged}
            >
              {t("common.save")}
            </button>
          </form>
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

      {nameMsg && (
        <p
          className={nameMsg.type === "ok" ? "account-msg-ok" : "account-msg-error"}
        >
          {nameMsg.text}
        </p>
      )}

      <p className="account-note">{t("account.local.note")}</p>

      {/* Borrar datos locales (equivale a "eliminar cuenta", pero sin cuenta). */}
      {!confirmReset ? (
        <button
          className="account-btn account-btn--danger"
          onClick={() => setConfirmReset(true)}
        >
          {t("account.reset")}
        </button>
      ) : (
        <div className="account-danger-box">
          <p className="account-danger-text">{t("account.reset.warn")}</p>
          <div className="account-form-actions">
            <button
              type="button"
              className="account-btn account-btn--ghost"
              onClick={() => setConfirmReset(false)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="account-btn account-btn--danger"
              onClick={doReset}
            >
              {t("account.reset.confirm")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
