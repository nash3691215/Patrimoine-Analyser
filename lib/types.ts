/**
 * Types partagés client / serveur.
 * Volontairement sans dépendance : importable partout.
 */

/** Identifiants stables des classes d'actifs (clés de la saisie). */
export type AssetClassId =
  | "immo_residence"
  | "immo_locatif"
  | "actions_etf"
  | "livrets_fonds_euros"
  | "crypto"
  | "liquidites"
  | "autres";

/** Métadonnées d'une classe d'actifs (sert au formulaire ET aux métriques). */
export interface AssetClassMeta {
  id: AssetClassId;
  label: string;
  hint: string;
  /** Disponible immédiatement et sans risque de perte en capital (cash & quasi-cash). */
  isLiquid: boolean;
  /** Compte dans le poids immobilier total. */
  isRealEstate: boolean;
  /** Actif volatil (pour l'adéquation horizon / risque). */
  isVolatile: boolean;
}

/** Catalogue ordonné des classes d'actifs. Source unique de vérité. */
export const ASSET_CLASSES: AssetClassMeta[] = [
  {
    id: "immo_residence",
    label: "Immobilier — résidence principale",
    hint: "Valeur nette de votre logement (déduction faite du capital restant dû).",
    isLiquid: false,
    isRealEstate: true,
    isVolatile: false,
  },
  {
    id: "immo_locatif",
    label: "Immobilier locatif",
    hint: "Valeur nette des biens mis en location.",
    isLiquid: false,
    isRealEstate: true,
    isVolatile: false,
  },
  {
    id: "actions_etf",
    label: "Actions / ETF",
    hint: "PEA, compte-titres, ETF, actions en direct.",
    isLiquid: false,
    isRealEstate: false,
    isVolatile: true,
  },
  {
    id: "livrets_fonds_euros",
    label: "Livrets / fonds euros",
    hint: "Livret A, LDDS, fonds euros d'assurance-vie.",
    isLiquid: true,
    isRealEstate: false,
    isVolatile: false,
  },
  {
    id: "crypto",
    label: "Crypto-actifs",
    hint: "Bitcoin, Ethereum, autres crypto-monnaies.",
    isLiquid: false,
    isRealEstate: false,
    isVolatile: true,
  },
  {
    id: "liquidites",
    label: "Liquidités",
    hint: "Comptes courants, espèces immédiatement disponibles.",
    isLiquid: true,
    isRealEstate: false,
    isVolatile: false,
  },
  {
    id: "autres",
    label: "Autres",
    hint: "Or, objets de collection, parts de société, etc.",
    isLiquid: false,
    isRealEstate: false,
    isVolatile: false,
  },
];

/** Horizon d'investissement déclaré. */
export type Horizon = "court" | "moyen" | "long";

export const HORIZON_OPTIONS: { id: Horizon; label: string; hint: string }[] = [
  { id: "court", label: "Court terme", hint: "Moins de 3 ans" },
  { id: "moyen", label: "Moyen terme", hint: "3 à 10 ans" },
  { id: "long", label: "Long terme", hint: "Plus de 10 ans" },
];

/** Saisie brute du patrimoine par l'utilisateur (montants en euros). */
export interface PatrimoineInput {
  allocations: Record<AssetClassId, number>;
  depensesMensuelles: number;
  horizon: Horizon;
}

/** Snapshot complet sauvegardé / envoyé : saisie + métriques calculées. */
export interface PatrimoineSnapshot {
  input: PatrimoineInput;
  metrics: Metrics;
}

/**
 * Métriques objectives — calculées EXCLUSIVEMENT en code (lib/metrics.ts).
 * Le LLM reçoit ces chiffres déjà calculés ; il ne calcule jamais.
 */
export interface Metrics {
  /** Patrimoine brut total (somme des classes d'actifs). */
  total: number;
  /** Part liquide en % du total (cash & quasi-cash). */
  partLiquidePct: number;
  /** Concentration maximale : l'actif le plus lourd et son poids. */
  concentration: {
    classe: AssetClassId | null;
    label: string;
    pct: number;
  };
  /** Poids immobilier total en % du patrimoine. */
  poidsImmoPct: number;
  /** Coussin de liquidité : nombre de mois de dépenses couverts par les actifs liquides. */
  coussinMois: number | null;
  /** Répartition en % par classe (pour le donut et le contexte de l'analyse). */
  repartition: { classe: AssetClassId; label: string; montant: number; pct: number }[];
  /** Horizon déclaré (repris tel quel, sert à l'adéquation horizon / risque). */
  horizon: Horizon;
  /** Part des actifs volatils en % (actions, crypto). */
  partVolatilePct: number;
}
