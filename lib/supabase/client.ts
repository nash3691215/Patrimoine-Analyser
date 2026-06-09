/**
 * Client Supabase côté navigateur (composants "use client").
 * Utilise la clé anon publique : la sécurité repose sur le RLS.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
