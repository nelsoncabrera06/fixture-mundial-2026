// ---------------------------------------------------------------------------
// PERFIL DE EJEMPLO ("demo") — lo que ve alguien que entra por primera vez.
//
// Sale del perfil real del autor en la base archivada (ver `db/`, ignorada por
// git), pero SIN ningún dato personal: sin nombre, sin email, sin id y sin
// fecha de alta. Solo quedaron las preferencias que hacen que la app no
// arranque vacía: equipo y equipos favoritos.
//
// Se siembra una sola vez, en la primera visita (ver lib/localProfile.js).
// Después es un perfil normal: cada visitante puede cambiarlo o borrarlo, y ese
// cambio vive solo en su navegador.
// ---------------------------------------------------------------------------

export const DEMO_PROFILE = {
  // Nombre neutro: no identifica a nadie.
  username: "Invitado",
  team: "Argentina",
  // "auto" = la zona horaria del dispositivo de quien mira. Si claváramos la
  // del autor (Europe/Helsinki), todo el mundo vería la hora de otra persona.
  timezone: "auto",
  favorites: [
    "Alemania",
    "Brasil",
    "España",
    "Francia",
    "Japón",
    "Países Bajos",
    "Colombia",
    "Uruguay",
    "Portugal",
    "Bosnia y Herzegovina",
  ],
};
