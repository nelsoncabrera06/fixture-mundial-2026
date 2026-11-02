// ---------------------------------------------------------------------------
// PERFIL LOCAL — lo que antes era la tabla `profiles` de Supabase.
//
// La app ya no tiene backend: el "usuario" es un perfil que vive en el
// localStorage de ESTE navegador. Guarda lo mismo que guardaba Supabase:
// nombre, equipo, zona horaria y favoritos.
//
// Consecuencias, a propósito:
//  - No hay cuentas, ni contraseñas, ni sincronización entre dispositivos.
//  - Si borrás los datos del navegador, se va el perfil (y las simulaciones).
//  - El perfil se crea solo en la primera visita, así el resto de la app puede
//    asumir que siempre hay un usuario.
// ---------------------------------------------------------------------------

// Con extensión explícita: así este módulo (lógica pura) también corre
// en Node sin bundler, igual que el resto de las pruebas manuales de `lib/`.
import { DEMO_PROFILE } from "./demoProfile.js";

export const PROFILE_KEY = "fixture2026.profile";
// Escenarios de simulación (los escribe SimulationContext).
export const SIM_KEY = "fixture2026.sims";
// Se dispara al borrar los datos locales, para que los providers en memoria se
// enteren y se vacíen (un localStorage limpio no alcanza si el estado vive en
// React).
export const RESET_EVENT = "fixture2026:reset";

const DEFAULT_TEAM = "Argentina";
const DEFAULT_USERNAME = "Invitado";
export const MAX_USERNAME = 40;

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Deja el nombre en un formato sano (sin espacios de sobra, largo acotado).
export function cleanUsername(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_USERNAME);
}

// Perfil nuevo con los valores por defecto.
export function emptyProfile() {
  return {
    id: uid(),
    username: DEFAULT_USERNAME,
    team: DEFAULT_TEAM,
    timezone: "auto",
    favorites: [],
    createdAt: new Date().toISOString(),
  };
}

// Perfil de la PRIMERA visita: valores por defecto + lo del perfil de ejemplo
// (equipo y favoritos), para que la app no arranque vacía.
export function createInitialProfile() {
  return normalize({ ...emptyProfile(), ...DEMO_PROFILE });
}

// Completa lo que falte y descarta basura: sirve tanto para un perfil viejo
// (migración suave) como para un JSON roto a mano.
function normalize(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    id: typeof r.id === "string" && r.id ? r.id : uid(),
    username: cleanUsername(r.username) || DEFAULT_USERNAME,
    team: typeof r.team === "string" && r.team ? r.team : DEFAULT_TEAM,
    timezone: typeof r.timezone === "string" && r.timezone ? r.timezone : "auto",
    favorites: Array.isArray(r.favorites)
      ? r.favorites.filter((f) => typeof f === "string")
      : [],
    createdAt:
      typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
  };
}

// Lee el perfil (y lo crea si es la primera visita). Devuelve null en el
// servidor, donde no hay localStorage.
export function loadProfile() {
  if (typeof window === "undefined") return null;
  let raw = null;
  try {
    raw = JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "null");
  } catch {
    raw = null;
  }
  // Primera visita: se siembra el perfil de ejemplo y se guarda.
  if (!raw) return saveProfile(createInitialProfile());
  return normalize(raw);
}

export function saveProfile(profile) {
  if (typeof window === "undefined") return profile;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

// Aplica un cambio parcial y devuelve el perfil completo ya guardado.
export function patchProfile(patch) {
  const next = normalize({ ...loadProfile(), ...patch });
  return saveProfile(next);
}

// Borra TODO lo local (perfil + simulaciones + preferencias de UI) y avisa a
// los providers para que limpien su estado en memoria.
export function resetAll() {
  if (typeof window === "undefined") return;
  const keys = [
    PROFILE_KEY,
    SIM_KEY,
    "fixture2026.tz",
    "fixture2026.simScenario",
    "fixture2026.tzBubbleDismissed",
    "fixture2026.lang",
    "fixture2026.sidebar",
  ];
  for (const k of keys) window.localStorage.removeItem(k);
  // Se deja un perfil limpio (sin favoritos): así "borrar mis datos" no vuelve a
  // mostrar el perfil de ejemplo en la próxima recarga.
  saveProfile(emptyProfile());
  window.dispatchEvent(new Event(RESET_EVENT));
}
