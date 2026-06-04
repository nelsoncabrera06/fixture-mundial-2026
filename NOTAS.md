# 📝 Notas y próximos pasos — Fixture Mundial 2026

Estado y pendientes del proyecto. (Arquitectura y detalles técnicos: ver `CLAUDE.md`.)

## ✅ Hecho hasta ahora

- App Next.js (App Router) lista para Vercel, 100% estática.
- **Barra lateral izquierda** para navegar entre secciones (`Fase de grupos`,
  `Playoffs`). Las secciones salen del array `sections` en `app/page.js` — agregar
  una nueva es sumar un objeto ahí.
- **Barra ocultable**: botón "← Ocultar" abajo de la barra; cuando está oculta
  aparece el botón ☰ arriba a la izquierda para volver a abrirla.
- **Contenido centrado** (`.main-inner`, max-width 1080px).
- **Zona horaria**: cada partido se guarda como instante absoluto y se muestra en
  la zona elegida. Por defecto Europe/Helsinki (Finlandia). Selector + cartel
  arriba. La elección se recuerda en `localStorage`.
- Fase de grupos completa (12 grupos, 48 equipos, 72 partidos) y cuadro de
  playoffs (Ronda de 32 → Final) con rivales "Por definir".

## 🔜 Pendientes / ideas

- [ ] **Recordar el estado de la barra** (abierta/cerrada) en `localStorage`,
      igual que la zona horaria.
- [ ] Filtro "**solo Argentina**" (o seguir a una selección).
- [ ] **Resaltar el próximo partido** (el más cercano a la fecha actual).
- [ ] Modo **claro/oscuro**.
- [ ] **Banderas como imágenes** en vez de emoji (opcional; el emoji ya funciona).
- [ ] Cuando se conozcan los resultados, completar `home`/`away` reales en
      `lib/knockout.js`.
- [ ] **Desplegar en Vercel** (ver `README.md`): subir a GitHub → importar en
      vercel.com → Deploy.

## ⚠️ Si "no se ven los cambios"

No es el código: suele ser un server Next viejo colgado o caché del navegador.
1. `pkill -f next-server` y `pkill -f "next dev"`
2. `rm -rf .next` y `npm run dev` (un solo server limpio)
3. Refrescar fuerte en el navegador: **Cmd+Shift+R** (o ventana privada).
