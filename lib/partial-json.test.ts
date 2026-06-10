import { describe, expect, it } from "vitest";

import { parsePartialAnalysis } from "./partial-json";

/** Une analyse complète réaliste, sérialisée comme le modèle la streame. */
const FULL = JSON.stringify({
  synthese: "Un patrimoine concentré sur l'immobilier, avec un \"biais\" français.",
  forces: ["Coussin de liquidité confortable", "Horizon long cohérent"],
  vigilances: [
    {
      titre: "Concentration immobilière",
      principe: "Un actif au-delà de 50 % devient un facteur de fragilité.",
      detail: "Votre résidence principale pèse 53,3 % du total.",
    },
  ],
  pistes: ["Renforcer progressivement la poche actions"],
  score_robustesse: 58,
});

describe("parsePartialAnalysis", () => {
  it("reconstruit l'objet complet à l'identique", () => {
    expect(parsePartialAnalysis(FULL)).toEqual(JSON.parse(FULL));
  });

  it("ne lève jamais d'exception, quel que soit le point de troncature", () => {
    for (let i = 0; i <= FULL.length; i++) {
      expect(() => parsePartialAnalysis(FULL.slice(0, i))).not.toThrow();
    }
  });

  it("les aperçus sont monotones : jamais de champ qui régresse", () => {
    let lastSynthese = "";
    for (let i = 0; i <= FULL.length; i++) {
      const p = parsePartialAnalysis(FULL.slice(0, i));
      if (p?.synthese) {
        expect(p.synthese.startsWith(lastSynthese)).toBe(true);
        lastSynthese = p.synthese;
      }
    }
    expect(lastSynthese).toBe(JSON.parse(FULL).synthese);
  });

  it("troncature au milieu d'une chaîne : garde le préfixe sûr", () => {
    const cut = FULL.indexOf("français") + 4; // au milieu d'un mot
    const p = parsePartialAnalysis(FULL.slice(0, cut));
    // La synthèse en cours n'est pas encore close : on n'affiche que le complet.
    expect(p).toBeNull();
  });

  it("troncature au milieu d'une clé : n'expose pas la clé orpheline", () => {
    const cut = FULL.indexOf('"forces"') + 4;
    const p = parsePartialAnalysis(FULL.slice(0, cut));
    expect(p).not.toBeNull();
    expect(p!.synthese).toBe(JSON.parse(FULL).synthese);
    expect(p!.forces).toBeUndefined();
  });

  it("troncature au milieu d'un nombre : le score n'apparaît pas à moitié", () => {
    const cut = FULL.indexOf("58") + 1; // "5" seulement
    const p = parsePartialAnalysis(FULL.slice(0, cut));
    expect(p?.score_robustesse).toBeUndefined();
  });

  it("tolère un enrobage avant le JSON", () => {
    const p = parsePartialAnalysis("Voici l'analyse :\n" + FULL);
    expect(p?.score_robustesse).toBe(58);
  });

  it("renvoie null sur du texte sans objet", () => {
    expect(parsePartialAnalysis("")).toBeNull();
    expect(parsePartialAnalysis("pas de json ici")).toBeNull();
    expect(parsePartialAnalysis("{")).toBeNull();
  });

  it("gère les échappements dans les chaînes", () => {
    const tricky = '{"synthese": "guillemets \\" et antislash \\\\ ok", "forces": ["a"]}';
    const p = parsePartialAnalysis(tricky);
    expect(p?.synthese).toBe('guillemets " et antislash \\ ok');
  });
});
