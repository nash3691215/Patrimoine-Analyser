"use client";

import { useState } from "react";

import { AllocationDonut } from "./AllocationDonut";
import { AnalysisResult } from "./AnalysisResult";
import { MetricsCards } from "./MetricsCards";
import { PatrimoineForm } from "./PatrimoineForm";
import { SaveAnalysisButton } from "./SaveAnalysisButton";
import { computeMetrics } from "@/lib/metrics";
import { SEED_PATRIMOINE } from "@/lib/seed";
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

export function RadiographieTool({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  // Pré-rempli avec le profil de démo : la valeur est visible immédiatement.
  const [input, setInput] = useState<PatrimoineInput>(SEED_PATRIMOINE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);

  // Aperçu des métriques en direct (calcul déterministe, côté client),
  // avant même de solliciter l'IA.
  const livePreview = computeMetrics(input);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Une erreur est survenue.");
        setResult(null);
        return;
      }
      setResult({ metrics: data.metrics, analysis: data.analysis });
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setInput(EMPTY);
    setResult(null);
    setError(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      {/* Colonne saisie */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PatrimoineForm
          value={input}
          onChange={setInput}
          onSubmit={runAnalysis}
          onReset={reset}
          loading={loading}
        />
      </div>

      {/* Colonne visualisation + analyse */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Allocation
          </h2>
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

        {loading && !result && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-accent" />
            Lecture pédagogique en cours de génération…
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <AnalysisResult analysis={result.analysis} />
            {isAuthenticated ? (
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
            )}
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
