# 📝 Notas y próximos pasos — Fixture Mundial 2026

Estado y pendientes del proyecto. (Arquitectura y detalles técnicos: ver `CLAUDE.md`.)

## ✅ Hecho hasta ahora

- App Next.js (App Router) lista para Vercel, **100% estática**: sin base de
  datos, sin rutas de API y sin variables de entorno.
- **Barra lateral izquierda** para navegar entre secciones. Las secciones salen
  del array `sections` en `app/page.js` — agregar una nueva es sumar un objeto ahí.
- **Barra ocultable**: botón "← Ocultar" abajo de la barra; cuando está oculta
  aparece el botón ☰ arriba a la izquierda para volver a abrirla.
- **Contenido centrado** (`.main-inner`, max-width 1080px).
- **Zona horaria**: cada partido se guarda como instante absoluto y se muestra en
  la zona elegida (dispositivo por defecto). Selector + cartel arriba. La
  elección se recuerda en `localStorage`.
- Fase de grupos completa (12 grupos, 48 equipos, 72 partidos) y cuadro de
  playoffs (Ronda de 32 → Final) con **todos los resultados cargados**, incluidos
  penales, tercer puesto y final.
- **Perfil local** (nombre, equipo, favoritos) y **4 escenarios de simulación**
  guardados en `localStorage`: no hay cuentas ni contraseñas.
- **Se eliminó Supabase** (auth, `profiles`, `simulations`, `live_scores`, la
  Edge Function `sync-scores` y la ruta de admin). El backup `pg_dump` de la base
  vieja quedó en `db/` (ignorado por git) y, como es SQL plano, se puede mirar
  con `zcat db/*.backup.gz | less` — sin base de datos ni credenciales.
- **Perfil de ejemplo**: la primera visita arranca con equipo y favoritos
  cargados (los del autor, sin ningún dato personal). Ver `lib/demoProfile.js`.
- Con el torneo terminado no queda ningún partido **simulable** (los 104 tienen
  resultado final), así que la pestaña Simulaciones lo avisa en vez de ofrecer un
  botón muerto.

## 🔜 Pendientes / ideas

- [ ] **Recordar el estado de la barra** (abierta/cerrada) en `localStorage`,
      igual que la zona horaria.
- [ ] Mostrar los **nombres reales de los equipos** en el cuadro de playoffs:
      las ranuras de R32/R16 siguen como `"Ganador 89"` y se resuelven desde los
      resultados, pero se podrían escribir los equipos definitivos.
- [ ] Modo **claro/oscuro**.
- [ ] **Banderas como imágenes** en vez de emoji (opcional; el emoji ya funciona).
- [ ] Cuando el Mundial 2026 vuelva a la conversación, evaluar si se quiere un
      "Mundial 2030" reciclando `lib/matches.js` y `lib/knockout.js`.

## ⚠️ Si "no se ven los cambios"

No es el código: suele ser un server Next viejo colgado o caché del navegador.
1. `pkill -f next-server` y `pkill -f "next dev"`
2. `rm -rf .next` y `npm run dev` (un solo server limpio)
3. Refrescar fuerte en el navegador: **Cmd+Shift+R** (o ventana privada).
