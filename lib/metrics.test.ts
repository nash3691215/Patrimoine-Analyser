import { describe, expect, it } from "vitest";

import {
  assessMetrics,
  computeMetrics,
  CONCENTRATION_MAX_PCT,
  COUSSIN_MIN_MOIS,
  IMMO_MAX_PCT,
} from "./metrics";
import { SEED_PATRIMOINE } from "./seed";
import type { PatrimoineInput } from "./types";

/** Saisie de base : tout à zéro, surchargée au cas par cas. */
function input(overrides: {
  allocations?: Partial<PatrimoineInput["allocations"]>;
  depensesMensuelles?: number;
  horizon?: PatrimoineInput["horizon"];
}): PatrimoineInput {
  return {
    allocations: {
      immo_residence: 0,
      immo_locatif: 0,
      actions_etf: 0,
      livrets_fonds_euros: 0,
      crypto: 0,
      liquidites: 0,
      autres: 0,
      ...overrides.allocations,
    },
    depensesMensuelles: overrides.depensesMensuelles ?? 0,
    horizon: overrides.horizon ?? "moyen",
  };
}

describe("computeMetrics", () => {
  it("calcule le profil de démonstration (cas de référence)", () => {
    const m = computeMetrics(SEED_PATRIMOINE);
    expect(m.total).toBe(450_000);
    expect(m.poidsImmoPct).toBe(77.8); // (240k + 110k) / 450k
    expect(m.partLiquidePct).toBe(8.4); // (30k + 8k) / 450k
    expect(m.partVolatilePct).toBe(12.7); // (45k + 12k) / 450k
    expect(m.concentration.classe).toBe("immo_residence");
    expect(m.concentration.pct).toBe(53.3);
    expect(m.coussinMois).toBe(13.6); // 38k / 2 800 €
  });

  it("renvoie un coussin null quand les dépenses ne sont pas renseignées", () => {
    const m = computeMetrics(
      input({ allocations: { liquidites: 10_000 }, depensesMensuelles: 0 }),
    );
    expect(m.coussinMois).toBeNull();
  });

  it("ignore les montants négatifs ou non finis", () => {
    const m = computeMetrics(
      input({
        allocations: {
          actions_etf: 50_000,
          crypto: -5_000,
          liquidites: Number.NaN,
        },
      }),
    );
    expect(m.total).toBe(50_000);
    expect(m.concentration.pct).toBe(100);
  });

  it("gère un patrimoine vide sans division par zéro", () => {
    const m = computeMetrics(input({}));
    expect(m.total).toBe(0);
    expect(m.partLiquidePct).toBe(0);
    expect(m.poidsImmoPct).toBe(0);
    expect(m.concentration.classe).toBeNull();
  });

  it("arrondit les pourcentages à une décimale", () => {
    const m = computeMetrics(
      input({ allocations: { actions_etf: 1, livrets_fonds_euros: 2 } }),
    );
    expect(m.partLiquidePct).toBe(66.7);
  });
});

describe("assessMetrics — la grille pédagogique en code", () => {
  const byId = (input_: PatrimoineInput, id: string) =>
    assessMetrics(computeMetrics(input_)).find((r) => r.id === id)!;

  it("profil de démo : coussin ok, concentration et immobilier hors repère", () => {
    const verdicts = assessMetrics(computeMetrics(SEED_PATRIMOINE));
    const map = Object.fromEntries(verdicts.map((r) => [r.id, r.ok]));
    expect(map).toEqual({
      coussin: true,
      concentration: false,
      immobilier: false,
      horizon_risque: true,
    });
  });

  it("patrimoine vide : aucun repère évaluable", () => {
    const verdicts = assessMetrics(computeMetrics(input({})));
    expect(verdicts.every((r) => r.ok === null)).toBe(true);
  });

  it(`concentration : exactement ${CONCENTRATION_MAX_PCT} % reste dans le repère`, () => {
    const ok = byId(
      input({ allocations: { actions_etf: 50_000, livrets_fonds_euros: 50_000 } }),
      "concentration",
    );
    expect(ok.ok).toBe(true);
  });

  it(`immobilier : ${IMMO_MAX_PCT} % pile est ok, au-delà non`, () => {
    const juste = byId(
      input({ allocations: { immo_residence: 60_000, actions_etf: 40_000 } }),
      "immobilier",
    );
    expect(juste.ok).toBe(true);

    const trop = byId(
      input({ allocations: { immo_residence: 61_000, actions_etf: 39_000 } }),
      "immobilier",
    );
    expect(trop.ok).toBe(false);
  });

  it(`coussin : ${COUSSIN_MIN_MOIS} mois pile est ok, en dessous non`, () => {
    const juste = byId(
      input({
        allocations: { liquidites: 9_000 },
        depensesMensuelles: 3_000,
      }),
      "coussin",
    );
    expect(juste.ok).toBe(true);

    const sous = byId(
      input({
        allocations: { liquidites: 5_000 },
        depensesMensuelles: 3_000,
      }),
      "coussin",
    );
    expect(sous.ok).toBe(false);
  });

  it("horizon court + forte exposition volatile = tension ; horizon long = ok", () => {
    const crypto = { allocations: { crypto: 100_000 as number } };
    expect(byId(input({ ...crypto, horizon: "court" }), "horizon_risque").ok).toBe(
      false,
    );
    expect(byId(input({ ...crypto, horizon: "long" }), "horizon_risque").ok).toBe(
      false, // 100 % volatil dépasse aussi le repère « long » (80 %)
    );
    expect(
      byId(
        input({
          allocations: { crypto: 50_000, livrets_fonds_euros: 50_000 },
          horizon: "long",
        }),
        "horizon_risque",
      ).ok,
    ).toBe(true);
  });

  it("chaque verdict porte un message lisible", () => {
    const verdicts = assessMetrics(computeMetrics(SEED_PATRIMOINE));
    for (const r of verdicts) {
      expect(r.message.length).toBeGreaterThan(10);
    }
  });
});
