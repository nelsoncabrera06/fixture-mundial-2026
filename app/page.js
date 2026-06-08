"use client";

import { useEffect, useState } from "react";
import TimezonePicker from "../components/TimezonePicker";
import GroupStage from "../components/GroupStage";
import Knockout from "../components/Knockout";
import NextMatch from "../components/NextMatch";
import MyTeam from "../components/MyTeam";
import Favorites from "../components/Favorites";
import MyAccount from "../components/MyAccount";
import Admin from "../components/Admin";
import { useAuth } from "../components/AuthContext";
import { DEFAULT_TZ } from "../lib/timezone";


const TZ_STORAGE_KEY = "fixture2026.tz";

export default function Home() {
  const { user, updatePrefs } = useAuth();
  const [tab, setTab] = useState("grupos");
  const [tz, setTz] = useState(DEFAULT_TZ);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    { id: "grupos", label: "Fase de grupos", icon: "🏟️" },
    { id: "playoff", label: "Playoffs", icon: "🏆" },
    { id: "siguiente", label: "Siguiente partido", icon: "⏭️" },
    { id: "miequipo", label: "Mi equipo", icon: "⭐" },
    { id: "favoritos", label: "Favoritos", icon: "❤️" },
    {
      id: "cuenta",
      label: user ? "Mi cuenta" : "Login",
      icon: "👤",
    },
  ];
  // La sección Admin solo aparece para usuarios con rol admin.
  if (user?.role === "admin") {
    sections.push({ id: "admin", label: "Admin", icon: "🛡️" });
  }

  return (
    <div className={`layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">⚽</span>
          <div>
            <div className="brand-title">Mundial 2026</div>
            <div className="brand-sub">Canadá · México · EE.UU.</div>
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
        <button
          className="sidebar-hide"
          onClick={() => setSidebarOpen(false)}
          aria-label="Ocultar menú"
          title="Ocultar menú"
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
                aria-label="Mostrar menú"
                title="Mostrar menú"
              >
                ☰
              </button>
            )}
            <header className="header">
              <h1>{sections.find((s) => s.id === tab)?.label}</h1>
              <div className="sub">Del 11 de junio al 19 de julio de 2026</div>
            </header>
          </div>

          {tab === "siguiente" && <NextMatch tz={tz} />}
          {tab === "grupos" && <GroupStage tz={tz} />}
          {tab === "playoff" && <Knockout tz={tz} />}
          {tab === "miequipo" && <MyTeam tz={tz} />}
          {tab === "favoritos" && <Favorites tz={tz} />}
          {tab === "cuenta" && <MyAccount myTeam={myTeam} tz={tz} onTzChange={changeTz} />}
          {tab === "admin" && <Admin />}

          <footer className="footer">
            Horarios orientativos convertidos a tu zona horaria. Equipos y grupos
            confirmados; fechas, sedes y horarios pueden ajustarse — verificá en{" "}
            <a href="https://www.fifa.com/es" target="_blank" rel="noreferrer">
              fifa.com
            </a>
            .
          </footer>
        </div>
      </main>
    </div>
  );
}
