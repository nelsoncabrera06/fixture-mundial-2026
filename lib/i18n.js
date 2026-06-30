// ---------------------------------------------------------------------------
// i18n — Español / Inglés / Portugués.
//
// La app es 100% estática y en cliente, así que el idioma vive en un contexto
// (ver components/LanguageContext.js) y acá viven los datos puros: el
// diccionario de textos de UI (DICT), la traducción de nombres de selecciones
// (TEAM_NAMES), de rondas (ROUNDS_I18N) y el helper t().
//
// El ESPAÑOL es el idioma fuente: las claves de equipos y los nombres de ronda
// se guardan en español en lib/matches.js / lib/knockout.js, y acá se traducen
// a en/pt. Si falta una traducción, se cae a inglés y luego al texto original.
// ---------------------------------------------------------------------------

export const LANGS = ["es", "en", "pt"];
export const DEFAULT_LANG = "es"; // idioma del render inicial (coincide con el SSR)

export const LANG_LABELS = {
  es: "Español",
  en: "English",
  pt: "Português",
};

// Detecta el idioma a partir del navegador (navigator.language / .languages).
// es→es, en→en, pt→pt; cualquier otra cosa → inglés (default seguro).
export function detectLang() {
  if (typeof navigator === "undefined") return "en";
  const candidates = [
    ...(navigator.languages || []),
    navigator.language,
  ].filter(Boolean);
  for (const c of candidates) {
    const two = c.slice(0, 2).toLowerCase();
    if (two === "es" || two === "en" || two === "pt") return two;
  }
  return "en";
}

// Locale BCP-47 para las API Intl (fechas/horas).
export function langToLocale(lang) {
  return { es: "es-ES", en: "en-US", pt: "pt-BR" }[lang] || "es-ES";
}

// ── Selecciones (claves en español = valores en lib/matches.js) ─────────────
export const TEAM_NAMES = {
  "México": { en: "Mexico", pt: "México" },
  "Sudáfrica": { en: "South Africa", pt: "África do Sul" },
  "Corea del Sur": { en: "South Korea", pt: "Coreia do Sul" },
  "República Checa": { en: "Czechia", pt: "República Tcheca" },
  "Canadá": { en: "Canada", pt: "Canadá" },
  "Bosnia y Herzegovina": { en: "Bosnia & Herzegovina", pt: "Bósnia e Herzegovina" },
  "Catar": { en: "Qatar", pt: "Catar" },
  "Suiza": { en: "Switzerland", pt: "Suíça" },
  "Brasil": { en: "Brazil", pt: "Brasil" },
  "Marruecos": { en: "Morocco", pt: "Marrocos" },
  "Haití": { en: "Haiti", pt: "Haiti" },
  "Escocia": { en: "Scotland", pt: "Escócia" },
  "Estados Unidos": { en: "United States", pt: "Estados Unidos" },
  "Paraguay": { en: "Paraguay", pt: "Paraguai" },
  "Australia": { en: "Australia", pt: "Austrália" },
  "Turquía": { en: "Türkiye", pt: "Turquia" },
  "Alemania": { en: "Germany", pt: "Alemanha" },
  "Curazao": { en: "Curaçao", pt: "Curaçao" },
  "Costa de Marfil": { en: "Ivory Coast", pt: "Costa do Marfim" },
  "Ecuador": { en: "Ecuador", pt: "Equador" },
  "Países Bajos": { en: "Netherlands", pt: "Países Baixos" },
  "Japón": { en: "Japan", pt: "Japão" },
  "Suecia": { en: "Sweden", pt: "Suécia" },
  "Túnez": { en: "Tunisia", pt: "Tunísia" },
  "Bélgica": { en: "Belgium", pt: "Bélgica" },
  "Egipto": { en: "Egypt", pt: "Egito" },
  "Irán": { en: "Iran", pt: "Irã" },
  "Nueva Zelanda": { en: "New Zealand", pt: "Nova Zelândia" },
  "España": { en: "Spain", pt: "Espanha" },
  "Cabo Verde": { en: "Cape Verde", pt: "Cabo Verde" },
  "Arabia Saudita": { en: "Saudi Arabia", pt: "Arábia Saudita" },
  "Uruguay": { en: "Uruguay", pt: "Uruguai" },
  "Francia": { en: "France", pt: "França" },
  "Senegal": { en: "Senegal", pt: "Senegal" },
  "Irak": { en: "Iraq", pt: "Iraque" },
  "Noruega": { en: "Norway", pt: "Noruega" },
  "Argentina": { en: "Argentina", pt: "Argentina" },
  "Argelia": { en: "Algeria", pt: "Argélia" },
  "Austria": { en: "Austria", pt: "Áustria" },
  "Jordania": { en: "Jordan", pt: "Jordânia" },
  "Portugal": { en: "Portugal", pt: "Portugal" },
  "RD del Congo": { en: "DR Congo", pt: "RD Congo" },
  "Uzbekistán": { en: "Uzbekistan", pt: "Uzbequistão" },
  "Colombia": { en: "Colombia", pt: "Colômbia" },
  "Inglaterra": { en: "England", pt: "Inglaterra" },
  "Croacia": { en: "Croatia", pt: "Croácia" },
  "Ghana": { en: "Ghana", pt: "Gana" },
  "Panamá": { en: "Panama", pt: "Panamá" },
};

function ordinalEn(n) {
  return n === "1" ? "1st" : n === "2" ? "2nd" : n === "3" ? "3rd" : `${n}th`;
}

// Traduce un "slot" de equipo: puede ser una selección real ("Brasil") o un
// placeholder de eliminatorias ("1.º Grupo A", "Ganador 89", "3.º C/E/F/H/I",
// "Perdedor 101", "Por definir") o una combinación "X · Y". En español devuelve
// el texto tal cual (es el idioma fuente de los datos).
export function teamName(slot, lang) {
  if (!slot || lang === "es") return slot;

  // Combinación de dos posibles rivales ("Brasil · Marruecos").
  if (slot.includes(" · ")) {
    return slot
      .split(" · ")
      .map((s) => teamName(s.trim(), lang))
      .join(" · ");
  }

  // Selección real.
  if (TEAM_NAMES[slot]) return TEAM_NAMES[slot][lang] || slot;

  // Placeholders de cruces.
  let m;
  if ((m = /^([12])\.º Grupo ([A-L])$/.exec(slot))) {
    return lang === "pt"
      ? `${m[1]}.º Grupo ${m[2]}`
      : `${ordinalEn(m[1])} Group ${m[2]}`;
  }
  if ((m = /^3\.º (.+)$/.exec(slot))) {
    return lang === "pt" ? `3.º ${m[1]}` : `3rd ${m[1]}`;
  }
  if ((m = /^Ganador (\d+)$/.exec(slot))) {
    return lang === "pt" ? `Vencedor ${m[1]}` : `Winner ${m[1]}`;
  }
  if ((m = /^Perdedor (\d+)$/.exec(slot))) {
    return lang === "pt" ? `Perdedor ${m[1]}` : `Loser ${m[1]}`;
  }
  if (slot === "Por definir") {
    return lang === "pt" ? "A definir" : "TBD";
  }
  return slot;
}

// ── Rondas (clave = nombre español en lib/knockout.js) ──────────────────────
export const ROUNDS_I18N = {
  "Ronda de 32": {
    full: { es: "Ronda de 32", en: "Round of 32", pt: "Rodada de 32" },
    short: { es: "Ronda de 32", en: "Round of 32", pt: "Rodada de 32" },
  },
  "Octavos de final": {
    full: { es: "Octavos de final", en: "Round of 16", pt: "Oitavas de final" },
    short: { es: "Octavos", en: "Round of 16", pt: "Oitavas" },
  },
  "Cuartos de final": {
    full: { es: "Cuartos de final", en: "Quarter-finals", pt: "Quartas de final" },
    short: { es: "Cuartos", en: "Quarters", pt: "Quartas" },
  },
  Semifinales: {
    full: { es: "Semifinales", en: "Semi-finals", pt: "Semifinais" },
    short: { es: "Semifinal", en: "Semis", pt: "Semis" },
  },
  "Tercer puesto": {
    full: { es: "Tercer puesto", en: "Third place", pt: "Terceiro lugar" },
    short: { es: "3.º puesto", en: "3rd place", pt: "3.º lugar" },
  },
  Final: {
    full: { es: "Final", en: "Final", pt: "Final" },
    short: { es: "Final", en: "Final", pt: "Final" },
  },
};

export function roundName(esName, lang) {
  return ROUNDS_I18N[esName]?.full[lang] || esName;
}
export function roundShort(esName, lang) {
  return ROUNDS_I18N[esName]?.short[lang] || esName;
}

// ── Diccionario de textos de UI ─────────────────────────────────────────────
export const DICT = {
  es: {
    "nav.grupos": "Fase de grupos",
    "nav.partido": "Partido",
    "nav.playoff": "Playoffs",
    "nav.detalle": "Grupos",
    "nav.calendario": "Calendario",
    "nav.siguiente": "Siguiente partido",
    "nav.miequipo": "Mi equipo",
    "nav.favoritos": "Favoritos",
    "nav.cuenta": "Mi cuenta",
    "nav.login": "Login",
    "nav.sobre": "Contacto",
    "nav.admin": "Admin",
    "brand.title": "Mundial 2026",
    "brand.sub": "Canadá · México · EE.UU.",
    "sidebar.hide": "Ocultar menú",
    "sidebar.show": "Mostrar menú",
    "header.dates": "Del 11 de junio al 19 de julio de 2026",
    "footer.pre":
      "Horarios orientativos convertidos a tu zona horaria. Equipos y grupos confirmados; fechas, sedes y horarios pueden ajustarse — verificá en ",
    "footer.post": ".",

    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.signin": "Iniciar sesión",
    "vs": "vs",
    "live.now": "EN VIVO",
    "live.ht": "ENTRETIEMPO",
    "live.ft": "Finalizado",
    "live.susp": "SUSPENDIDO",
    "live.postp": "APLAZADO",
    "live.canc": "CANCELADO",
    "live.pen": "Pen",

    "account.locked.title": "Iniciá sesión o registrate",
    "account.locked.sub": "Accedé a tu cuenta para gestionar tu perfil.",
    "account.locked.cta": "Iniciar sesión o registrarse",
    "account.user": "👤 Usuario",
    "account.email": "📧 Email",
    "account.myteam": "⭐ Mi equipo",
    "account.timezone": "🕒 Zona horaria",
    "account.language": "🌐 Idioma",
    "tzbubble.text":
      "¿Tu zona horaria es correcta? Tenés configurada {stored}, pero tu dispositivo parece estar en {detected}.",
    "tzbubble.cta": "Cambiar en Mi cuenta",
    "tzbubble.dismiss": "Cerrar",
    "nav.simulaciones": "Simulaciones",
    "sim.bubble.label": "Modo simulación",
    "sim.bubble.manage": "Gestionar",
    "sim.bubble.exit": "Salir",
    "sim.scenario": "Escenario",
    "sim.intro":
      "Elegí un escenario, activalo y simulá resultados de los partidos que faltan jugar. La tabla de posiciones y los cruces se recalculan solos. Nunca se tocan los resultados reales.",
    "sim.login": "Iniciá sesión para crear y guardar tus simulaciones.",
    "sim.login.cta": "Ir a Mi cuenta",
    "sim.card.empty": "Sin partidos simulados",
    "sim.card.matches": "{n} partido(s) simulado(s)",
    "sim.card.active": "Activo",
    "sim.card.simulate": "Simular partidos",
    "sim.activate": "Activar",
    "sim.deactivate": "Desactivar",
    "sim.reset": "Resetear",
    "sim.reset.confirm":
      "¿Borrar todos los resultados simulados de este escenario?",
    "sim.badge": "Simulado",
    "sim.edit.title": "Simular resultado",
    "sim.edit.hint":
      "Ajustá el marcador y guardá. Solo se pueden simular partidos no jugados.",
    "sim.edit.save": "Guardar simulación",
    "sim.edit.clear": "Quitar simulación",
    "account.pwd.change": "🔑 Cambiar contraseña",
    "account.pwd.current": "Contraseña actual",
    "account.pwd.new": "Nueva contraseña",
    "account.pwd.updated": "Contraseña actualizada.",
    "account.logout": "🚪 Cerrar sesión",
    "account.delete": "🗑️ Eliminar cuenta",
    "account.delete.warnPre":
      "Esta acción es irreversible. Para confirmar, escribí tu usuario ",
    "account.delete.nameMismatch": "El nombre no coincide.",
    "account.delete.confirm": "Eliminar definitivamente",

    "auth.login": "Iniciar sesión",
    "auth.register": "Crear cuenta",
    "auth.tab.login": "Ingresar",
    "auth.tab.register": "Registrarse",
    "auth.username": "Usuario",
    "auth.email": "Email",
    "auth.password": "Contraseña",
    "auth.confirm": "Confirmar contraseña",
    "auth.pwdMismatch": "Las contraseñas no coinciden.",
    "auth.processing": "Procesando…",
    "auth.or": "o",
    "auth.google": "Continuar con Google",
    "auth.close": "Cerrar",

    "group.badge": "Grupo {g}",
    "group.seeTable": "Ver tabla →",
    "group.seeDetailTitle": "Ver tabla y detalle del Grupo {g}",

    "match.pick.sub": "Elegí una instancia y un partido para ver su detalle. También podés tocar cualquier partido en el resto de la app.",
    "match.pick.instance": "Instancia",
    "match.pick.group": "Grupo",
    "match.pick.match": "Partido",
    "match.stage.groups": "Fase de grupos",
    "match.back": "← Elegir otro partido",
    "match.scheduled": "Programado",
    "match.standings.title": "Tabla de posiciones",
    "match.proj.tentative": "tentativo",
    "match.proj.confirmed": "confirmado",
    "standings.team": "Equipo",
    "st.pj": "PJ",
    "st.pg": "PG",
    "st.pe": "PE",
    "st.pp": "PP",
    "st.gf": "GF",
    "st.gc": "GC",
    "st.dg": "DG",
    "st.pts": "Pts",
    "st.pj.t": "Partidos jugados",
    "st.pg.t": "Ganados",
    "st.pe.t": "Empatados",
    "st.pp.t": "Perdidos",
    "st.gf.t": "Goles a favor",
    "st.gc.t": "Goles en contra",
    "st.dg.t": "Diferencia de gol",
    "st.pts.t": "Puntos",
    "groups.noMatches":
      "Todavía no se jugaron partidos de este grupo: la tabla arranca en cero y se va actualizando con cada resultado.",
    "groups.matches": "Partidos",

    "ko.intro":
      "Avanzan los 2 primeros de cada grupo más los 8 mejores terceros (32 equipos). Los cruces se definen al terminar la fase de grupos.",
    "ko.swipeHint": "Deslizá para ver las siguientes rondas →",
    "ko.projLead": "Cruces de Ronda de 32 según la tabla actual:",
    "ko.projTentative": "Tentativos (faltan partidos del grupo)",
    "ko.projConfirmed": "Confirmados (grupo finalizado)",

    "cal.prevWeek": "Semana anterior",
    "cal.nextWeek": "Semana siguiente",
    "cal.today": "Hoy",
    "cal.week": "Semana {n}",
    "cal.intro":
      "Todos los partidos del torneo, semana por semana. Los horarios están en tu zona horaria.",
    "cal.match.one": "partido",
    "cal.match.other": "partidos",
    "cal.dayNames": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],

    "nm.count.days": "Faltan {d} d {h} h",
    "nm.count.hours": "Faltan {h} h {m} min",
    "nm.count.mins": "Faltan {m} min",
    "nm.ended.title": "El Mundial terminó",
    "nm.ended.sub": "No quedan más partidos por jugarse. ¡Gracias por seguirlo!",
    "nm.live": "En juego ahora",
    "nm.inaugural": "🎉 Partido inaugural",
    "nm.next": "⏭️ Siguiente partido",
    "nm.simul": "🔥 {n} partidos en simultáneo",

    "myteam.locked.title": "Iniciá sesión para ver tu equipo",
    "myteam.locked.sub": "Elegí tu selección favorita y seguí todos sus partidos.",
    "myteam.change": "Cambiar equipo",
    "myteam.pick": "Elegí tu equipo:",
    "myteam.noMatches": "No hay partidos para este equipo.",
    "tab.groupstage": "🏟️ Fase de grupos",
    "tab.playoffs": "🏆 Playoffs",

    "fav.locked.title": "Iniciá sesión para ver tus favoritos",
    "fav.locked.sub": "Armá tu lista de equipos y seguí todos sus partidos.",
    "fav.title": "Favoritos",
    "fav.edit": "Editar lista",
    "fav.done": "Listo",
    "fav.pick": "Marcá los equipos que querés seguir:",
    "fav.empty": 'Todavía no agregaste favoritos. Tocá "Editar lista" para empezar.',
    "fav.saveError": "No se pudo guardar el favorito.",

    "path.noPath": "No se pudo trazar el camino para este equipo.",
    "path.first": "🥇 Clasifica 1.° del Grupo {g}",
    "path.second": "🥈 Clasifica 2.° del Grupo {g}",
    "path.vs": " vs ",
    "path.tbd": "A definir",
    "path.outcome.first": "🥇 Clasificado 1.° del Grupo {g}",
    "path.outcome.second": "🥈 Clasificado 2.° del Grupo {g}",
    "path.outcome.third": "🥉 Clasificado como mejor 3.° (Grupo {g})",
    "path.outcome.groups": "❌ Eliminado del Mundial en fase de grupos",
    "path.ko.out": "❌ Eliminado en {round}",
    "path.ko.runnerup": "🥈 Subcampeón del Mundo",
    "path.ko.champion": "🏆 ¡Campeón del Mundo!",
    "path.ko.thirdplace": "🥉 Tercer puesto",
    "path.ko.fourthplace": "Cuarto puesto",
    "path.ko.playingThird": "Disputa el 3.° puesto",
    "path.qual.first": "Clasificó 1.° del Grupo {g}",
    "path.qual.second": "Clasificó 2.° del Grupo {g}",
    "path.qual.third": "Clasificó como mejor 3.° (Grupo {g})",
    "path.route": "Camino en la eliminatoria",

    "about.createdBy": "Creado por {name}",
    "about.tagline":
      "Argentino en Finlandia, hincha del fútbol y del código. Armé este fixture del Mundial 2026 en mis ratos libres, para tener un fixture limpio, organizado y de la manera que a mí me gustaría verlo. Si te sirvió y querés hacer una donación al proyecto, ¡te lo agradecería muchísimo!",
    "about.donations": "Donaciones",
    "about.donateNote":
      "¡Apoyá el proyecto! Es gratis y sin publicidad. Si te gustó, podés invitarme algo:",
    "about.crypto": "Cripto",
    "crypto.soon": "Próximamente",
    "crypto.copy": "Copiar",
    "crypto.copied": "✓ Copiado",
    "crypto.showQR": "Ver QR",
    "crypto.hideQR": "Ocultar QR",
    "crypto.scan": "Escaneá con tu wallet",
    "crypto.thanks": "💚 ¡Muchas gracias por tu donación! 🙌",
    "crypto.sent": "Ya envié mi donación",
    "crypto.note.lightning":
      "Pagá con cualquier wallet Lightning — al instante y con fees mínimos. Ideal para propinas.",
    "crypto.note.onchain":
      "Red Bitcoin tradicional. Mejor para montos grandes (los fees no convienen para donaciones chicas).",
    "crypto.note.usdt":
      "Redes aceptadas: BSC (BEP-20) y Polygon. Enviá USDT solo por estas redes (no por Ethereum).",

    "contact.locked.title": "Iniciá sesión para escribirme",
    "contact.locked.sub": "Así sé quién me escribe — nada de mensajes anónimos.",
    "contact.title": "✉️ Escribime",
    "contact.sub": "¿Una sugerencia, un saludo o encontraste un bug? Contame:",
    "contact.asPre": "Escribís como ",
    "contact.message": "Mensaje",
    "contact.send": "Enviar mensaje",
    "contact.sending": "Enviando…",
    "contact.error":
      "Uy, no se pudo enviar. Probá de nuevo o escribime por LinkedIn.",
    "contact.done.title": "¡Gracias por escribir!",
    "contact.done.sub": "Tu mensaje llegó. Te respondo apenas pueda.",
    "contact.done.again": "Enviar otro",

    "atc.add": "Agregar al calendario",
    "atc.apple": "Apple u otro (.ics)",
    "event.worldcup": "Mundial 2026",

    "admin.restricted.title": "Acceso restringido",
    "admin.restricted.sub": "Solo los administradores pueden ver esta sección.",
    "admin.users": "👥 Usuarios",
    "admin.userCount.one": "usuario registrado",
    "admin.userCount.other": "usuarios registrados",
    "admin.col.user": "Usuario",
    "admin.col.email": "Email",
    "admin.col.team": "Equipo",
    "admin.col.tz": "Zona horaria",
    "admin.col.actions": "Acciones",
    "admin.edit": "✏️ Editar",
    "admin.deleteTitle": "Eliminar usuario",
    "admin.empty": "No hay usuarios registrados.",
    "admin.loading": "Cargando usuarios…",
    "admin.confirmDelete":
      '¿Eliminar al usuario "{name}"? Esta acción no se puede deshacer.',
  },

  en: {
    "nav.grupos": "Group stage",
    "nav.partido": "Match",
    "nav.playoff": "Knockouts",
    "nav.detalle": "Groups",
    "nav.calendario": "Calendar",
    "nav.siguiente": "Next match",
    "nav.miequipo": "My team",
    "nav.favoritos": "Favorites",
    "nav.cuenta": "My account",
    "nav.login": "Login",
    "nav.sobre": "Contact",
    "nav.admin": "Admin",
    "brand.title": "World Cup 2026",
    "brand.sub": "Canada · Mexico · USA",
    "sidebar.hide": "Hide menu",
    "sidebar.show": "Show menu",
    "header.dates": "From June 11 to July 19, 2026",
    "footer.pre":
      "Indicative kickoff times converted to your timezone. Teams and groups confirmed; dates, venues and times may change — check ",
    "footer.post": ".",

    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.signin": "Sign in",
    "vs": "vs",
    "live.now": "LIVE",
    "live.ht": "HALF-TIME",
    "live.ft": "Full time",
    "live.susp": "SUSPENDED",
    "live.postp": "POSTPONED",
    "live.canc": "CANCELLED",
    "live.pen": "Pen",

    "account.locked.title": "Sign in or register",
    "account.locked.sub": "Access your account to manage your profile.",
    "account.locked.cta": "Sign in or register",
    "account.user": "👤 Username",
    "account.email": "📧 Email",
    "account.myteam": "⭐ My team",
    "account.timezone": "🕒 Timezone",
    "account.language": "🌐 Language",
    "tzbubble.text":
      "Is your timezone correct? You have {stored} set, but your device seems to be in {detected}.",
    "tzbubble.cta": "Change in My account",
    "tzbubble.dismiss": "Dismiss",
    "nav.simulaciones": "Simulations",
    "sim.bubble.label": "Simulation mode",
    "sim.bubble.manage": "Manage",
    "sim.bubble.exit": "Exit",
    "sim.scenario": "Scenario",
    "sim.intro":
      "Pick a scenario, activate it and simulate results for matches not played yet. The standings and the bracket recompute on their own. Real results are never touched.",
    "sim.login": "Sign in to create and save your simulations.",
    "sim.login.cta": "Go to My account",
    "sim.card.empty": "No simulated matches",
    "sim.card.matches": "{n} simulated match(es)",
    "sim.card.active": "Active",
    "sim.card.simulate": "Simulate matches",
    "sim.activate": "Activate",
    "sim.deactivate": "Deactivate",
    "sim.reset": "Reset",
    "sim.reset.confirm": "Delete all simulated results in this scenario?",
    "sim.badge": "Simulated",
    "sim.edit.title": "Simulate result",
    "sim.edit.hint":
      "Adjust the score and save. Only matches not played yet can be simulated.",
    "sim.edit.save": "Save simulation",
    "sim.edit.clear": "Remove simulation",
    "account.pwd.change": "🔑 Change password",
    "account.pwd.current": "Current password",
    "account.pwd.new": "New password",
    "account.pwd.updated": "Password updated.",
    "account.logout": "🚪 Sign out",
    "account.delete": "🗑️ Delete account",
    "account.delete.warnPre":
      "This action is irreversible. To confirm, type your username ",
    "account.delete.nameMismatch": "The name doesn't match.",
    "account.delete.confirm": "Delete permanently",

    "auth.login": "Sign in",
    "auth.register": "Create account",
    "auth.tab.login": "Log in",
    "auth.tab.register": "Register",
    "auth.username": "Username",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirm": "Confirm password",
    "auth.pwdMismatch": "Passwords don't match.",
    "auth.processing": "Processing…",
    "auth.or": "or",
    "auth.google": "Continue with Google",
    "auth.close": "Close",

    "group.badge": "Group {g}",
    "group.seeTable": "View table →",
    "group.seeDetailTitle": "View table and details of Group {g}",

    "match.pick.sub": "Pick a stage and a match to see its details. You can also tap any match elsewhere in the app.",
    "match.pick.instance": "Stage",
    "match.pick.group": "Group",
    "match.pick.match": "Match",
    "match.stage.groups": "Group stage",
    "match.back": "← Choose another match",
    "match.scheduled": "Scheduled",
    "match.standings.title": "Standings",
    "match.proj.tentative": "tentative",
    "match.proj.confirmed": "confirmed",
    "standings.team": "Team",
    "st.pj": "MP",
    "st.pg": "W",
    "st.pe": "D",
    "st.pp": "L",
    "st.gf": "GF",
    "st.gc": "GA",
    "st.dg": "GD",
    "st.pts": "Pts",
    "st.pj.t": "Matches played",
    "st.pg.t": "Won",
    "st.pe.t": "Drawn",
    "st.pp.t": "Lost",
    "st.gf.t": "Goals for",
    "st.gc.t": "Goals against",
    "st.dg.t": "Goal difference",
    "st.pts.t": "Points",
    "groups.noMatches":
      "No matches have been played in this group yet: the table starts at zero and updates with each result.",
    "groups.matches": "Matches",

    "ko.intro":
      "The top 2 from each group plus the 8 best third-placed teams advance (32 teams). Matchups are set once the group stage ends.",
    "ko.swipeHint": "Swipe to see the next rounds →",
    "ko.projLead": "Round of 32 matchups based on the current standings:",
    "ko.projTentative": "Tentative (group not finished)",
    "ko.projConfirmed": "Confirmed (group finished)",

    "cal.prevWeek": "Previous week",
    "cal.nextWeek": "Next week",
    "cal.today": "Today",
    "cal.week": "Week {n}",
    "cal.intro":
      "All tournament matches, week by week. Times are shown in your timezone.",
    "cal.match.one": "match",
    "cal.match.other": "matches",
    "cal.dayNames": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],

    "nm.count.days": "{d}d {h}h left",
    "nm.count.hours": "{h}h {m}min left",
    "nm.count.mins": "{m}min left",
    "nm.ended.title": "The World Cup is over",
    "nm.ended.sub": "There are no more matches to play. Thanks for following!",
    "nm.live": "Playing now",
    "nm.inaugural": "🎉 Opening match",
    "nm.next": "⏭️ Next match",
    "nm.simul": "🔥 {n} matches at the same time",

    "myteam.locked.title": "Sign in to see your team",
    "myteam.locked.sub": "Pick your favorite team and follow all its matches.",
    "myteam.change": "Change team",
    "myteam.pick": "Pick your team:",
    "myteam.noMatches": "No matches for this team.",
    "tab.groupstage": "🏟️ Group stage",
    "tab.playoffs": "🏆 Knockouts",

    "fav.locked.title": "Sign in to see your favorites",
    "fav.locked.sub": "Build your list of teams and follow all their matches.",
    "fav.title": "Favorites",
    "fav.edit": "Edit list",
    "fav.done": "Done",
    "fav.pick": "Check the teams you want to follow:",
    "fav.empty": 'You haven\'t added favorites yet. Tap "Edit list" to start.',
    "fav.saveError": "Couldn't save the favorite.",

    "path.noPath": "Couldn't trace the path for this team.",
    "path.first": "🥇 Finishes 1st in Group {g}",
    "path.second": "🥈 Finishes 2nd in Group {g}",
    "path.vs": " vs ",
    "path.tbd": "TBD",
    "path.outcome.first": "🥇 Qualified 1st in Group {g}",
    "path.outcome.second": "🥈 Qualified 2nd in Group {g}",
    "path.outcome.third": "🥉 Qualified as a best 3rd (Group {g})",
    "path.outcome.groups": "❌ Eliminated in the group stage",
    "path.ko.out": "❌ Eliminated in the {round}",
    "path.ko.runnerup": "🥈 Runner-up",
    "path.ko.champion": "🏆 World Champions!",
    "path.ko.thirdplace": "🥉 Third place",
    "path.ko.fourthplace": "Fourth place",
    "path.ko.playingThird": "Playing for 3rd place",
    "path.qual.first": "Finished 1st in Group {g}",
    "path.qual.second": "Finished 2nd in Group {g}",
    "path.qual.third": "Qualified as a best 3rd (Group {g})",
    "path.route": "Knockout route",

    "about.createdBy": "Created by {name}",
    "about.tagline":
      "Argentine living in Finland, a fan of football and code. I built this 2026 World Cup fixture in my spare time, to have a clean, organized fixture the way I'd like to see it. If it was useful to you and you'd like to donate to the project, I'd hugely appreciate it!",
    "about.donations": "Donations",
    "about.donateNote":
      "Support the project! It's free and ad-free. If you liked it, you can buy me something:",
    "about.crypto": "Crypto",
    "crypto.soon": "Coming soon",
    "crypto.copy": "Copy",
    "crypto.copied": "✓ Copied",
    "crypto.showQR": "Show QR",
    "crypto.hideQR": "Hide QR",
    "crypto.scan": "Scan with your wallet",
    "crypto.thanks": "💚 Thank you so much for your donation! 🙌",
    "crypto.sent": "I already sent my donation",
    "crypto.note.lightning":
      "Pay with any Lightning wallet — instant and with minimal fees. Ideal for tips.",
    "crypto.note.onchain":
      "Traditional Bitcoin network. Better for larger amounts (fees aren't worth it for small donations).",
    "crypto.note.usdt":
      "Accepted networks: BSC (BEP-20) and Polygon. Send USDT only via these networks (not Ethereum).",

    "contact.locked.title": "Sign in to message me",
    "contact.locked.sub": "That way I know who's writing — no anonymous messages.",
    "contact.title": "✉️ Write to me",
    "contact.sub": "A suggestion, a hello, or found a bug? Tell me:",
    "contact.asPre": "Writing as ",
    "contact.message": "Message",
    "contact.send": "Send message",
    "contact.sending": "Sending…",
    "contact.error":
      "Oops, couldn't send. Try again or reach me on LinkedIn.",
    "contact.done.title": "Thanks for writing!",
    "contact.done.sub": "Your message arrived. I'll reply as soon as I can.",
    "contact.done.again": "Send another",

    "atc.add": "Add to calendar",
    "atc.apple": "Apple or other (.ics)",
    "event.worldcup": "World Cup 2026",

    "admin.restricted.title": "Restricted access",
    "admin.restricted.sub": "Only administrators can view this section.",
    "admin.users": "👥 Users",
    "admin.userCount.one": "registered user",
    "admin.userCount.other": "registered users",
    "admin.col.user": "User",
    "admin.col.email": "Email",
    "admin.col.team": "Team",
    "admin.col.tz": "Timezone",
    "admin.col.actions": "Actions",
    "admin.edit": "✏️ Edit",
    "admin.deleteTitle": "Delete user",
    "admin.empty": "No registered users.",
    "admin.loading": "Loading users…",
    "admin.confirmDelete":
      'Delete user "{name}"? This action cannot be undone.',
  },

  pt: {
    "nav.grupos": "Fase de grupos",
    "nav.partido": "Partida",
    "nav.playoff": "Mata-mata",
    "nav.detalle": "Grupos",
    "nav.calendario": "Calendário",
    "nav.siguiente": "Próximo jogo",
    "nav.miequipo": "Meu time",
    "nav.favoritos": "Favoritos",
    "nav.cuenta": "Minha conta",
    "nav.login": "Entrar",
    "nav.sobre": "Contato",
    "nav.admin": "Admin",
    "brand.title": "Copa do Mundo 2026",
    "brand.sub": "Canadá · México · EUA",
    "sidebar.hide": "Ocultar menu",
    "sidebar.show": "Mostrar menu",
    "header.dates": "De 11 de junho a 19 de julho de 2026",
    "footer.pre":
      "Horários indicativos convertidos para o seu fuso horário. Times e grupos confirmados; datas, sedes e horários podem mudar — confira em ",
    "footer.post": ".",

    "common.cancel": "Cancelar",
    "common.save": "Salvar",
    "common.signin": "Entrar",
    "vs": "vs",
    "live.now": "AO VIVO",
    "live.ht": "INTERVALO",
    "live.ft": "Encerrado",
    "live.susp": "SUSPENSO",
    "live.postp": "ADIADO",
    "live.canc": "CANCELADO",
    "live.pen": "Pen",

    "account.locked.title": "Entre ou cadastre-se",
    "account.locked.sub": "Acesse sua conta para gerenciar seu perfil.",
    "account.locked.cta": "Entrar ou cadastrar-se",
    "account.user": "👤 Usuário",
    "account.email": "📧 Email",
    "account.myteam": "⭐ Meu time",
    "account.timezone": "🕒 Fuso horário",
    "account.language": "🌐 Idioma",
    "tzbubble.text":
      "Seu fuso horário está correto? Você tem {stored} configurado, mas seu dispositivo parece estar em {detected}.",
    "tzbubble.cta": "Alterar em Minha conta",
    "tzbubble.dismiss": "Fechar",
    "nav.simulaciones": "Simulações",
    "sim.bubble.label": "Modo simulação",
    "sim.bubble.manage": "Gerenciar",
    "sim.bubble.exit": "Sair",
    "sim.scenario": "Cenário",
    "sim.intro":
      "Escolha um cenário, ative-o e simule resultados das partidas que ainda faltam jogar. A classificação e o chaveamento são recalculados sozinhos. Os resultados reais nunca são alterados.",
    "sim.login": "Entre para criar e salvar suas simulações.",
    "sim.login.cta": "Ir para Minha conta",
    "sim.card.empty": "Sem partidas simuladas",
    "sim.card.matches": "{n} partida(s) simulada(s)",
    "sim.card.active": "Ativo",
    "sim.card.simulate": "Simular partidas",
    "sim.activate": "Ativar",
    "sim.deactivate": "Desativar",
    "sim.reset": "Resetar",
    "sim.reset.confirm": "Apagar todos os resultados simulados deste cenário?",
    "sim.badge": "Simulado",
    "sim.edit.title": "Simular resultado",
    "sim.edit.hint":
      "Ajuste o placar e salve. Só é possível simular partidas ainda não jogadas.",
    "sim.edit.save": "Salvar simulação",
    "sim.edit.clear": "Remover simulação",
    "account.pwd.change": "🔑 Alterar senha",
    "account.pwd.current": "Senha atual",
    "account.pwd.new": "Nova senha",
    "account.pwd.updated": "Senha atualizada.",
    "account.logout": "🚪 Sair",
    "account.delete": "🗑️ Excluir conta",
    "account.delete.warnPre":
      "Esta ação é irreversível. Para confirmar, digite seu usuário ",
    "account.delete.nameMismatch": "O nome não confere.",
    "account.delete.confirm": "Excluir definitivamente",

    "auth.login": "Entrar",
    "auth.register": "Criar conta",
    "auth.tab.login": "Entrar",
    "auth.tab.register": "Cadastrar-se",
    "auth.username": "Usuário",
    "auth.email": "Email",
    "auth.password": "Senha",
    "auth.confirm": "Confirmar senha",
    "auth.pwdMismatch": "As senhas não conferem.",
    "auth.processing": "Processando…",
    "auth.or": "ou",
    "auth.google": "Continuar com o Google",
    "auth.close": "Fechar",

    "group.badge": "Grupo {g}",
    "group.seeTable": "Ver tabela →",
    "group.seeDetailTitle": "Ver tabela e detalhes do Grupo {g}",

    "match.pick.sub": "Escolha uma fase e uma partida para ver os detalhes. Você também pode tocar em qualquer jogo no resto do app.",
    "match.pick.instance": "Fase",
    "match.pick.group": "Grupo",
    "match.pick.match": "Partida",
    "match.stage.groups": "Fase de grupos",
    "match.back": "← Escolher outra partida",
    "match.scheduled": "Agendado",
    "match.standings.title": "Tabela de classificação",
    "match.proj.tentative": "provisório",
    "match.proj.confirmed": "confirmado",
    "standings.team": "Time",
    "st.pj": "J",
    "st.pg": "V",
    "st.pe": "E",
    "st.pp": "D",
    "st.gf": "GP",
    "st.gc": "GC",
    "st.dg": "SG",
    "st.pts": "Pts",
    "st.pj.t": "Jogos disputados",
    "st.pg.t": "Vitórias",
    "st.pe.t": "Empates",
    "st.pp.t": "Derrotas",
    "st.gf.t": "Gols a favor",
    "st.gc.t": "Gols contra",
    "st.dg.t": "Saldo de gols",
    "st.pts.t": "Pontos",
    "groups.noMatches":
      "Ainda não foram disputados jogos deste grupo: a tabela começa do zero e é atualizada a cada resultado.",
    "groups.matches": "Jogos",

    "ko.intro":
      "Avançam os 2 primeiros de cada grupo mais os 8 melhores terceiros (32 times). Os confrontos são definidos ao fim da fase de grupos.",
    "ko.swipeHint": "Deslize para ver as próximas rodadas →",
    "ko.projLead": "Confrontos das 32-avos conforme a tabela atual:",
    "ko.projTentative": "Tentativos (faltam jogos do grupo)",
    "ko.projConfirmed": "Confirmados (grupo encerrado)",

    "cal.prevWeek": "Semana anterior",
    "cal.nextWeek": "Próxima semana",
    "cal.today": "Hoje",
    "cal.week": "Semana {n}",
    "cal.intro":
      "Todos os jogos do torneio, semana a semana. Os horários estão no seu fuso horário.",
    "cal.match.one": "jogo",
    "cal.match.other": "jogos",
    "cal.dayNames": ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],

    "nm.count.days": "Faltam {d}d {h}h",
    "nm.count.hours": "Faltam {h}h {m}min",
    "nm.count.mins": "Faltam {m}min",
    "nm.ended.title": "A Copa do Mundo acabou",
    "nm.ended.sub": "Não há mais jogos a disputar. Obrigado por acompanhar!",
    "nm.live": "Ao vivo agora",
    "nm.inaugural": "🎉 Jogo de abertura",
    "nm.next": "⏭️ Próximo jogo",
    "nm.simul": "🔥 {n} jogos simultâneos",

    "myteam.locked.title": "Entre para ver seu time",
    "myteam.locked.sub": "Escolha sua seleção favorita e acompanhe todos os jogos.",
    "myteam.change": "Mudar time",
    "myteam.pick": "Escolha seu time:",
    "myteam.noMatches": "Não há jogos para este time.",
    "tab.groupstage": "🏟️ Fase de grupos",
    "tab.playoffs": "🏆 Mata-mata",

    "fav.locked.title": "Entre para ver seus favoritos",
    "fav.locked.sub": "Monte sua lista de times e acompanhe todos os jogos.",
    "fav.title": "Favoritos",
    "fav.edit": "Editar lista",
    "fav.done": "Pronto",
    "fav.pick": "Marque os times que quer acompanhar:",
    "fav.empty": 'Você ainda não adicionou favoritos. Toque em "Editar lista" para começar.',
    "fav.saveError": "Não foi possível salvar o favorito.",

    "path.noPath": "Não foi possível traçar o caminho deste time.",
    "path.first": "🥇 Classifica em 1.º do Grupo {g}",
    "path.second": "🥈 Classifica em 2.º do Grupo {g}",
    "path.vs": " vs ",
    "path.tbd": "A definir",
    "path.outcome.first": "🥇 Classificado em 1.º do Grupo {g}",
    "path.outcome.second": "🥈 Classificado em 2.º do Grupo {g}",
    "path.outcome.third": "🥉 Classificado como melhor 3.º (Grupo {g})",
    "path.outcome.groups": "❌ Eliminado na fase de grupos",
    "path.ko.out": "❌ Eliminado em {round}",
    "path.ko.runnerup": "🥈 Vice-campeão",
    "path.ko.champion": "🏆 Campeão do Mundo!",
    "path.ko.thirdplace": "🥉 Terceiro lugar",
    "path.ko.fourthplace": "Quarto lugar",
    "path.ko.playingThird": "Disputa o 3.º lugar",
    "path.qual.first": "Classificou em 1.º do Grupo {g}",
    "path.qual.second": "Classificou em 2.º do Grupo {g}",
    "path.qual.third": "Classificou como melhor 3.º (Grupo {g})",
    "path.route": "Caminho no mata-mata",

    "about.createdBy": "Criado por {name}",
    "about.tagline":
      "Argentino na Finlândia, fã de futebol e de código. Montei este fixture da Copa do Mundo de 2026 nas horas vagas, para ter um fixture limpo, organizado e do jeito que eu gostaria de ver. Se foi útil para você e quiser fazer uma doação ao projeto, eu agradeceria muitíssimo!",
    "about.donations": "Doações",
    "about.donateNote":
      "Apoie o projeto! É grátis e sem anúncios. Se você gostou, pode me pagar um cafezinho:",
    "about.crypto": "Cripto",
    "crypto.soon": "Em breve",
    "crypto.copy": "Copiar",
    "crypto.copied": "✓ Copiado",
    "crypto.showQR": "Ver QR",
    "crypto.hideQR": "Ocultar QR",
    "crypto.scan": "Escaneie com sua wallet",
    "crypto.thanks": "💚 Muito obrigado pela sua doação! 🙌",
    "crypto.sent": "Já enviei minha doação",
    "crypto.note.lightning":
      "Pague com qualquer carteira Lightning — instantâneo e com taxas mínimas. Ideal para gorjetas.",
    "crypto.note.onchain":
      "Rede Bitcoin tradicional. Melhor para valores altos (as taxas não compensam para doações pequenas).",
    "crypto.note.usdt":
      "Redes aceitas: BSC (BEP-20) e Polygon. Envie USDT apenas por essas redes (não por Ethereum).",

    "contact.locked.title": "Entre para me escrever",
    "contact.locked.sub": "Assim sei quem está escrevendo — nada de mensagens anônimas.",
    "contact.title": "✉️ Me escreva",
    "contact.sub": "Uma sugestão, um olá ou encontrou um bug? Me conte:",
    "contact.asPre": "Escrevendo como ",
    "contact.message": "Mensagem",
    "contact.send": "Enviar mensagem",
    "contact.sending": "Enviando…",
    "contact.error":
      "Ops, não foi possível enviar. Tente novamente ou me chame no LinkedIn.",
    "contact.done.title": "Obrigado por escrever!",
    "contact.done.sub": "Sua mensagem chegou. Respondo assim que puder.",
    "contact.done.again": "Enviar outra",

    "atc.add": "Adicionar ao calendário",
    "atc.apple": "Apple ou outro (.ics)",
    "event.worldcup": "Copa do Mundo 2026",

    "admin.restricted.title": "Acesso restrito",
    "admin.restricted.sub": "Apenas administradores podem ver esta seção.",
    "admin.users": "👥 Usuários",
    "admin.userCount.one": "usuário cadastrado",
    "admin.userCount.other": "usuários cadastrados",
    "admin.col.user": "Usuário",
    "admin.col.email": "Email",
    "admin.col.team": "Time",
    "admin.col.tz": "Fuso horário",
    "admin.col.actions": "Ações",
    "admin.edit": "✏️ Editar",
    "admin.deleteTitle": "Excluir usuário",
    "admin.empty": "Nenhum usuário cadastrado.",
    "admin.loading": "Carregando usuários…",
    "admin.confirmDelete":
      'Excluir o usuário "{name}"? Esta ação não pode ser desfeita.',
  },
};

// Traduce una clave al idioma dado, interpolando {var} con `vars`. Cae a inglés
// y luego al texto original si falta. Si el valor es un array (p. ej. los
// nombres de los días), lo devuelve tal cual.
export function t(lang, key, vars) {
  const val =
    DICT[lang]?.[key] ?? DICT.en?.[key] ?? DICT.es?.[key] ?? key;
  if (typeof val !== "string" || !vars) return val;
  return val.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] != null ? vars[k] : `{${k}}`
  );
}
