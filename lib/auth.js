// Capa de autenticación sobre Supabase.
//
// Modelo:
//   - Supabase Auth maneja la cuenta (email + password, sesiones, hash seguro).
//   - La tabla `profiles` guarda los datos extra: username, team, timezone, role.
//   - El perfil se crea solo (trigger en la DB) al registrarse.
//
// Casi todas las funciones son async porque hablan con la base por red.

import { supabase } from "./supabaseClient";

const DEFAULT_TEAM = "Argentina";

// Combina la fila de `profiles` con el email de la sesión de Auth.
function toPublicUser(profile, authEmail) {
  if (!profile) return null;
  return {
    id: profile.id,
    username: profile.username,
    email: authEmail || profile.email,
    role: profile.role,
    team: profile.team || DEFAULT_TEAM,
    // "auto" → la app detecta la zona del dispositivo en cada visita. Es el
    // fallback correcto: nunca clavamos Helsinki (la zona del dev) a un usuario.
    timezone: profile.timezone || "auto",
    favorites: profile.favorites || [],
  };
}

// Mensajes de error más amables para el usuario.
function translateError(msg) {
  if (
    /already registered|already exists|duplicate|saving new user/i.test(msg)
  ) {
    return "Ese usuario o email ya está registrado.";
  }
  if (/6 characters|password/i.test(msg)) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  return msg;
}

// Devuelve el usuario logueado (perfil + email) o null si no hay sesión.
export async function getCurrentUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  if (error) return null;
  return toPublicUser(profile, session.user.email);
}

export async function register({ username, email, password }) {
  username = (username || "").trim();
  email = (email || "").trim();
  if (!username || !email || !password) {
    throw new Error("Completá usuario, email y contraseña.");
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // `data` viaja como metadata; el trigger de la DB la usa para el perfil.
    options: { data: { username } },
  });
  if (error) throw new Error(translateError(error.message));
  // El trigger crea el perfil con la zona por defecto del servidor (Helsinki,
  // mi zona de dev). La pisamos con "auto" para que el nuevo usuario vea la
  // hora de su propio dispositivo desde el primer momento.
  const newId = data.user?.id;
  if (newId) {
    await supabase.from("profiles").update({ timezone: "auto" }).eq("id", newId);
  }
  // Con "Confirm email" desactivado, ya queda sesión activa.
  return await getCurrentUser();
}

// Login con Google (OAuth). Redirige a Google y vuelve a la app ya logueado;
// el cliente de Supabase detecta la sesión en la URL al volver y dispara
// onAuthStateChange (ver AuthContext). El perfil lo crea el trigger de la DB.
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  if (error) throw new Error(error.message);
}

export async function login({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({
    email: (email || "").trim(),
    password,
  });
  if (error) throw new Error("Email o contraseña incorrectos.");
  return await getCurrentUser();
}

export async function signOut() {
  await supabase.auth.signOut();
}

// Actualiza equipo / zona horaria del usuario indicado (su propio perfil).
export async function setUserPrefs(userId, patch) {
  const fields = {};
  if (patch.team !== undefined) fields.team = patch.team;
  if (patch.timezone !== undefined) fields.timezone = patch.timezone;
  if (patch.favorites !== undefined) fields.favorites = patch.favorites;
  if (Object.keys(fields).length === 0) return null;
  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId);
  if (error) throw error;
  return await getCurrentUser();
}

export async function changePassword({ email, currentPassword, newPassword }) {
  if (!newPassword) throw new Error("Ingresá la nueva contraseña.");
  // Re-autenticamos para verificar la contraseña actual.
  const { error: e1 } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (e1) throw new Error("La contraseña actual es incorrecta.");
  const { error: e2 } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (e2) throw new Error(translateError(e2.message));
}

// ── Administración ──────────────────────────────────────────
// Las políticas RLS de la DB permiten estas operaciones solo a admins.
export async function listUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("username");
  if (error) throw error;
  return data.map((p) => toPublicUser(p, p.email));
}

export async function updateUser(id, patch) {
  const fields = {};
  if (patch.username !== undefined) fields.username = patch.username.trim();
  if (patch.team !== undefined) fields.team = patch.team;
  if (patch.timezone !== undefined) fields.timezone = patch.timezone;
  const { error } = await supabase.from("profiles").update(fields).eq("id", id);
  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe un usuario con ese nombre.");
    }
    throw new Error(error.message);
  }
}

// Borrar cuentas pasa por la ruta server-side (usa la clave service_role).
// El navegador solo manda su token de sesión; el servidor valida permisos.
async function callDeleteUser(targetId) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa.");
  const res = await fetch("/api/admin/delete-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ targetId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "No se pudo eliminar el usuario.");
}

// El usuario borra su propia cuenta.
export async function deleteAccount() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa.");
  await callDeleteUser(session.user.id);
}

// Un admin borra a otro usuario (o a sí mismo).
export async function adminDeleteUser(id) {
  await callDeleteUser(id);
}
