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
