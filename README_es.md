# ⚽ Fixture Mundial 2026

Fixture interactivo del Mundial de Fútbol 2026 (Canadá · México · Estados
Unidos): todos los horarios en **tu** zona horaria, el cuadro completo, tablas de
posiciones, favoritos, export al calendario y un modo "qué pasa si".

Lo armé para mis amigos durante el torneo; hoy sigue online como proyecto de
portfolio. Sin anuncios, sin registro, sin backend y sin mantenimiento.

**App online:** https://fixturemundial.vercel.app/ · **English:** [README.md](./README.md)

## Historia

1. **Dic 2025 – Jun 2026: un fixture estático.** Grupos, equipos, sedes y
   horarios transcritos del calendario de FIFA a `lib/matches.js` y
   `lib/knockout.js`. Sin backend: toda la app era HTML prerenderizado y
   corregir un horario era un diff de una línea.
2. **Durante el torneo: apareció un backend.** Las cuentas (email + Google), los
   favoritos, "mi equipo" y los cuatro escenarios de simulación necesitaban
   persistencia, así que entró Supabase: auth, `profiles`, `simulations`, más una
   tabla `live_scores` que llenaba cada ~6 minutos una Edge Function consultando
   football-data.org.
3. **19 Jul 2026: se jugó la final.** Todos los resultados pasaron a `lib/` como
   campo `result`. Eso dejó al sistema de marcadores en vivo sin nada que buscar.
4. **Nov 2026: el backend se fue de nuevo.** Con el torneo terminado y el
   proyecto free de Supabase pausado (y a punto de congelarse), no quedaba nada
   que un servidor pudiera hacer. Se borró la base, el perfil se mudó a
   `localStorage`, entró un perfil demo en su lugar, y la app volvió a ser un
   sitio estático con cero servidores, cero claves y cero costo.

El historial de git guarda todo el recorrido: el código de Supabase sigue ahí, y
nunca se commiteó ni un secreto ni un dato personal.

## Funcionalidades

- Fase de grupos (12 grupos, 48 equipos, 72 partidos) y cuadro completo de eliminatorias (R32 → Final).
- Horarios en la zona horaria de quien mira: la del dispositivo por defecto, o una de una lista de zonas comunes.
- Resultados finales y estado del partido (*finalizado, suspendido, aplazado, cancelado*, y estados *en vivo* si algún día se vuelve a conectar una fuente).
- Tabla de posiciones recalculada con los resultados, más 4 **escenarios de simulación** que superponen marcadores hipotéticos sin tocar los reales (hoy dormidos: ya se jugó todo, no queda nada por simular).
- Secciones de favoritos, "mi equipo" y "siguiente partido".
- Export al calendario en un clic: Google, Outlook o descarga `.ics`.
- Perfil local (nombre, equipo, zona horaria, favoritos) que vive en el navegador: sin cuenta y sin contraseña, sembrado con un demo.
- Interfaz en español, inglés y portugués.

## Stack

| Capa         | Elección                                              |
| ------------ | ----------------------------------------------------- |
| Framework    | Next.js 16 (App Router) + React 19                    |
| Estilos      | CSS plano (custom properties, sin librería de UI)     |
| Datos        | Módulos JS planos en `lib/`, versionados en git       |
| Persistencia | `localStorage` (perfil + simulaciones), sin servidor  |
| Hosting      | Vercel                                                 |
| Varios       | Vercel Analytics, Web3Forms (formulario de contacto)  |

Todo se prerenderiza como HTML estático. No hay data fetching en el servidor,
**ni base de datos, ni rutas de API, ni variables de entorno**.

## De dónde salen los datos

El fixture y los resultados están en el repositorio, no en una API. Grupos,
equipos, sedes y horarios se transcribieron del calendario oficial de FIFA y
viven en `lib/matches.js` (fase de grupos) y `lib/knockout.js` (eliminatorias)
como módulos de datos planos. El marcador de cada partido es su campo `result`.

Así el calendario queda versionado, con diffs y disponible en el primer render:
sin spinner, sin rate limits y sin terceros en el camino crítico.

### El modelo de zona horaria

Las sedes abarcan cuatro offsets de UTC (UTC-7 → UTC-4), así que un kickoff nunca
se guarda como un string de hora "de reloj". Cada partido guarda fecha y hora en
UTC-3, y `kickoff(match)` lo convierte en un **instante absoluto**
(`new Date("...-03:00")`). Después la UI formatea ese único instante con
`Intl.DateTimeFormat` en la zona que haya elegido quien mira. Ese mismo instante
es el que se escribe en Google Calendar, en Outlook o en el `.ics`, así el evento
siempre cae en la hora local correcta.

## El perfil local (sin cuentas)

No hay auth ni base de datos. En la primera visita la app crea un perfil en
`localStorage` y todo cuelga de ahí:

| Clave                      | Contenido                                                    |
| -------------------------- | ------------------------------------------------------------ |
| `fixture2026.profile`      | `{ username, team, timezone, favorites }`                     |
| `fixture2026.sims`         | Los 4 escenarios de simulación (`matchId → { h, a }`)          |
| `fixture2026.simScenario`  | Qué escenario está activo                                     |
| `fixture2026.tz` / `.lang` | Zona horaria e idioma de la vista                             |

El primer perfil se siembra desde `lib/demoProfile.js`: el equipo y los favoritos
del autor con **todos los datos personales quitados** — sin nombre, sin email,
sin id, y con `timezone: "auto"` para que cada visitante vea su propio reloj.
Existe para que la app no arranque vacía.

"Mi cuenta" permite editar nombre, equipo, zona horaria e idioma, y borrar todo
con un botón (que deja un perfil en blanco, no el demo otra vez). El trade-off es
a propósito: no hay contraseña que se filtre, no hay servidor que se pause — y no
hay sincronización entre dispositivos. Si borrás los datos del navegador, se va
el perfil.

## Correr en local

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. Sin `.env` y sin claves.

`npm run build` es el paso de verificación (no hay suite de tests).

## Estructura del proyecto

```
app/            página + layout (una sola ruta prerenderizada)
components/     UI, un archivo por vista, más los providers de la app
                (Language, Profile, Simulation)
lib/            datos (matches, knockout, teams, i18n) y lógica pura
                (timezone, results, standings, playoffs)
```

`lib/` concentra toda la lógica de dominio en funciones puras y testeables, así
que cambiar datos o formateo nunca toca un componente.

## Despliegue

Subí el repo a GitHub e importalo en Vercel — los deploys son automáticos y no
necesitan configuración ni secretos.

## Qué se eliminó, y qué queda de eso

El proyecto de Supabase está **borrado**; Google Cloud (el cliente de OAuth
detrás de "iniciar sesión con Google") se dio de baja con él. Nada en la app
referencia a ninguno de los dos.

Antes de borrar la base se guardó un `pg_dump` local en `db/`. Esa carpeta está
ignorada por git, la app nunca la lee, y es opcional: existe solo como archivo de
las cuentas que había, y se puede borrar cuando quieras. Nada del repo depende de
ella.

Dos cosas que conviene decir claro, por si alguien lee el código:

- Nunca se commiteó un dato personal. Los 32 emails de usuarios solo existieron
  en Supabase y, opcionalmente, en ese dump local ignorado por git.
- El perfil demo se armó a mano a partir de la fila del autor, quitando todo
  campo identificable. Si hacés un fork, mantenelo así.

## Precisión de los datos

Equipos y grupos son oficiales (sorteo del 5 de diciembre de 2025). Fechas, sedes,
horarios y resultados fueron transcritos a mano del calendario publicado por FIFA:
conviene verificarlos en [fifa.com](https://www.fifa.com/es) antes de usarlos en
serio. Los cruces pueden seguir etiquetados como `"Ganador 89"`; el cuadro los
resuelve dinámicamente a partir de los resultados.

---

Proyecto personal de [Nelson Cabrera](https://github.com/nelsoncabrera06) ·
Online en [fixturemundial.vercel.app](https://fixturemundial.vercel.app/)
