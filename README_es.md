# ⚽ Fixture Mundial 2026

Fixture interactivo del Mundial de Fútbol 2026 (Canadá · México · Estados Unidos):
todos los horarios en **tu** zona horaria, resultados finales, favoritos, sync con
calendario y un modo "qué pasa si". Sin anuncios, sin registro y sin backend.

**App online:** https://fixturemundial.vercel.app/ · **English:** [README.md](./README.md)

## Funcionalidades

- Fase de grupos (12 grupos, 48 equipos, 72 partidos) y cuadro completo de eliminatorias (R32 → Final).
- Horarios en la zona horaria de quien mira: la del dispositivo por defecto, o una de una lista de zonas comunes.
- Resultados finales y estado del partido (*finalizado, suspendido, aplazado, cancelado*, y estados *en vivo* si algún día se vuelve a conectar una fuente).
- Tabla de posiciones calculada a partir de los resultados, más hasta 4 **escenarios de simulación** que recalculan tabla y cruces sin tocar nunca los resultados reales.
- Secciones de favoritos, "mi equipo" y "siguiente partido".
- Export al calendario en un clic: Google, Outlook o descarga `.ics`.
- Perfil local (nombre, equipo, zona horaria, favoritos) que vive en el navegador: sin cuenta y sin contraseña.
- Interfaz en español, inglés y portugués.

El Mundial terminó el 19 de julio de 2026, así que todos los resultados son
finales y están guardados en el repositorio. El sistema de marcadores en vivo
(Supabase + Edge Function contra football-data.org) se retiró junto con la base
de datos; ver [Chau base de datos](#chau-base-de-datos).

## Stack

| Capa       | Elección                                              |
| ---------- | ----------------------------------------------------- |
| Framework  | Next.js 16 (App Router) + React 19                    |
| Estilos    | CSS plano (custom properties, sin librería de UI)     |
| Datos      | Módulos JS planos en `lib/`, versionados en git       |
| Persistencia | `localStorage` (perfil + simulaciones), sin servidor |
| Hosting    | Vercel                                                 |
| Varios     | Vercel Analytics, Web3Forms (formulario de contacto)  |

Todo se prerenderiza como HTML estático. No hay data fetching en el servidor,
**ni base de datos, ni rutas de API, ni variables de entorno**.

## De dónde salen los datos

El fixture y los resultados están en el repositorio, no en una API. Grupos,
equipos, sedes y horarios se transcribieron del calendario oficial de FIFA y
viven en `lib/matches.js` (fase de grupos) y `lib/knockout.js` (eliminatorias)
como módulos de datos planos. El marcador de cada partido es su campo `result`.

Así el calendario queda versionado, con diffs y disponible en el primer render:
sin spinner, sin rate limits y sin terceros en el camino crítico. Corregir un
horario o un resultado es un diff de una línea.

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

"Mi cuenta" permite editar nombre, equipo, zona horaria e idioma, y borrar todo
con un botón. El trade-off es a propósito: no hay contraseña que se filtre, no
hay servidor que se pause — y no hay sincronización entre dispositivos. Si borrás
los datos del navegador, se va el perfil.

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

## Chau base de datos

El proyecto usaba Supabase (auth, perfiles, escenarios de simulación y una tabla
de marcadores en vivo que llenaba una Edge Function). Con el torneo terminado no
quedaba nada para que hiciera un servidor, así que se reemplazó por
`localStorage`.

Los datos viejos se guardaron como un backup `pg_dump` local y el proyecto de
Supabase ya no existe. El backup vive en `db/`, que está en `.gitignore` (son
datos personales y no hay motivo para versionarlo). La app no lo lee.

Si algún día querés mirar qué había —quién tenía cuenta, qué escenarios— el
backup es SQL plano: `zcat db/*.backup.gz | less` (o `grep`). Sin base de datos,
sin credenciales y sin herramientas.

La app trae un **perfil de ejemplo** (`lib/demoProfile.js`): el equipo y los
favoritos del autor, sin ningún dato personal. Se siembra una sola vez en la
primera visita para que la app no arranque vacía; después cada visitante lo puede
cambiar o borrar en su navegador.

## Precisión de los datos

Equipos y grupos son oficiales (sorteo del 5 de diciembre de 2025). Fechas, sedes,
horarios y resultados fueron transcritos a mano del calendario publicado por FIFA:
conviene verificarlos en [fifa.com](https://www.fifa.com/es) antes de usarlos en
serio. Los cruces pueden seguir etiquetados como `"Ganador 89"`; el cuadro los
resuelve dinámicamente a partir de los resultados.

---

Proyecto personal de [Nelson Cabrera](https://github.com/nelsoncabrera06) ·
Online en [fixturemundial.vercel.app](https://fixturemundial.vercel.app/)
