/**
 * Récupération "tolérante" de l'utilisateur côté serveur.
 *
 * Le mode invité doit fonctionner même si Supabase n'est pas configuré
 * (clé absente) ou indisponible : dans ce cas on renvoie simplement `null`
 * au lieu de faire planter le rendu.
 */

import "server-only";

import type { User } from "@supabase/supabase-js";

import { createClient } from "./supabase/server";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getOptionalUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
