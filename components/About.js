"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AUTHOR, LINKS, DONATIONS, CONTACT } from "../lib/about";
import { useLang } from "./LanguageContext";
import ContactForm from "./ContactForm";

// Fila de cripto con copiar + ver QR + "ya envié". Si no hay dirección, "Próximamente".
// qrPrefix: esquema para el QR (ej. "lightning:" para Lightning Address). El
// texto que se copia es siempre la dirección pelada; el prefijo es solo del QR.
function CryptoRow({ label, address, note, qrPrefix = "" }) {
  const { t } = useLang();
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
        {!address && <span className="crypto-soon">{t("crypto.soon")}</span>}
      </div>
      {address && (
        <>
          <div className="crypto-addr-row">
            <code className="crypto-addr">{address}</code>
            <button type="button" className="copy-btn" onClick={copy}>
              {copied ? t("crypto.copied") : t("crypto.copy")}
            </button>
            <button
              type="button"
              className="qr-btn"
              onClick={() => setShowQR((v) => !v)}
              aria-expanded={showQR}
            >
              {showQR ? t("crypto.hideQR") : t("crypto.showQR")}
            </button>
          </div>
          {showQR && (
            <div className="crypto-qr">
              <QRCodeSVG value={qrPrefix + address} size={168} marginSize={2} />
              <span className="crypto-qr-hint">{t("crypto.scan")}</span>
            </div>
          )}
          {note && <p className="crypto-note">{note}</p>}

          {sent ? (
            <p className="crypto-thanks">{t("crypto.thanks")}</p>
          ) : (
            <button type="button" className="sent-btn" onClick={markSent}>
              {t("crypto.sent")}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function About() {
  const { t } = useLang();
  const hasDonations =
    DONATIONS.cafecito || DONATIONS.kofi || DONATIONS.bitcoin || DONATIONS.usdt;

  return (
    <div className="about">
      {/* Quién armó la página */}
      <section className="about-card">
        <div className="about-head">
          <span className="about-avatar">⚽</span>
          <div>
            <h2 className="about-name">{t("about.createdBy", { name: AUTHOR.name })}</h2>
            <p className="about-tagline">{t("about.tagline")}</p>
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
          <h3 className="about-subtitle">{t("about.donations")}</h3>
          <p className="about-note">{t("about.donateNote")}</p>

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
            <h4 className="crypto-title">{t("about.crypto")}</h4>
            <div className="crypto-list">
              <CryptoRow
                label="⚡ Bitcoin (Lightning)"
                address={DONATIONS.lightning}
                qrPrefix="lightning:"
                note={t("crypto.note.lightning")}
              />
              <CryptoRow
                label="₿ Bitcoin (on-chain)"
                address={DONATIONS.bitcoin}
                qrPrefix="bitcoin:"
                note={t("crypto.note.onchain")}
              />
              <CryptoRow
                label="₮ USDT"
                address={DONATIONS.usdt}
                note={t("crypto.note.usdt")}
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
