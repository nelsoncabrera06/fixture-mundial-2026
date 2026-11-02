"use client";

import { useState } from "react";
import { CONTACT } from "../lib/about";
import { useProfile } from "./ProfileContext";
import { useLang } from "./LanguageContext";

// Formulario de contacto vía Web3Forms. Ya no hay sesión: el nombre viene
// prellenado con el perfil local y el email lo escribe quien manda el mensaje.
export default function ContactForm() {
  const { user } = useProfile();
  const { t } = useLang();
  const [status, setStatus] = useState("idle"); // idle | sending | ok | error

  // Sin access key configurada, no mostramos nada.
  if (!CONTACT.web3formsKey) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    setStatus("sending");

    // Ojo: `form.name` es el atributo `name` del <form>, no el input. Hay que
    // pedir los campos por `elements` para no pisar la propiedad del form.
    const nameEl = form.elements.namedItem("name");
    const emailEl = form.elements.namedItem("email");

    const payload = {
      access_key: CONTACT.web3formsKey,
      subject: "Nuevo mensaje desde Fixture Mundial 2026",
      from_name: "Fixture Mundial 2026",
      name: (nameEl?.value || "").trim() || user?.username || "Anónimo",
      email: (emailEl?.value || "").trim(),
      message: form.elements.namedItem("message").value,
      botcheck: form.elements.namedItem("botcheck").checked, // honeypot anti-spam
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
          <span>{t("contact.name")}</span>
          <input
            name="name"
            type="text"
            maxLength={60}
            defaultValue={user?.username || ""}
            autoComplete="name"
          />
        </label>

        <label className="contact-field">
          <span>{t("contact.email")}</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>

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
