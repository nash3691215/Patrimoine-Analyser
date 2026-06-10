/**
 * Route d'analyse — SEUL point d'appel à l'API Claude.
 *
 * Flux :
 *  1. valide la saisie entrante (Zod) ;
 *  2. calcule les métriques EN CODE (frontière déterministe) ;
 *  3. envoie uniquement ces métriques au modèle, qui interprète ;
 *  4. STREAME la réponse en NDJSON (une ligne JSON par événement) :
 *       {"type":"metrics","metrics":{…}}   — immédiat
 *       {"type":"delta","text":"…"}        — fragments au fil de l'eau
 *       {"type":"done","analysis":{…}}     — l'objet final VALIDÉ (seul à faire foi)
 *       {"type":"error","error":"…"}       — échec propre après retry
 *
 * Les erreurs de saisie (avant tout appel modèle) restent des réponses JSON
 * classiques avec code HTTP. La clé ANTHROPIC_API_KEY et le prompt système ne
 * quittent jamais le serveur.
 */

import { NextResponse } from "next/server";

import { runAnalysisStream, AnalysisError } from "@/lib/analyze";
import { computeMetrics } from "@/lib/metrics";
import { analyzeRequestSchema } from "@/lib/schema";

// Exécution Node (le SDK Anthropic n'est pas garanti sur le runtime Edge).
export const runtime = "nodejs";
// Marge pour l'appel modèle (plafond Vercel Hobby). La génération JSON
// pédagogique prend ~20–30 s ; on laisse de la marge avant coupure plateforme.
export const maxDuration = 60;

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

  // 4. Réponse streamée. Le statut HTTP est figé à l'ouverture du flux : les
  // échecs du modèle sont signalés par un événement {"type":"error"}.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      send({ type: "metrics", metrics });
      try {
        const analysis = await runAnalysisStream(metrics, (text) =>
          send({ type: "delta", text }),
        );
        send({ type: "done", analysis });
      } catch (error) {
        if (error instanceof AnalysisError) {
          // Erreur maîtrisée (clé absente, sortie non conforme après retry).
          console.error("[analyze] échec d'analyse :", error.message);
          send({
            type: "error",
            error: "L'analyse n'a pas pu être générée. Réessayez dans un instant.",
          });
        } else {
          console.error("[analyze] erreur inattendue :", error);
          send({ type: "error", error: "Erreur serveur inattendue." });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
