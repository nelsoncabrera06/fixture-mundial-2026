# ⚽ Fixture Mundial 2026

App web del fixture del Mundial de Fútbol 2026 (Canadá · México · Estados Unidos).
Secciones: 
**Fase de grupos** 
**Playoffs**
**Grupos**
**Siguiente partido**
**Mi equipo**
**Favoritos**
**Mi cuenta**
con los horarios convertidos automáticamente tu zona horaria. 
Una app para ver el mundial de manera cómoda, simple y sin anuncios.
Fixture limpio, filtros por equipo, favoritos y sync con calendario. 

Hecho con **Next.js** (App Router) y pensado para hostear en **Vercel**.
Base de Datos en **Supabase**

## Correr en local

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

## O podes probar el proyecto vivo en la nube (Vercel)

https://fixturemundial.vercel.app/


## ¿De dónde salen los horarios?

Cada partido se guarda como un **instante absoluto en el tiempo** (UTC) y la web
lo muestra en tu zona horaria usando el navegador. Por eso no importa que las
sedes estén en zonas distintas (UTC-7 a UTC-4): el horario que ves siempre es el
correcto para vos. Podés cambiar la zona horaria desde la sección Mi cuenta. 

## Editar partidos / datos

Todo está en archivos planos, sin base de datos:

- `lib/matches.js` — grupos, equipos y partidos de la fase de grupos.
- `lib/knockout.js` — cuadro de la fase eliminatoria.
- `lib/teams.js` — banderas (emoji) por selección.

Los grupos y equipos están confirmados (sorteo del 5/12/2025). Fechas, sedes y
horarios son orientativos: conviene verificarlos en
[fifa.com](https://www.fifa.com/es) antes de la fecha.
