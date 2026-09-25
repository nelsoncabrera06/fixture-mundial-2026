# ⚽ Fixture Mundial 2026

Fixture interactivo del Mundial de Fútbol 2026 (Canadá · México · Estados Unidos):
todos los horarios en **tu** zona horaria, marcadores en vivo, favoritos, sync con
calendario y un modo "qué pasa si". Sin anuncios y sin obligation de registrarse.

**App online:** https://fixturemundial.vercel.app/ · **English:** [README.md](./README.md)

## Funcionalidades

- Fase de grupos (12 grupos, 48 equipos, 72 partidos) y cuadro completo de eliminatorias (R32 → Final).
- Horarios en la zona horaria de quien mira: la del dispositivo por defecto, o una de una lista de zonas comunes.
- Marcadores en vivo y estado del partido: *en juego, entretiempo, finalizado, suspendido, aplazado, cancelado*.
- Tabla de posiciones calculada a partir de los resultados, más hasta 4 **escenarios de simulación** por usuario que recalculan tabla y cruces sin tocar nunca los resultados reales.
- Secciones de favoritos, "mi equipo" y "siguiente partido".
- Export al calendario en un clic: Google, Outlook o descarga `.ics`.
- Cuenta (email + contraseña, o Google OAuth) que sincroniza zona horaria, equipo y favoritos entre dispositivos.
- Interfaz en español, inglés y portugués.
- Panel de administración opcional: gestión de usuarios y borrado de cuentas.

## Stack

| Capa             | Elección                                                     |
| ---------------- | ------------------------------------------------------------ |
| Framework        | Next.js 16 (App Router) + React 19                           |
| Estilos          | CSS plano (custom properties, sin librería de UI)            |
| Backend / BD     | Supabase (PostgreSQL + Auth + RLS)                           |
| Datos en vivo    | [football-data.org](https://www.football-data.org/) v4, vía una Supabase Edge Function |
| Hosting          | Vercel                                                        |
| Tareas serverless| Supabase Cron + Deno Edge Functions                           |
| Varios           | Vercel Analytics, Web3Forms (formulario de contacto)          |

Todo se prerenderiza como HTML estático: no hay data fetching en el servidor.
La página es una app de cliente que habla directo con Supabase, salvo una ruta
de servidor (operaciones de administración).

## De dónde salen los datos

Dos fuentes distintas, a propósito.

**1. El fixture en sí está en el repositorio, no en una API.** Grupos, equipos,
sedes y horarios vienen del calendario oficial de FIFA y viven en
`lib/matches.js` (fase de grupos) y `lib/knockout.js` (eliminatorias) como módulos
de datos planos. Así el calendario queda versionado, con diffs y disponible en el
primer render: sin spinner, sin rate limits y sin terceros en el camino crítico.
Corregir un horario es un diff de una línea.

**2. Lo que cambia durante el torneo viene de una API.** Marcador, minuto y estado
del partido se consultan en **football-data.org**
(`GET /v4/competitions/WC/matches`) cada pocos minutos.

### Cómo llegan los marcadores en vivo al navegador

1. **Supabase Cron** dispara la Edge Function `sync-scores` cada ~6 minutos.
2. La función llama a football-data.org con un token guardado como **secret de Supabase**
   — nunca llega al navegador ni al bundle —, normaliza la respuesta (incluido restar
   los penales del marcador final) y hace upsert de ~104 filas en la tabla `live_scores`.
3. El navegador consulta `live_scores` cada 30 s con la anon key (solo lectura, protegida
   por RLS). Es barato para nosotros y no gasta cuota de la API.
4. `lib/liveScores.js` traduce los nombres de equipos en inglés de la API a los nombres
   en español que usa el fixture y empareja las filas **por par de equipos**, así el
   marcador siempre cae en el partido correcto, incluso en sede neutral.

El polling está controlado: la función solo llama a la API cuando hay un partido dentro
de su ventana de inicio (o que sigue activo), lo que deja el límite gratuito de
10 req/min muy holgado. Los estados raros (suspendido / aplazado / cancelado) disparan
una alerta por email vía Web3Forms para revisarlos a mano.

### El modelo de zona horaria

Las sedes abarcan cuatro offsets de UTC (UTC-7 → UTC-4), así que un kickoff nunca se
guarda como un string de hora "de reloj". Cada partido guarda fecha y hora en UTC-3, y
`kickoff(match)` lo convierte en un **instante absoluto** (`new Date("...-03:00")`).
Después la UI formatea ese único instante con `Intl.DateTimeFormat` en la zona que haya
elegido quien mira. Ese mismo instante es el que se escribe en Google Calendar, en
Outlook o en el `.ics`, así el evento siempre cae en la hora local correcta.

## Base de datos — Supabase (PostgreSQL)

Supabase es un PostgreSQL administrado: una base relacional de verdad, con SQL, índices
y transacciones, más auth, storage y seguridad a nivel de fila (RLS).

| Tabla          | Rol                                                                              |
| -------------- | -------------------------------------------------------------------------------- |
| `profiles`     | Una fila por usuario (`username`, `team`, `timezone`, `favorites`, `role`). La crea automáticamente un trigger de la base al registrarse. |
| `simulations`  | Los escenarios del usuario: `user_id`, `scenario`, `name`, `results` (JSONB con `matchId → {h, a}`). |
| `live_scores`  | Espejo del estado del torneo que escribe la Edge Function, con clave `fixture_id`. |

**Auth:** Supabase Auth maneja email + contraseña y OAuth con Google. Las sesiones las
guarda y renueva el SDK; la app nunca maneja tokens a mano.

**Seguridad:** RLS está activa en todas las tablas — un usuario autenticado solo lee y
escribe sus propias filas (los admins entran por un chequeo de rol), y `live_scores` es de
lectura pública (son datos públicos). La clave `service_role` nunca llega al cliente: su
único hogar es la ruta de servidor `app/api/admin/delete-user/route.js`, que valida el JWT
y el rol de quien llama antes de borrar una cuenta.

Los cambios de esquema están en `supabase/migrations/`.

## Correr en local

```bash
npm install
cp .env.local.example .env.local   # y completá con las claves de tu proyecto Supabase
npm run dev
```

Abrí http://localhost:3000.

| Variable                        | Dónde se usa                                               |
| ------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Navegador + servidor                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Navegador (pública por diseño, limitada por RLS)           |
| `SUPABASE_SERVICE_ROLE_KEY`     | Solo servidor — ruta admin. Nunca con prefijo `NEXT_PUBLIC_`. |
| `FOOTBALL_DATA_TOKEN`           | Secret de Supabase, lo lee la función `sync-scores`        |

## Estructura del proyecto

```
app/            página, layout y la única ruta de servidor (admin)
components/     UI, un archivo por vista, más los providers de la app
lib/            datos (matches, knockout, teams) y lógica pura
                (timezone, results, standings, playoffs, i18n)
supabase/
  functions/    Edge Function sync-scores
  migrations/   cambios de esquema SQL
```

`lib/` concentra toda la lógica de dominio en funciones puras y testeables, así que
cambiar datos o formateo nunca toca un componente.

## Despliegue

Subí el repo a GitHub e importalo en Vercel — los deploys son automáticos. Agregá las
tres variables de entorno de la tabla de arriba en los settings del proyecto. Del lado
de Supabase, desplegá la función y programala:

```bash
supabase functions deploy sync-scores
```

La programación en sí es un Supabase Cron job que invoca la función cada ~6 minutos
(configurable desde el dashboard de Supabase).

## Precisión de los datos

Equipos y grupos son oficiales (sorteo del 5 de diciembre de 2025). Fechas, sedes y
horarios fueron transcritos a mano del calendario publicado por FIFA: conviene
verificarlos en [fifa.com](https://www.fifa.com/es) antes de usarlos en serio. Los
cruces de eliminatorias son placeholders hasta que se conozcan los resultados de
grupos; se resuelven dinámicamente a medida que llegan.

---

Proyecto personal de [Nelson Cabrera](https://github.com/nelsoncabrera06) ·
Online en [fixturemundial.vercel.app](https://fixturemundial.vercel.app/)
