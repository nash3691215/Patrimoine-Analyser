/**
 * FRONTIÈRE DÉTERMINISTE.
 *
 * Tous les chiffres de l'analyse sont produits ici, en code pur et testable.
 * L'API Claude ne reçoit que le résultat de `computeMetrics` — elle interprète,
 * elle ne calcule jamais. Ne jamais déplacer un calcul vers le prompt.
 */

import {
  ASSET_CLASSES,
  type AssetClassId,
  type Horizon,
  type Metrics,
  type PatrimoineInput,
} from "./types";

const round1 = (n: number): number => Math.round(n * 10) / 10;

const labelFor = (id: AssetClassId): string =>
  ASSET_CLASSES.find((c) => c.id === id)?.label ?? id;

/**
 * Calcule l'ensemble des métriques objectives à partir de la saisie.
 *
 * Définitions :
 * - Part liquide      : (liquidités + livrets/fonds euros) ÷ total — cash & quasi-cash.
 * - Concentration max : la classe d'actifs au poids le plus élevé, et ce poids en %.
 * - Poids immobilier  : (résidence + locatif) ÷ total.
 * - Coussin liquidité : actifs liquides ÷ dépenses mensuelles = nombre de mois couverts.
 */
export function computeMetrics(input: PatrimoineInput): Metrics {
  const { allocations, depensesMensuelles, horizon } = input;

  // Total brut — on ignore les valeurs négatives ou non finies par sécurité.
  const safe = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);

  const total = ASSET_CLASSES.reduce(
    (sum, c) => sum + safe(allocations[c.id] ?? 0),
    0,
  );

  // Répartition (montant + pourcentage) par classe.
  const repartition = ASSET_CLASSES.map((c) => {
    const montant = safe(allocations[c.id] ?? 0);
    return {
      classe: c.id,
      label: c.label,
      montant,
      pct: total > 0 ? round1((montant / total) * 100) : 0,
    };
  });

  // Actifs liquides (cash & quasi-cash, sans risque de capital).
  const montantLiquide = ASSET_CLASSES.filter((c) => c.isLiquid).reduce(
    (sum, c) => sum + safe(allocations[c.id] ?? 0),
    0,
  );

  // Poids immobilier total.
  const montantImmo = ASSET_CLASSES.filter((c) => c.isRealEstate).reduce(
    (sum, c) => sum + safe(allocations[c.id] ?? 0),
    0,
  );

  // Actifs volatils (pour l'adéquation horizon / risque).
  const montantVolatil = ASSET_CLASSES.filter((c) => c.isVolatile).reduce(
    (sum, c) => sum + safe(allocations[c.id] ?? 0),
    0,
  );

  // Concentration : la classe la plus lourde.
  let concentration: Metrics["concentration"] = {
    classe: null,
    label: "—",
    pct: 0,
  };
  if (total > 0) {
    const heaviest = repartition.reduce((max, r) =>
      r.montant > max.montant ? r : max,
    );
    concentration = {
      classe: heaviest.classe,
      label: labelFor(heaviest.classe),
      pct: heaviest.pct,
    };
  }

  // Coussin de liquidité en mois. null si dépenses non renseignées (division impossible).
  const coussinMois =
    depensesMensuelles > 0 ? round1(montantLiquide / depensesMensuelles) : null;

  return {
    total,
    partLiquidePct: total > 0 ? round1((montantLiquide / total) * 100) : 0,
    concentration,
    poidsImmoPct: total > 0 ? round1((montantImmo / total) * 100) : 0,
    coussinMois,
    repartition,
    horizon,
    partVolatilePct: total > 0 ? round1((montantVolatil / total) * 100) : 0,
  };
}

/* ------------------------------------------------------------------------- *
 * Repères pédagogiques — la même grille que celle enseignée par l'analyse,
 * appliquée en code. Ils réagissent en direct à la saisie ; l'IA n'intervient
 * pas dans leur évaluation (elle en propose ensuite une lecture).
 * ------------------------------------------------------------------------- */

/** Seuil bas du coussin de liquidité (repère : 3 à 6 mois de dépenses). */
export const COUSSIN_MIN_MOIS = 3;
/** Au-delà de ce poids, une classe d'actifs devient un facteur de fragilité. */
export const CONCENTRATION_MAX_PCT = 50;
/** Au-delà, sur-pondération immobilière (biais français fréquent). */
export const IMMO_MAX_PCT = 60;
/** Part volatile (actions/ETF + crypto) jugée cohérente selon l'horizon. */
export const VOLATILITE_MAX_PCT: Record<Horizon, number> = {
  court: 25,
  moyen: 50,
  long: 80,
};

export interface RepereStatus {
  id: "coussin" | "concentration" | "immobilier" | "horizon_risque";
  /** true = dans le repère, false = hors repère, null = non évaluable. */
  ok: boolean | null;
  /** Lecture courte du verdict, affichable telle quelle. */
  message: string;
}

/** Applique les repères pédagogiques aux métriques. Déterministe et testable. */
export function assessMetrics(metrics: Metrics): RepereStatus[] {
  const vide = metrics.total <= 0;

  const coussin: RepereStatus = vide || metrics.coussinMois === null
    ? {
        id: "coussin",
        ok: null,
        message: "Renseignez vos dépenses mensuelles pour l'évaluer.",
      }
    : metrics.coussinMois >= COUSSIN_MIN_MOIS
      ? {
          id: "coussin",
          ok: true,
          message: `${metrics.coussinMois} mois couverts (repère : ${COUSSIN_MIN_MOIS} à 6 mois).`,
        }
      : {
          id: "coussin",
          ok: false,
          message: `${metrics.coussinMois} mois couverts — sous le repère de ${COUSSIN_MIN_MOIS} mois.`,
        };

  const concentration: RepereStatus = vide
    ? { id: "concentration", ok: null, message: "—" }
    : metrics.concentration.pct <= CONCENTRATION_MAX_PCT
      ? {
          id: "concentration",
          ok: true,
          message: `Aucune classe ne dépasse ${CONCENTRATION_MAX_PCT} % du patrimoine.`,
        }
      : {
          id: "concentration",
          ok: false,
          message: `${metrics.concentration.label} porte ${metrics.concentration.pct} % — facteur de fragilité au-delà de ${CONCENTRATION_MAX_PCT} %.`,
        };

  const immobilier: RepereStatus = vide
    ? { id: "immobilier", ok: null, message: "—" }
    : metrics.poidsImmoPct <= IMMO_MAX_PCT
      ? {
          id: "immobilier",
          ok: true,
          message: `${metrics.poidsImmoPct} % du patrimoine (repère : ≤ ${IMMO_MAX_PCT} %).`,
        }
      : {
          id: "immobilier",
          ok: false,
          message: `${metrics.poidsImmoPct} % — sur-pondération au-delà de ${IMMO_MAX_PCT} % (illiquidité, concentration géographique).`,
        };

  const seuilVolatil = VOLATILITE_MAX_PCT[metrics.horizon];
  const horizonRisque: RepereStatus = vide
    ? { id: "horizon_risque", ok: null, message: "—" }
    : metrics.partVolatilePct <= seuilVolatil
      ? {
          id: "horizon_risque",
          ok: true,
          message: `${metrics.partVolatilePct} % d'actifs volatils, cohérent avec un horizon ${metrics.horizon} (repère : ≤ ${seuilVolatil} %).`,
        }
      : {
          id: "horizon_risque",
          ok: false,
          message: `${metrics.partVolatilePct} % d'actifs volatils pour un horizon ${metrics.horizon} — tension au-delà de ${seuilVolatil} %.`,
        };

  return [coussin, concentration, immobilier, horizonRisque];
}
