"use client";

import { useState } from "react";

import { AllocationDonut } from "./AllocationDonut";
import { AnalysisResult } from "./AnalysisResult";
import { MetricsCards } from "./MetricsCards";
import { PatrimoineForm } from "./PatrimoineForm";
import { SaveAnalysisButton } from "./SaveAnalysisButton";
import { assessMetrics, computeMetrics } from "@/lib/metrics";
import { parsePartialAnalysis, type PartialAnalysis } from "@/lib/partial-json";
import { SEED_PATRIMOINE } from "@/lib/seed";
import DEMO_ANALYSIS from "@/lib/demo-analysis.json";
import type { Analysis } from "@/lib/schema";
import type { Metrics, PatrimoineInput } from "@/lib/types";

const EMPTY: PatrimoineInput = {
  allocations: {
    immo_residence: 0,
    immo_locatif: 0,
    actions_etf: 0,
    livrets_fonds_euros: 0,
    crypto: 0,
    liquidites: 0,
    autres: 0,
  },
  depensesMensuelles: 0,
  horizon: "moyen",
};

interface ApiResult {
  metrics: Metrics;
  analysis: Analysis;
}

/**
 * Radiographie du profil de démonstration, générée une fois par le même
 * pipeline (métriques en code → Claude → validation Zod) puis figée : la
 * valeur de l'outil est visible à l'ouverture, en <1 s, sans appel API.
 */
const DEMO_RESULT: ApiResult = {
  metrics: computeMetrics(SEED_PATRIMOINE),
  analysis: DEMO_ANALYSIS as Analysis,
};

export function RadiographieTool({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  // Pré-rempli avec le profil de démo : la valeur est visible immédiatement.
  const [input, setInput] = useState<PatrimoineInput>(SEED_PATRIMOINE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(DEMO_RESULT);
  // L'analyse affichée est-elle l'exemple pré-calculé ?
  const [isDemo, setIsDemo] = useState(true);
  // La saisie a-t-elle changé depuis l'analyse affichée ?
  const [stale, setStale] = useState(false);
  // Aperçu partiel pendant le streaming (remplacé par l'objet validé à la fin).
  const [preview, setPreview] = useState<PartialAnalysis | null>(null);

  // Aperçu des métriques en direct (calcul déterministe, côté client),
  // avant même de solliciter l'IA.
  const livePreview = computeMetrics(input);
  // Verdicts de la grille pédagogique, recalculés à chaque frappe (sans IA).
  const reperes = assessMetrics(livePreview);
  const reperesEvaluables = reperes.filter((r) => r.ok !== null);
  const reperesAuVert = reperesEvaluables.filter((r) => r.ok).length;

  const updateInput = (next: PatrimoineInput) => {
    setInput(next);
    if (result) setStale(true);
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      // Erreurs de saisie : réponse JSON classique, avant ouverture du flux.
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Une erreur est survenue.");
        return;
      }

      // Flux NDJSON : metrics → delta… → done | error.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let rawText = "";
      let metrics: Metrics | null = null;
      let finished = false;

      const handleLine = (line: string) => {
        if (!line.trim()) return;
        let event: { type?: string; [k: string]: unknown };
        try {
          event = JSON.parse(line);
        } catch {
          return; // ligne corrompue : on attend la suivante
        }
        if (event.type === "metrics") {
          metrics = event.metrics as Metrics;
        } else if (event.type === "delta") {
          rawText += event.text as string;
          const partial = parsePartialAnalysis(rawText);
          if (partial) setPreview(partial);
        } else if (event.type === "done") {
          setResult({
            metrics: metrics ?? livePreview,
            analysis: event.analysis as Analysis,
          });
          setIsDemo(false);
          setStale(false);
          setPreview(null);
          finished = true;
        } else if (event.type === "error") {
          setError(event.error as string);
          setPreview(null);
          finished = true;
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          handleLine(buffer.slice(0, nl));
          buffer = buffer.slice(nl + 1);
        }
      }
      handleLine(buffer);

      if (!finished) {
        setError("La connexion a été interrompue. Réessayez.");
        setPreview(null);
      }
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setInput(EMPTY);
    setResult(null);
    setIsDemo(false);
    setStale(false);
    setError(null);
    setPreview(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      {/* Colonne saisie */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PatrimoineForm
          value={input}
          onChange={updateInput}
          onSubmit={runAnalysis}
          onReset={reset}
          loading={loading}
        />
      </div>

      {/* Colonne visualisation + analyse */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Allocation
            </h2>
            {reperesEvaluables.length > 0 && (
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold tabular-nums transition-colors ${
                  reperesAuVert === reperesEvaluables.length
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
                title="Coussin de liquidité, concentration, poids immobilier, adéquation horizon/risque — évalués en code, en direct."
              >
                Repères objectifs : {reperesAuVert}/{reperesEvaluables.length} au
                vert
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Calculé en code à chaque modification — l'IA n'intervient pas ici.
            Modifiez un montant pour voir les repères réagir.
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <AllocationDonut metrics={livePreview} />
            <div className="self-center">
              <MetricsCards metrics={livePreview} />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Génération en cours : aperçu progressif dès les premiers mots. */}
        {loading &&
          (preview ? (
            <AnalysisResult analysis={preview} streaming />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-accent" />
              Connexion au modèle…
            </div>
          ))}

        {!loading && result && (
          <div className="space-y-4">
            {isDemo && (
              <p className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-slate-600">
                <span className="font-semibold text-accent">Exemple.</span>{" "}
                Radiographie pré-calculée d'un profil patrimonial français
                typique. Ajustez les montants à votre situation puis relancez
                pour obtenir votre propre lecture.
              </p>
            )}
            {stale && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Les chiffres ont changé depuis cette analyse. Cliquez sur «
                Lancer la radiographie » pour la mettre à jour.
              </p>
            )}
            <AnalysisResult analysis={result.analysis} />
            {!isDemo &&
              (isAuthenticated ? (
                <SaveAnalysisButton
                  input={input}
                  metrics={result.metrics}
                  analysis={result.analysis}
                />
              ) : (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Mode invité : cette radiographie n'est pas enregistrée.{" "}
                  <a
                    href="/login"
                    className="font-medium text-accent hover:underline"
                  >
                    Connectez-vous
                  </a>{" "}
                  pour conserver votre historique et comparer dans le temps.
                </p>
              ))}
          </div>
        )}

        {!result && !loading && !error && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center text-sm text-slate-500">
            Les chiffres ci-dessus sont calculés en direct. Lancez la
            radiographie pour obtenir la lecture pédagogique et le score de
            robustesse.
          </div>
        )}
      </div>
    </div>
  );
}
