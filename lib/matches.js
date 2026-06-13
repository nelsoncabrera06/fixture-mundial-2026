// ---------------------------------------------------------------------------
// FASE DE GRUPOS — Mundial 2026 (Canadá / México / EE.UU.)
//
// IMPORTANTE SOBRE HORARIOS:
// El campo `time` está expresado en HORA DE ARGENTINA (UTC-3, sin horario de
// verano), que es la referencia de la fuente consultada. A partir de esa hora
// se construye un instante ABSOLUTO en UTC (ver kickoff()), y la UI lo convierte
// a la zona horaria que elija quien mira la página. Así no importa la zona de
// cada sede: el instante real del partido es único.
//
// Los grupos y equipos están confirmados (sorteo del 5 de diciembre de 2025).
// Fechas, horarios y sedes son orientativos: verificá contra fifa.com antes de
// usarlos para algo crítico. Para corregir un dato, editá solo este archivo.
// ---------------------------------------------------------------------------

export const GROUP_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

// Equipos por grupo, en orden de bombo/posición (1 a 4).
export const GROUPS = {
  A: ["México", "Sudáfrica", "Corea del Sur", "República Checa"],
  B: ["Canadá", "Bosnia y Herzegovina", "Catar", "Suiza"],
  C: ["Brasil", "Marruecos", "Haití", "Escocia"],
  D: ["Estados Unidos", "Paraguay", "Australia", "Turquía"],
  E: ["Alemania", "Curazao", "Costa de Marfil", "Ecuador"],
  F: ["Países Bajos", "Japón", "Suecia", "Túnez"],
  G: ["Bélgica", "Egipto", "Irán", "Nueva Zelanda"],
  H: ["España", "Cabo Verde", "Arabia Saudita", "Uruguay"],
  I: ["Francia", "Senegal", "Irak", "Noruega"],
  J: ["Argentina", "Argelia", "Austria", "Jordania"],
  K: ["Portugal", "RD del Congo", "Uzbekistán", "Colombia"],
  L: ["Inglaterra", "Croacia", "Ghana", "Panamá"],
};

// date: AAAA-MM-DD | time: HH:MM en HORA DE ARGENTINA (UTC-3)
export const GROUP_MATCHES = [
  // Grupo A
  { group: "A", date: "2026-06-11", time: "16:00", home: "México", away: "Sudáfrica", venue: "Estadio Azteca", city: "Ciudad de México" },
  { group: "A", date: "2026-06-11", time: "23:00", home: "Corea del Sur", away: "República Checa", venue: "Estadio Akron", city: "Guadalajara" },
  { group: "A", date: "2026-06-18", time: "13:00", home: "República Checa", away: "Sudáfrica", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { group: "A", date: "2026-06-18", time: "22:00", home: "México", away: "Corea del Sur", venue: "Estadio Akron", city: "Guadalajara" },
  { group: "A", date: "2026-06-24", time: "22:00", home: "República Checa", away: "México", venue: "Estadio Azteca", city: "Ciudad de México" },
  { group: "A", date: "2026-06-24", time: "22:00", home: "Sudáfrica", away: "Corea del Sur", venue: "Estadio BBVA", city: "Monterrey" },

  // Grupo B
  { group: "B", date: "2026-06-12", time: "16:00", home: "Canadá", away: "Bosnia y Herzegovina", venue: "BMO Field", city: "Toronto" },
  { group: "B", date: "2026-06-13", time: "16:00", home: "Catar", away: "Suiza", venue: "Levi's Stadium", city: "San Francisco" },
  { group: "B", date: "2026-06-18", time: "16:00", home: "Suiza", away: "Bosnia y Herzegovina", venue: "SoFi Stadium", city: "Los Ángeles" },
  { group: "B", date: "2026-06-18", time: "19:00", home: "Canadá", away: "Catar", venue: "BC Place", city: "Vancouver" },
  { group: "B", date: "2026-06-24", time: "16:00", home: "Suiza", away: "Canadá", venue: "BC Place", city: "Vancouver" },
  { group: "B", date: "2026-06-24", time: "16:00", home: "Bosnia y Herzegovina", away: "Catar", venue: "Lumen Field", city: "Seattle" },

  // Grupo C
  { group: "C", date: "2026-06-13", time: "19:00", home: "Brasil", away: "Marruecos", venue: "MetLife Stadium", city: "Nueva York / Nueva Jersey" },
  { group: "C", date: "2026-06-13", time: "22:00", home: "Haití", away: "Escocia", venue: "Gillette Stadium", city: "Boston" },
  { group: "C", date: "2026-06-19", time: "19:00", home: "Escocia", away: "Marruecos", venue: "Gillette Stadium", city: "Boston" },
  { group: "C", date: "2026-06-19", time: "22:00", home: "Brasil", away: "Haití", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { group: "C", date: "2026-06-24", time: "19:00", home: "Escocia", away: "Brasil", venue: "Hard Rock Stadium", city: "Miami" },
  { group: "C", date: "2026-06-24", time: "19:00", home: "Marruecos", away: "Haití", venue: "Mercedes-Benz Stadium", city: "Atlanta" },

  // Grupo D
  { group: "D", date: "2026-06-12", time: "22:00", home: "Estados Unidos", away: "Paraguay", venue: "SoFi Stadium", city: "Los Ángeles" },
  { group: "D", date: "2026-06-14", time: "01:00", home: "Australia", away: "Turquía", venue: "BC Place", city: "Vancouver" },
  { group: "D", date: "2026-06-19", time: "16:00", home: "Estados Unidos", away: "Australia", venue: "Lumen Field", city: "Seattle" },
  { group: "D", date: "2026-06-20", time: "01:00", home: "Turquía", away: "Paraguay", venue: "Levi's Stadium", city: "San Francisco" },
  { group: "D", date: "2026-06-25", time: "23:00", home: "Turquía", away: "Estados Unidos", venue: "SoFi Stadium", city: "Los Ángeles" },
  { group: "D", date: "2026-06-25", time: "23:00", home: "Paraguay", away: "Australia", venue: "Levi's Stadium", city: "San Francisco" },

  // Grupo E
  { group: "E", date: "2026-06-14", time: "14:00", home: "Alemania", away: "Curazao", venue: "NRG Stadium", city: "Houston" },
  { group: "E", date: "2026-06-14", time: "20:00", home: "Costa de Marfil", away: "Ecuador", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { group: "E", date: "2026-06-20", time: "17:00", home: "Alemania", away: "Costa de Marfil", venue: "BMO Field", city: "Toronto" },
  { group: "E", date: "2026-06-20", time: "21:00", home: "Curazao", away: "Ecuador", venue: "Arrowhead Stadium", city: "Kansas City" },
  { group: "E", date: "2026-06-25", time: "17:00", home: "Ecuador", away: "Alemania", venue: "MetLife Stadium", city: "Nueva York / Nueva Jersey" },
  { group: "E", date: "2026-06-25", time: "17:00", home: "Curazao", away: "Costa de Marfil", venue: "Lincoln Financial Field", city: "Filadelfia" },

  // Grupo F
  { group: "F", date: "2026-06-14", time: "17:00", home: "Países Bajos", away: "Japón", venue: "AT&T Stadium", city: "Dallas" },
  { group: "F", date: "2026-06-14", time: "23:00", home: "Suecia", away: "Túnez", venue: "Estadio BBVA", city: "Monterrey" },
  { group: "F", date: "2026-06-20", time: "14:00", home: "Países Bajos", away: "Suecia", venue: "NRG Stadium", city: "Houston" },
  { group: "F", date: "2026-06-21", time: "01:00", home: "Japón", away: "Túnez", venue: "Estadio BBVA", city: "Monterrey" },
  { group: "F", date: "2026-06-25", time: "20:00", home: "Túnez", away: "Países Bajos", venue: "Arrowhead Stadium", city: "Kansas City" },
  { group: "F", date: "2026-06-25", time: "20:00", home: "Japón", away: "Suecia", venue: "AT&T Stadium", city: "Dallas" },

  // Grupo G
  { group: "G", date: "2026-06-15", time: "16:00", home: "Bélgica", away: "Egipto", venue: "Lumen Field", city: "Seattle" },
  { group: "G", date: "2026-06-15", time: "22:00", home: "Irán", away: "Nueva Zelanda", venue: "SoFi Stadium", city: "Los Ángeles" },
  { group: "G", date: "2026-06-21", time: "16:00", home: "Bélgica", away: "Irán", venue: "SoFi Stadium", city: "Los Ángeles" },
  { group: "G", date: "2026-06-21", time: "22:00", home: "Egipto", away: "Nueva Zelanda", venue: "BC Place", city: "Vancouver" },
  { group: "G", date: "2026-06-27", time: "00:00", home: "Nueva Zelanda", away: "Bélgica", venue: "BC Place", city: "Vancouver" },
  { group: "G", date: "2026-06-27", time: "00:00", home: "Egipto", away: "Irán", venue: "Lumen Field", city: "Seattle" },

  // Grupo H
  { group: "H", date: "2026-06-15", time: "13:00", home: "España", away: "Cabo Verde", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { group: "H", date: "2026-06-15", time: "19:00", home: "Arabia Saudita", away: "Uruguay", venue: "Hard Rock Stadium", city: "Miami" },
  { group: "H", date: "2026-06-21", time: "13:00", home: "España", away: "Arabia Saudita", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { group: "H", date: "2026-06-21", time: "19:00", home: "Cabo Verde", away: "Uruguay", venue: "Hard Rock Stadium", city: "Miami" },
  { group: "H", date: "2026-06-26", time: "21:00", home: "Uruguay", away: "España", venue: "Estadio BBVA", city: "Monterrey" },
  { group: "H", date: "2026-06-26", time: "21:00", home: "Cabo Verde", away: "Arabia Saudita", venue: "NRG Stadium", city: "Houston" },

  // Grupo I
  { group: "I", date: "2026-06-16", time: "16:00", home: "Francia", away: "Senegal", venue: "MetLife Stadium", city: "Nueva York / Nueva Jersey" },
  { group: "I", date: "2026-06-16", time: "19:00", home: "Irak", away: "Noruega", venue: "Gillette Stadium", city: "Boston" },
  { group: "I", date: "2026-06-22", time: "18:00", home: "Francia", away: "Irak", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { group: "I", date: "2026-06-22", time: "21:00", home: "Noruega", away: "Senegal", venue: "MetLife Stadium", city: "Nueva York / Nueva Jersey" },
  { group: "I", date: "2026-06-26", time: "16:00", home: "Noruega", away: "Francia", venue: "Gillette Stadium", city: "Boston" },
  { group: "I", date: "2026-06-26", time: "16:00", home: "Senegal", away: "Irak", venue: "BMO Field", city: "Toronto" },

  // Grupo J
  { group: "J", date: "2026-06-16", time: "22:00", home: "Argentina", away: "Argelia", venue: "Arrowhead Stadium", city: "Kansas City" },
  { group: "J", date: "2026-06-17", time: "01:00", home: "Austria", away: "Jordania", venue: "Levi's Stadium", city: "San Francisco" },
  { group: "J", date: "2026-06-22", time: "14:00", home: "Argentina", away: "Austria", venue: "AT&T Stadium", city: "Dallas" },
  { group: "J", date: "2026-06-23", time: "00:00", home: "Jordania", away: "Argelia", venue: "Arrowhead Stadium", city: "Kansas City" },
  { group: "J", date: "2026-06-27", time: "23:00", home: "Jordania", away: "Argentina", venue: "AT&T Stadium", city: "Dallas" },
  { group: "J", date: "2026-06-27", time: "23:00", home: "Argelia", away: "Austria", venue: "Arrowhead Stadium", city: "Kansas City" },

  // Grupo K
  { group: "K", date: "2026-06-17", time: "14:00", home: "Portugal", away: "RD del Congo", venue: "NRG Stadium", city: "Houston" },
  { group: "K", date: "2026-06-17", time: "23:00", home: "Uzbekistán", away: "Colombia", venue: "Estadio Azteca", city: "Ciudad de México" },
  { group: "K", date: "2026-06-23", time: "14:00", home: "Portugal", away: "Uzbekistán", venue: "NRG Stadium", city: "Houston" },
  { group: "K", date: "2026-06-23", time: "23:00", home: "RD del Congo", away: "Colombia", venue: "Estadio Akron", city: "Guadalajara" },
  { group: "K", date: "2026-06-27", time: "20:30", home: "Colombia", away: "Portugal", venue: "Hard Rock Stadium", city: "Miami" },
  { group: "K", date: "2026-06-27", time: "20:30", home: "RD del Congo", away: "Uzbekistán", venue: "Mercedes-Benz Stadium", city: "Atlanta" },

  // Grupo L
  { group: "L", date: "2026-06-17", time: "17:00", home: "Inglaterra", away: "Croacia", venue: "AT&T Stadium", city: "Dallas" },
  { group: "L", date: "2026-06-17", time: "20:00", home: "Ghana", away: "Panamá", venue: "BMO Field", city: "Toronto" },
  { group: "L", date: "2026-06-23", time: "17:00", home: "Inglaterra", away: "Ghana", venue: "Gillette Stadium", city: "Boston" },
  { group: "L", date: "2026-06-23", time: "20:00", home: "Croacia", away: "Panamá", venue: "BMO Field", city: "Toronto" },
  { group: "L", date: "2026-06-27", time: "18:00", home: "Panamá", away: "Inglaterra", venue: "MetLife Stadium", city: "Nueva York / Nueva Jersey" },
  { group: "L", date: "2026-06-27", time: "18:00", home: "Croacia", away: "Ghana", venue: "Lincoln Financial Field", city: "Filadelfia" },
];

// Construye el instante absoluto (Date en UTC) a partir de la hora de Argentina.
export function kickoff(match) {
  return new Date(`${match.date}T${match.time}:00-03:00`);
}
