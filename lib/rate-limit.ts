/**
 * Rate-limiting par IP, fenêtre glissante en mémoire.
 *
 * Chaque appel au modèle coûte de l'argent : on borne ce qu'une même IP peut
 * déclencher. Implémentation volontairement sans dépendance : une Map par
 * instance serverless. Limite assumée : chaque instance Vercel a son propre
 * compteur (un trafic réparti sur N instances multiplie le plafond par N).
 * Pour un durcissement réel : un compteur partagé (Upstash Redis, KV).
 */

interface Bucket {
  /** Horodatages (ms) des requêtes encore dans la fenêtre. */
  hits: number[];
}

const WINDOW_MS = 60_000;
export const MAX_REQUESTS_PER_WINDOW = 5;

const buckets = new Map<string, Bucket>();

/** Purge paresseuse pour éviter que la Map ne grossisse indéfiniment. */
function prune(now: number) {
  if (buckets.size < 1_000) return;
  buckets.forEach((bucket, key) => {
    if (bucket.hits.every((t) => now - t > WINDOW_MS)) buckets.delete(key);
  });
}

export interface RateLimitVerdict {
  allowed: boolean;
  /** Secondes à attendre avant un nouvel essai (si refusé). */
  retryAfterSeconds: number;
}

/** Enregistre une requête de `key` et dit si elle est admise. */
export function checkRateLimit(key: string, now = Date.now()): RateLimitVerdict {
  prune(now);
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < WINDOW_MS);

  if (bucket.hits.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = bucket.hits[0];
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}

/** IP cliente vue par Vercel (premier maillon de x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "inconnue";
}
