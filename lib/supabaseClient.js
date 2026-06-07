"use client";

import { createClient } from "@supabase/supabase-js";

// Cliente único de Supabase para el navegador. Lee las credenciales de las
// variables de entorno (definidas en .env.local). El SDK guarda la sesión en
// localStorage y la renueva sola, así que no manejamos tokens a mano.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
