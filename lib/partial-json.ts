/**
 * Parse tolérant d'un JSON en cours de streaming (côté client).
 *
 * Pendant que le modèle génère, le texte reçu est un objet JSON tronqué
 * n'importe où (au milieu d'une chaîne, d'un tableau, d'une clé…). Ce module
 * le répare au mieux pour afficher l'analyse au fil de l'eau.
 *
 * Principe (une seule passe, O(n)) : on suit la pile d'ouvrants `{`/`[` et
 * l'état "dans une chaîne", et on mémorise le dernier POINT SÛR — une position
 * où toutes les valeurs entamées sont complètes (fin de chaîne-valeur, `}` ,
 * `]` ou `,`). On tronque au point sûr puis on referme la pile.
 *
 * ⚠️ Aperçu uniquement : l'objet final affiché reste celui validé par Zod
 * côté serveur (événement "done"). Aucune décision n'est prise sur un partiel.
 */

import type { Analysis, Vigilance } from "./schema";

export type PartialVigilance = Partial<Vigilance>;

export interface PartialAnalysis
  extends Partial<Omit<Analysis, "vigilances">> {
  vigilances?: PartialVigilance[];
}

/** Tronque au dernier point sûr et referme les structures ouvertes. */
function repairTruncatedJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  const s = text.slice(start);

  const stack: string[] = []; // fermants attendus, dans l'ordre d'ouverture
  let inString = false;
  let escaped = false;
  let expectKey = false; // dans un objet, la prochaine chaîne est-elle une clé ?
  let safeEnd = -1; // fin du dernier fragment complet
  let safeClosers = ""; // fermants à ajouter si on tronque là

  const markSafe = (end: number) => {
    safeEnd = end;
    safeClosers = [...stack].reverse().join("");
  };

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
        // Une chaîne-VALEUR complète est un point sûr ; une clé seule, non.
        if (!expectKey) markSafe(i + 1);
      }
      continue;
    }

    switch (ch) {
      case '"':
        inString = true;
        break;
      case "{":
        stack.push("}");
        expectKey = true;
        break;
      case "[":
        stack.push("]");
        expectKey = false;
        break;
      case "}":
      case "]":
        stack.pop();
        expectKey = false;
        markSafe(i + 1);
        break;
      case ":":
        expectKey = false;
        break;
      case ",":
        // La virgule clôt la valeur précédente (couvre nombres et littéraux).
        markSafe(i);
        expectKey = stack[stack.length - 1] === "}";
        break;
      default:
        break;
    }
  }

  if (safeEnd <= 0) return null;
  return s.slice(0, safeEnd) + safeClosers;
}

/**
 * Tente d'extraire un aperçu d'analyse depuis le texte streamé partiel.
 * Renvoie null tant que rien d'affichable n'est disponible.
 */
export function parsePartialAnalysis(text: string): PartialAnalysis | null {
  const repaired = repairTruncatedJson(text);
  if (!repaired) return null;
  try {
    const value: unknown = JSON.parse(repaired);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return null;
    }
    return value as PartialAnalysis;
  } catch {
    return null;
  }
}
