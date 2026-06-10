"use client";

import { useState } from "react";
import { CONTACT } from "../lib/about";
import { useAuth } from "./AuthContext";
import { useLang } from "./LanguageContext";
import AuthModal from "./AuthModal";

// Formulario de contacto vía Web3Forms. Requiere sesión iniciada: el nombre y el
// email salen del perfil (tabla profiles), así no llegan mensajes anónimos.
export default function ContactForm() {
  const { user, ready } = useAuth();
  const { t } = useLang();
  const [authOpen, setAuthOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | ok | error

  // Sin access key configurada, no mostramos nada.
  if (!CONTACT.web3formsKey) return null;
  // Hasta resolver la sesión, no renderizamos (evita parpadeo).
  if (!ready) return null;

  // Sin sesión: pantalla para iniciar sesión.
  if (!user) {
    return (
      <section className="about-card contact-locked">
        <div className="locked-icon">🔒</div>
        <h3>{t("contact.locked.title")}</h3>
        <p className="about-note">{t("contact.locked.sub")}</p>
        <button className="auth-submit" onClick={() => setAuthOpen(true)}>
          {t("common.signin")}
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </section>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    setStatus("sending");

    const payload = {
      access_key: CONTACT.web3formsKey,
      subject: "Nuevo mensaje desde Fixture Mundial 2026",
      from_name: "Fixture Mundial 2026",
      name: user.username, // del perfil, no editable
      email: user.email, // del perfil, no editable
      message: form.message.value,
      botcheck: form.botcheck.checked, // honeypot anti-spam
    };

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("ok");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "ok") {
    return (
      <section className="about-card contact-done">
        <div className="contact-done-icon">🙌</div>
        <h3>{t("contact.done.title")}</h3>
        <p>{t("contact.done.sub")}</p>
        <button
          type="button"
          className="about-link"
          onClick={() => setStatus("idle")}
        >
          {t("contact.done.again")}
        </button>
      </section>
    );
  }

  return (
    <section className="about-card">
      <h3 className="about-subtitle">{t("contact.title")}</h3>
      <p className="about-note">{t("contact.sub")}</p>

      <div className="contact-as">
        {t("contact.asPre")}<strong>{user.username}</strong>{" "}
        <span className="contact-as-mail">· {user.email}</span>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        {/* Honeypot anti-spam: oculto para humanos, lo completan los bots */}
        <input
          type="checkbox"
          name="botcheck"
          className="contact-hp"
          tabIndex={-1}
          autoComplete="off"
        />

        <label className="contact-field">
          <span>{t("contact.message")}</span>
          <textarea name="message" required rows={4} maxLength={1500} />
        </label>

        <button
          type="submit"
          className="contact-submit"
          disabled={status === "sending"}
        >
          {status === "sending" ? t("contact.sending") : t("contact.send")}
        </button>

        {status === "error" && (
          <p className="contact-error">{t("contact.error")}</p>
        )}
      </form>
    </section>
  );
}
