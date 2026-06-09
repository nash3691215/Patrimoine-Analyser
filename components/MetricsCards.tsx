import { formatEuro, formatPct } from "@/lib/format";
import type { Metrics } from "@/lib/types";

function Card({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "neutral" | "warn" | "good";
}) {
  const toneClasses =
    tone === "warn"
      ? "border-amber-200 bg-amber-50"
      : tone === "good"
        ? "border-emerald-200 bg-emerald-50"
        : "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

export function MetricsCards({ metrics }: { metrics: Metrics }) {
  // Repères pédagogiques pour colorer les cartes (sans imposer de cible).
  const coussinTone =
    metrics.coussinMois === null
      ? "neutral"
      : metrics.coussinMois >= 3 && metrics.coussinMois <= 6
        ? "good"
        : "warn";

  const concentrationTone = metrics.concentration.pct > 50 ? "warn" : "neutral";
  const immoTone = metrics.poidsImmoPct > 60 ? "warn" : "neutral";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <Card
        label="Patrimoine brut"
        value={formatEuro(metrics.total)}
        helper="Somme des classes d'actifs renseignées"
      />
      <Card
        label="Part liquide"
        value={formatPct(metrics.partLiquidePct)}
        helper="Cash & quasi-cash (livrets, liquidités)"
      />
      <Card
        label="Concentration max"
        value={formatPct(metrics.concentration.pct)}
        helper={metrics.concentration.label}
        tone={concentrationTone}
      />
      <Card
        label="Poids immobilier"
        value={formatPct(metrics.poidsImmoPct)}
        helper="Résidence + locatif"
        tone={immoTone}
      />
      <Card
        label="Coussin de liquidité"
        value={
          metrics.coussinMois === null
            ? "—"
            : `${metrics.coussinMois} mois`
        }
        helper="Repère : 3 à 6 mois de dépenses"
        tone={coussinTone}
      />
      <Card
        label="Actifs volatils"
        value={formatPct(metrics.partVolatilePct)}
        helper="Actions, ETF, crypto"
      />
    </div>
  );
}
