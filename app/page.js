"use client";

import { useEffect, useState } from "react";
import TimezonePicker from "../components/TimezonePicker";
import GroupStage from "../components/GroupStage";
import Knockout from "../components/Knockout";
import Groups from "../components/Groups";
import Calendar from "../components/Calendar";
import NextMatch from "../components/NextMatch";
import MatchView from "../components/MatchView";
import About from "../components/About";
import MyTeam from "../components/MyTeam";
import Favorites from "../components/Favorites";
import MyAccount from "../components/MyAccount";
import Admin from "../components/Admin";
import LanguagePicker from "../components/LanguagePicker";
import { useAuth } from "../components/AuthContext";
import { useLang } from "../components/LanguageContext";
import { MatchNavContext } from "../components/MatchNavContext";
import { DEFAULT_TZ } from "../lib/timezone";


const TZ_STORAGE_KEY = "fixture2026.tz";

export default function Home() {
  const { user, updatePrefs } = useAuth();
  const { t } = useLang();
  const [tab, setTab] = useState("grupos");
  const [tz, setTz] = useState(DEFAULT_TZ);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Grupo activo en la pestaña "Grupos" (también lo setea el link desde
  // "Fase de grupos" al tocar un grupo).
  const [groupFocus, setGroupFocus] = useState("A");
  // Partido elegido para la vista "Partido" (lo setea el selector de esa vista
  // o un click en cualquier tarjeta de partido vía MatchNavContext).
  const [selectedMatch, setSelectedMatch] = useState(null);

  const openGroup = (g) => {
    setGroupFocus(g);
    setTab("detalle");
  };

  // Abre el detalle de un partido desde cualquier tarjeta de la app.
  const openMatch = (m) => {
    setSelectedMatch(m);
    setTab("partido");
  };

  // El equipo mostrado en "Mi cuenta" sale del registro del usuario.
  const myTeam = user?.team || "Argentina";

  // Solo en cliente (evita desajuste de hidratación): si hay una zona guardada
  // se respeta; si no, se usa "auto" para mostrarle al visitante nuevo la hora
  // de su propio dispositivo en vez del default de Helsinki.
  useEffect(() => {
    const saved = window.localStorage.getItem(TZ_STORAGE_KEY);
    setTz(saved || "auto");
  }, []);

  // Con sesión activa, la zona horaria guardada del usuario tiene prioridad.
  useEffect(() => {
    if (user?.timezone) setTz(user.timezone);
  }, [user]);

  // Si el usuario deja de ser admin (logout) estando en la pestaña Admin, salir.
  useEffect(() => {
    if (tab === "admin" && user?.role !== "admin") setTab("grupos");
  }, [tab, user]);

  const changeTz = (value) => {
    setTz(value);
    window.localStorage.setItem(TZ_STORAGE_KEY, value);
    if (user) updatePrefs({ timezone: value });
  };

  // Secciones de la barra lateral. Agregá más ítems acá a futuro.
  const sections = [
    { id: "grupos", label: t("nav.grupos"), icon: "🏟️" },
    { id: "playoff", label: t("nav.playoff"), icon: "🏆" },
    { id: "detalle", label: t("nav.detalle"), icon: "📊" },
    { id: "calendario", label: t("nav.calendario"), icon: "📅" },
    { id: "partido", label: t("nav.partido"), icon: "🆚" },
    { id: "siguiente", label: t("nav.siguiente"), icon: "⏭️" },
    { id: "miequipo", label: t("nav.miequipo"), icon: "⭐" },
    { id: "favoritos", label: t("nav.favoritos"), icon: "❤️" },
    {
      id: "cuenta",
      label: user ? t("nav.cuenta") : t("nav.login"),
      icon: "👤",
    },
    { id: "sobre", label: t("nav.sobre"), icon: "✉️" },
  ];
  // La sección Admin solo aparece para usuarios con rol admin.
  if (user?.role === "admin") {
    sections.push({ id: "admin", label: t("nav.admin"), icon: "🛡️" });
  }

  return (
    <MatchNavContext.Provider value={openMatch}>
    <div className={`layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">⚽</span>
          <div>
            <div className="brand-title">{t("brand.title")}</div>
            <div className="brand-sub">{t("brand.sub")}</div>
          </div>
        </div>
        <nav className="nav">
          {sections.map((s) => (
            <button
              key={s.id}
              className={`nav-item ${tab === s.id ? "active" : ""}`}
              onClick={() => setTab(s.id)}
            >
              <span className="nav-icon">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>
        <LanguagePicker />
        <button
          className="sidebar-hide"
          onClick={() => setSidebarOpen(false)}
          aria-label={t("sidebar.hide")}
          title={t("sidebar.hide")}
        >
          <span className="sidebar-hide-arrow">←</span>
        </button>
      </aside>

      <main className="main">
        <div className={`main-inner ${tab === "playoff" ? "main-inner--wide" : ""}`}>
          <div className="topbar">
            {!sidebarOpen && (
              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(true)}
                aria-label={t("sidebar.show")}
                title={t("sidebar.show")}
              >
                ☰
              </button>
            )}
            <header className="header">
              <h1>{sections.find((s) => s.id === tab)?.label}</h1>
              {tab !== "sobre" && (
                <div className="sub">{t("header.dates")}</div>
              )}
            </header>
          </div>

          {tab === "siguiente" && <NextMatch tz={tz} />}
          {tab === "grupos" && <GroupStage tz={tz} onOpenGroup={openGroup} />}
          {tab === "partido" && (
            <MatchView
              tz={tz}
              match={selectedMatch}
              onSelect={setSelectedMatch}
              onClear={() => setSelectedMatch(null)}
            />
          )}
          {tab === "playoff" && <Knockout tz={tz} />}
          {tab === "detalle" && (
            <Groups tz={tz} group={groupFocus} onSelectGroup={setGroupFocus} />
          )}
          {tab === "calendario" && <Calendar tz={tz} />}
          {tab === "miequipo" && <MyTeam tz={tz} />}
          {tab === "favoritos" && <Favorites tz={tz} />}
          {tab === "sobre" && <About />}
          {tab === "cuenta" && <MyAccount myTeam={myTeam} tz={tz} onTzChange={changeTz} />}
          {tab === "admin" && <Admin />}

          <footer className="footer">
            {t("footer.pre")}
            <a href="https://www.fifa.com/es" target="_blank" rel="noreferrer">
              fifa.com
            </a>
            {t("footer.post")}
          </footer>
        </div>
      </main>
    </div>
    </MatchNavContext.Provider>
  );
}
