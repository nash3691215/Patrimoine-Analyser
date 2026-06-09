/**
 * Appel à l'API Claude + validation Zod de la sortie.
 *
 * ⚠️ SERVEUR UNIQUEMENT (importe le prompt système et la clé API).
 *
 * Stratégie de robustesse :
 *  - réponse attendue en JSON strict, validée par `analysisSchema` ;
 *  - si le parse OU la validation échoue, on retente UNE fois (avec un rappel
 *    explicite du format) ; un second échec lève une erreur → la route renvoie 502.
 */

import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { analysisSchema, type Analysis } from "./schema";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import type { Metrics } from "./types";

// Modèle Sonnet courant (vérifié dans la doc Anthropic au moment du build).
const MODEL = "claude-sonnet-4-6";
// 3000 tokens : marge nécessaire pour que le JSON pédagogique complet (synthèse
// + forces + vigilances avec principe & détail + pistes) ne soit jamais tronqué.
// 1500 coupait la sortie en plein milieu d'un tableau → JSON invalide.
const MAX_TOKENS = 3000;

export class AnalysisError extends Error {}

/** Extrait le premier objet JSON d'un texte (tolère un éventuel enrobage). */
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Repli : isole le premier bloc { ... } si le modèle a ajouté du texte.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new SyntaxError("Aucun JSON exploitable dans la réponse du modèle.");
  }
}

function textFromResponse(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/**
 * Lance l'analyse pédagogique pour un jeu de métriques donné.
 * @throws {AnalysisError} si la clé est absente ou si la sortie reste invalide après retry.
 */
export async function runAnalysis(metrics: Metrics): Promise<Analysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnalysisError("ANTHROPIC_API_KEY manquante côté serveur.");
  }

  const client = new Anthropic({ apiKey });
  const userMessage = buildUserMessage(metrics);

  const attempt = async (reminder?: string): Promise<Analysis> => {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: reminder ? `${userMessage}\n\n${reminder}` : userMessage,
        },
      ],
    });

    const parsed = extractJson(textFromResponse(message));
    return analysisSchema.parse(parsed);
  };

  try {
    return await attempt();
  } catch (firstError) {
    // Retry unique : on rappelle le contrat de format au modèle.
    try {
      return await attempt(
        "Rappel : réponds UNIQUEMENT par l'objet JSON strict demandé (champs synthese, forces, vigilances[{titre, principe, detail}], pistes, score_robustesse). Aucun texte ni bloc Markdown autour.",
      );
    } catch (secondError) {
      throw new AnalysisError(
        `Réponse du modèle invalide après retry : ${
          secondError instanceof Error ? secondError.message : String(secondError)
        }`,
      );
    }
  }
}
