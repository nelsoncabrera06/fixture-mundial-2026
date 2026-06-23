// ---------------------------------------------------------------------------
// FASE ELIMINATORIA — Mundial 2026
//
// Avanzan 32 equipos: los 2 primeros de cada grupo (24) + los 8 mejores terceros.
// Los CRUCES dependen de los resultados de la fase de grupos, así que los
// rivales van como "Por definir" hasta que terminen los grupos.
// Las fechas/sedes son orientativas; los horarios (`time`) están en HORA DE
// ARGENTINA (UTC-3) y se convierten a un instante UTC con kickoff().
//
// Para "activar" un cruce cuando se conozcan los equipos, editá `home`/`away`.
// ---------------------------------------------------------------------------

export const ROUNDS = [
  {
    id: "r32",
    name: "Ronda de 32",
    matches: [
      { id: "73", date: "2026-06-28", time: "16:00", home: "2.º Grupo A", away: "2.º Grupo B", venue: "SoFi Stadium", city: "Los Ángeles" },
      { id: "74", date: "2026-06-29", time: "17:30", home: "1.º Grupo E", away: "3.º A/B/C/D/F", venue: "Gillette Stadium", city: "Boston" },
      { id: "75", date: "2026-06-29", time: "22:00", home: "1.º Grupo F", away: "2.º Grupo C", venue: "Estadio BBVA", city: "Monterrey" },
      { id: "76", date: "2026-06-29", time: "20:00", home: "1.º Grupo C", away: "2.º Grupo F", venue: "NRG Stadium", city: "Houston" },
      { id: "77", date: "2026-06-30", time: "18:00", home: "1.º Grupo I", away: "3.º C/D/F/G/H", venue: "MetLife Stadium", city: "Nueva York / Nueva Jersey" },
      { id: "78", date: "2026-06-30", time: "14:00", home: "2.º Grupo E", away: "2.º Grupo I", venue: "AT&T Stadium", city: "Dallas" },
      { id: "79", date: "2026-06-30", time: "23:00", home: "1.º Grupo A", away: "3.º C/E/F/H/I", venue: "Estadio Azteca", city: "Ciudad de México" },
      { id: "80", date: "2026-07-01", time: "13:00", home: "1.º Grupo L", away: "3.º E/H/I/J/K", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
      { id: "81", date: "2026-07-01", time: "17:00", home: "1.º Grupo D", away: "3.º B/E/F/I/J", venue: "Levi's Stadium", city: "San Francisco" },
      { id: "82", date: "2026-07-01", time: "17:00", home: "1.º Grupo G", away: "3.º A/E/H/I/J", venue: "Lumen Field", city: "Seattle" },
      { id: "83", date: "2026-07-02", time: "20:00", home: "2.º Grupo K", away: "2.º Grupo L", venue: "BMO Field", city: "Toronto" },
      { id: "84", date: "2026-07-02", time: "16:00", home: "1.º Grupo H", away: "2.º Grupo J", venue: "SoFi Stadium", city: "Los Ángeles" },
      { id: "85", date: "2026-07-03", time: "00:00", home: "1.º Grupo B", away: "3.º E/F/G/I/J", venue: "BC Place", city: "Vancouver" },
      { id: "86", date: "2026-07-03", time: "19:00", home: "1.º Grupo J", away: "2.º Grupo H", venue: "Hard Rock Stadium", city: "Miami" },
      { id: "87", date: "2026-07-03", time: "22:30", home: "1.º Grupo K", away: "3.º D/E/I/J/L", venue: "Arrowhead Stadium", city: "Kansas City" },
      { id: "88", date: "2026-07-03", time: "15:00", home: "2.º Grupo D", away: "2.º Grupo G", venue: "AT&T Stadium", city: "Dallas" },
    ],
  },
  {
    id: "r16",
    name: "Octavos de final",
    matches: [
      { id: "89", date: "2026-07-04", time: "18:00", home: "Ganador 74", away: "Ganador 77", venue: "Lincoln Financial Field", city: "Filadelfia" },
      { id: "90", date: "2026-07-04", time: "14:00", home: "Ganador 73", away: "Ganador 75", venue: "NRG Stadium", city: "Houston" },
      { id: "91", date: "2026-07-05", time: "17:00", home: "Ganador 76", away: "Ganador 78", venue: "MetLife Stadium", city: "Nueva York / Nueva Jersey" },
      { id: "92", date: "2026-07-05", time: "19:00", home: "Ganador 79", away: "Ganador 80", venue: "Estadio Azteca", city: "Ciudad de México" },
      { id: "93", date: "2026-07-06", time: "15:00", home: "Ganador 83", away: "Ganador 84", venue: "AT&T Stadium", city: "Dallas" },
      { id: "94", date: "2026-07-06", time: "19:00", home: "Ganador 81", away: "Ganador 82", venue: "Lumen Field", city: "Seattle" },
      { id: "95", date: "2026-07-07", time: "13:00", home: "Ganador 86", away: "Ganador 88", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
      { id: "96", date: "2026-07-07", time: "17:00", home: "Ganador 85", away: "Ganador 87", venue: "BC Place", city: "Vancouver" },
    ],
  },
  {
    id: "qf",
    name: "Cuartos de final",
    matches: [
      { id: "97", date: "2026-07-09", time: "17:00", home: "Ganador 89", away: "Ganador 90", venue: "Gillette Stadium", city: "Boston" },
      { id: "98", date: "2026-07-10", time: "16:00", home: "Ganador 93", away: "Ganador 94", venue: "SoFi Stadium", city: "Los Ángeles" },
      { id: "99", date: "2026-07-11", time: "18:00", home: "Ganador 91", away: "Ganador 92", venue: "Hard Rock Stadium", city: "Miami" },
      { id: "100", date: "2026-07-11", time: "22:00", home: "Ganador 95", away: "Ganador 96", venue: "Arrowhead Stadium", city: "Kansas City" },
    ],
  },
  {
    id: "sf",
    name: "Semifinales",
    matches: [
      { id: "101", date: "2026-07-14", time: "15:00", home: "Ganador 97", away: "Ganador 98", venue: "AT&T Stadium", city: "Dallas" },
      { id: "102", date: "2026-07-15", time: "16:00", home: "Ganador 99", away: "Ganador 100", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
    ],
  },
  {
    id: "third",
    name: "Tercer puesto",
    matches: [
      { id: "103", date: "2026-07-18", time: "18:00", home: "Perdedor 101", away: "Perdedor 102", venue: "Hard Rock Stadium", city: "Miami" },
    ],
  },
  {
    id: "final",
    name: "Final",
    matches: [
      { id: "104", date: "2026-07-19", time: "16:00", home: "Ganador 101", away: "Ganador 102", venue: "MetLife Stadium", city: "Nueva York / Nueva Jersey" },
    ],
  },
];

export function kickoff(match) {
  return new Date(`${match.date}T${match.time}:00-03:00`);
}
