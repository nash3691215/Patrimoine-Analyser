/**
 * Données de démonstration pré-remplies.
 *
 * Profil "immobilier français" typique : ~60 % d'immobilier, peu de liquide,
 * une touche d'actions et de crypto. Objectif : montrer la valeur de l'outil
 * dès l'ouverture, sans saisie ni compte (mode invité).
 */

import type { PatrimoineInput } from "./types";

export const SEED_PATRIMOINE: PatrimoineInput = {
  allocations: {
    immo_residence: 240_000, // résidence principale (valeur nette)
    immo_locatif: 110_000, // un bien locatif
    actions_etf: 45_000, // PEA / ETF
    livrets_fonds_euros: 30_000, // Livret A + fonds euros
    crypto: 12_000, // une ligne crypto
    liquidites: 8_000, // compte courant
    autres: 5_000, // or, divers
  },
  depensesMensuelles: 2_800,
  horizon: "long",
};
// Total ≈ 450 000 € — dont ~78 % immobilier, ~8 % liquide : un cas d'école
// de sur-pondération immobilière et de coussin de liquidité tendu.
