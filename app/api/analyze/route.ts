/**
 * Route d'analyse — SEUL point d'appel à l'API Claude.
 *
 * Flux :
 *  1. valide la saisie entrante (Zod) ;
 *  2. calcule les métriques EN CODE (frontière déterministe) ;
 *  3. envoie uniquement ces métriques au modèle, qui interprète ;
 *  4. renvoie { metrics, analysis } validés.
 *
 * La clé ANTHROPIC_API_KEY et le prompt système ne quittent jamais le serveur.
 */

import { NextResponse } from "next/server";

import { runAnalysis, AnalysisError } from "@/lib/analyze";
import { computeMetrics } from "@/lib/metrics";
import { analyzeRequestSchema } from "@/lib/schema";

// Exécution Node (le SDK Anthropic n'est pas garanti sur le runtime Edge).
export const runtime = "nodejs";

export async function POST(request: Request) {
  // 1. Corps JSON parsable ?
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête JSON invalide." },
      { status: 400 },
    );
  }

  // 2. Saisie conforme ?
  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Saisie invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // 3. Métriques calculées en code, puis interprétation par le modèle.
  const metrics = computeMetrics(parsed.data);

  // Garde-fou : refuser une analyse sur un patrimoine vide.
  if (metrics.total <= 0) {
    return NextResponse.json(
      { error: "Renseignez au moins un montant pour lancer l'analyse." },
      { status: 400 },
    );
  }

  try {
    const analysis = await runAnalysis(metrics);
    return NextResponse.json({ metrics, analysis });
  } catch (error) {
    if (error instanceof AnalysisError) {
      // Erreur maîtrisée (clé absente, sortie non conforme après retry).
      console.error("[analyze] échec d'analyse :", error.message);
      return NextResponse.json(
        { error: "L'analyse n'a pas pu être générée. Réessayez dans un instant." },
        { status: 502 },
      );
    }
    console.error("[analyze] erreur inattendue :", error);
    return NextResponse.json(
      { error: "Erreur serveur inattendue." },
      { status: 500 },
    );
  }
}
