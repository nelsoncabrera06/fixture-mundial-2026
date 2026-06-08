// ---------------------------------------------------------------------------
// "Agregar al calendario" — sin API ni login.
//
// Google y Outlook abren su pantalla de "nuevo evento" precargada vía una URL
// con parámetros. Para Apple Calendar (y cualquier otro) se genera un archivo
// .ics estándar que el navegador descarga.
//
// La hora del evento va SIEMPRE en UTC absoluto (el `start` es un Date), así el
// partido le cae a cada persona en su propia zona horaria automáticamente.
// ---------------------------------------------------------------------------

const DURATION_MIN = 120; // duración estimada del partido (para el fin del evento)

// Date -> "AAAAMMDDTHHMMSSZ" (UTC), formato que piden Google y el .ics.
function fmtUTC(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function endOf(start) {
  return new Date(start.getTime() + DURATION_MIN * 60000);
}

// Escapa texto para campos de un .ics (RFC 5545).
function escapeICS(s) {
  return String(s || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function googleCalUrl({ title, start, location, details }) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmtUTC(start)}/${fmtUTC(endOf(start))}`,
    details: details || "",
    location: location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalUrl({ title, start, location, details }) {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    startdt: start.toISOString(),
    enddt: endOf(start).toISOString(),
    body: details || "",
    location: location || "",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

// Contenido de un archivo .ics para un evento.
export function icsContent({ title, start, location, details }) {
  const uid = `${fmtUTC(start)}-${encodeURIComponent(title)}@fixturemundial2026`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fixture Mundial 2026//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmtUTC(start)}`,
    `DTSTART:${fmtUTC(start)}`,
    `DTEND:${fmtUTC(endOf(start))}`,
    `SUMMARY:${escapeICS(title)}`,
    `LOCATION:${escapeICS(location)}`,
    `DESCRIPTION:${escapeICS(details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// Data URI descargable con el .ics (para el atributo download de un <a>).
export function icsDataUri(event) {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent(event))}`;
}
