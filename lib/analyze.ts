/**
 * Appel à l'API Claude + validation Zod de la sortie.
 *
 * ⚠️ SERVEUR UNIQUEMENT (importe le prompt système et la clé API).
 *
 * Stratégie de robustesse :
 *  - la première tentative est STREAMÉE : les fragments de texte sont relayés
 *    au fil de l'eau (affichage progressif côté client), puis la réponse
 *    complète est parsée et validée par `analysisSchema` ;
 *  - si le parse OU la validation échoue, on retente UNE fois en mode
 *    non-streamé (avec un rappel explicite du format) ; un second échec lève
 *    une erreur → la route renvoie un événement d'erreur propre.
 *
 * Dans tous les cas, seule la sortie VALIDÉE fait foi : les deltas streamés ne
 * servent qu'à l'aperçu, le client remplace tout par l'objet final validé.
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

const FORMAT_REMINDER =
  "Rappel : réponds UNIQUEMENT par l'objet JSON strict demandé (champs synthese, forces, vigilances[{titre, principe, detail}], pistes, score_robustesse). Aucun texte ni bloc Markdown autour.";

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

function parseAndValidate(text: string): Analysis {
  return analysisSchema.parse(extractJson(text));
}

function textFromResponse(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnalysisError("ANTHROPIC_API_KEY manquante côté serveur.");
  }
  return new Anthropic({ apiKey });
}

/**
 * Lance l'analyse pédagogique en streaming.
 *
 * `onDelta` reçoit chaque fragment de texte dès son émission par le modèle
 * (pour l'affichage progressif). La promesse résout avec l'analyse VALIDÉE.
 * En cas de sortie invalide, un unique retry non-streamé est tenté (sans
 * deltas : le client garde son aperçu jusqu'au résultat final).
 *
 * @throws {AnalysisError} si la clé est absente ou si la sortie reste invalide après retry.
 */
export async function runAnalysisStream(
  metrics: Metrics,
  onDelta: (text: string) => void,
): Promise<Analysis> {
  const client = getClient();
  const userMessage = buildUserMessage(metrics);

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    stream.on("text", onDelta);
    const message = await stream.finalMessage();
    return parseAndValidate(textFromResponse(message));
  } catch (firstError) {
    if (firstError instanceof AnalysisError) throw firstError;
    // Retry unique, non-streamé : on rappelle le contrat de format au modèle.
    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: `${userMessage}\n\n${FORMAT_REMINDER}` },
        ],
      });
      return parseAndValidate(textFromResponse(message));
    } catch (secondError) {
      throw new AnalysisError(
        `Réponse du modèle invalide après retry : ${
          secondError instanceof Error ? secondError.message : String(secondError)
        }`,
      );
    }
  }
}
