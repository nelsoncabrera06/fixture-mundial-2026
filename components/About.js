"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AUTHOR, LINKS, DONATIONS, CONTACT } from "../lib/about";
import ContactForm from "./ContactForm";

// Fila de cripto con copiar + ver QR + "ya envié". Si no hay dirección, "Próximamente".
function CryptoRow({ label, address, note }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [sent, setSent] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* algunos navegadores bloquean clipboard; el texto igual es seleccionable */
    }
  };

  // Avisa al dueño por mail (vía Web3Forms) que alguien marcó una donación.
  // El "gracias" se muestra igual aunque no haya key o falle el envío.
  const markSent = async () => {
    setSent(true);
    if (!CONTACT.web3formsKey) return;
    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: CONTACT.web3formsKey,
          subject: "💸 Donación cripto — Fixture Mundial 2026",
          from_name: "Fixture Mundial 2026",
          message: `Alguien marcó que te envió ${label} por tu página Fixture Mundial 2026. Chequeá tu wallet.`,
        }),
      });
    } catch {
      /* el visitante ya vio el agradecimiento; el aviso es best-effort */
    }
  };

  return (
    <div className="crypto-row">
      <div className="crypto-head">
        <span className="crypto-label">{label}</span>
        {!address && <span className="crypto-soon">Próximamente</span>}
      </div>
      {address && (
        <>
          <div className="crypto-addr-row">
            <code className="crypto-addr">{address}</code>
            <button type="button" className="copy-btn" onClick={copy}>
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
            <button
              type="button"
              className="qr-btn"
              onClick={() => setShowQR((v) => !v)}
              aria-expanded={showQR}
            >
              {showQR ? "Ocultar QR" : "Ver QR"}
            </button>
          </div>
          {showQR && (
            <div className="crypto-qr">
              <QRCodeSVG value={address} size={168} marginSize={2} />
              <span className="crypto-qr-hint">Escaneá con tu wallet</span>
            </div>
          )}
          {note && <p className="crypto-note">{note}</p>}

          {sent ? (
            <p className="crypto-thanks">
              💚 ¡Muchas gracias por tu donación! 🙌
            </p>
          ) : (
            <button type="button" className="sent-btn" onClick={markSent}>
              Ya envié mi donación
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function About() {
  const hasDonations =
    DONATIONS.cafecito || DONATIONS.kofi || DONATIONS.bitcoin || DONATIONS.usdt;

  return (
    <div className="about">
      {/* Quién armó la página */}
      <section className="about-card">
        <div className="about-head">
          <span className="about-avatar">⚽</span>
          <div>
            <h2 className="about-name">Creado por {AUTHOR.name}</h2>
            <p className="about-tagline">{AUTHOR.tagline}</p>
          </div>
        </div>

        <div className="about-links">
          {LINKS.linkedin && (
            <a
              className="about-link"
              href={LINKS.linkedin}
              target="_blank"
              rel="noreferrer"
            >
              💼 LinkedIn
            </a>
          )}
          {LINKS.github && (
            <a
              className="about-link"
              href={LINKS.github}
              target="_blank"
              rel="noreferrer"
            >
              💻 GitHub
            </a>
          )}
        </div>
      </section>

      {/* Donaciones */}
      {hasDonations && (
        <section className="about-card">
          <h3 className="about-subtitle">Donaciones</h3>
          <p className="about-note">
            ¡Apoyá el proyecto! Es gratis y sin publicidad. Si te gustó, podés
            invitarme algo:
          </p>

          <div className="donate-grid">
            {DONATIONS.cafecito && (
              <a
                className="donate-btn donate-cafecito"
                href={DONATIONS.cafecito}
                target="_blank"
                rel="noreferrer"
              >
                ☕ Cafecito
              </a>
            )}
            {DONATIONS.kofi && (
              <a
                className="donate-btn donate-kofi"
                href={DONATIONS.kofi}
                target="_blank"
                rel="noreferrer"
              >
                🧡 Ko-fi
              </a>
            )}
          </div>

          <div className="crypto-section">
            <h4 className="crypto-title">Cripto</h4>
            <div className="crypto-list">
              <CryptoRow label="₿ Bitcoin" address={DONATIONS.bitcoin} />
              <CryptoRow
                label="₮ USDT"
                address={DONATIONS.usdt}
                note="Redes aceptadas: BSC (BEP-20) y Polygon. Enviá USDT solo por estas redes (no por Ethereum)."
              />
            </div>
          </div>
        </section>
      )}

      {/* Formulario de contacto (solo si hay access key configurada) */}
      <ContactForm />
    </div>
  );
}
