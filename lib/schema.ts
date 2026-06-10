/**
 * Contrat de sortie de l'IA, validé par Zod.
 *
 * Claude doit répondre EXACTEMENT cette structure en JSON strict.
 * Toute réponse non conforme est rejetée (un retry, puis erreur 502 propre).
 */

import { z } from "zod";

export const vigilanceSchema = z.object({
  /** Titre court de la zone de vigilance. */
  titre: z.string().min(1).max(120),
  /** La LEÇON éducative : un principe général, indépendant du cas. */
  principe: z.string().min(1).max(600),
  /** L'application du principe au patrimoine analysé. */
  detail: z.string().min(1).max(800),
});

export const analysisSchema = z.object({
  /** Lecture d'ensemble en quelques phrases. */
  synthese: z.string().min(1).max(1200),
  /** Points d'appui de l'allocation. */
  forces: z.array(z.string().min(1).max(400)).min(1).max(6),
  /** Angles morts, chacun porteur d'un principe pédagogique. */
  vigilances: z.array(vigilanceSchema).min(1).max(6),
  /** Pistes de réflexion concrètes (jamais des ordres d'achat). */
  pistes: z.array(z.string().min(1).max(400)).min(1).max(6),
  /** Score de robustesse aux chocs, sur 100. */
  score_robustesse: z.number().int().min(0).max(100),
});

export type Vigilance = z.infer<typeof vigilanceSchema>;
export type Analysis = z.infer<typeof analysisSchema>;

/**
 * Schéma de la requête entrante de /api/analyze.
 * On revalide la saisie côté serveur : ne jamais faire confiance au client.
 * Bornes hautes : au-delà de toute situation patrimoniale plausible, on
 * refuse — chaque requête acceptée déclenche un appel modèle payant.
 */
const MONTANT_MAX = 1_000_000_000; // 1 Md€ par classe d'actifs
const DEPENSES_MAX = 1_000_000; // 1 M€ de dépenses mensuelles

const montant = z.number().finite().nonnegative().max(MONTANT_MAX);

export const analyzeRequestSchema = z.object({
  allocations: z.object({
    immo_residence: montant,
    immo_locatif: montant,
    actions_etf: montant,
    livrets_fonds_euros: montant,
    crypto: montant,
    liquidites: montant,
    autres: montant,
  }),
  depensesMensuelles: z.number().finite().nonnegative().max(DEPENSES_MAX),
  horizon: z.enum(["court", "moyen", "long"]),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
