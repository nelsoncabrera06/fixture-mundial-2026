# ⚽ Fixture Mundial 2026

App web del fixture del Mundial de Fútbol 2026 (Canadá · México · Estados Unidos).
Dos pestañas: **Fase de grupos** y **Playoffs**, con los horarios convertidos
automáticamente a la zona horaria de quien mira la página (por defecto, Finlandia).

Hecho con **Next.js** (App Router) y pensado para hostear en **Vercel**.

## Correr en local

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

## Desplegar en Vercel (la parte fácil 🎉)

Tenés dos caminos:

### Opción A — desde la web (recomendado, sin instalar nada)
1. Subí este proyecto a un repo de GitHub.
2. Entrá a https://vercel.com, registrate con tu cuenta de GitHub.
3. **Add New… → Project**, elegí el repo y dale **Deploy**.
4. Vercel detecta Next.js solo: no hay que configurar nada. En ~1 minuto tenés
   una URL pública (`https://tu-proyecto.vercel.app`).

Cada vez que hagas `git push`, Vercel vuelve a desplegar automáticamente.

### Opción B — desde la terminal
```bash
npm i -g vercel
vercel          # primera vez: te guía y crea el proyecto
vercel --prod   # despliega a producción
```

## ¿De dónde salen los horarios?

Cada partido se guarda como un **instante absoluto en el tiempo** (UTC) y la web
lo muestra en tu zona horaria usando el navegador. Por eso no importa que las
sedes estén en zonas distintas (UTC-7 a UTC-4): el horario que ves siempre es el
correcto para vos. Podés cambiar la zona con el selector de arriba.

## Editar partidos / datos

Todo está en archivos planos, sin base de datos:

- `lib/matches.js` — grupos, equipos y partidos de la fase de grupos.
- `lib/knockout.js` — cuadro de la fase eliminatoria.
- `lib/teams.js` — banderas (emoji) por selección.

Los grupos y equipos están confirmados (sorteo del 5/12/2025). Fechas, sedes y
horarios son orientativos: conviene verificarlos en
[fifa.com](https://www.fifa.com/es) antes de la fecha.
