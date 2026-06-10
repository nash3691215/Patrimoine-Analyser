import { formatEuro, formatPct } from "@/lib/format";
import { assessMetrics, type RepereStatus } from "@/lib/metrics";
import type { Metrics } from "@/lib/types";

/** Pastille de verdict d'un repère pédagogique (calculé en code, en direct). */
function ReperePill({ status }: { status: RepereStatus }) {
  if (status.ok === null) return null;
  return (
    <p
      className={`mt-2 flex items-start gap-1 text-xs leading-snug ${
        status.ok ? "text-emerald-700" : "text-amber-700"
      }`}
    >
      <span aria-hidden className="mt-px">
        {status.ok ? "✓" : "⚠"}
      </span>
      <span>{status.message}</span>
    </p>
  );
}

function Card({
  label,
  value,
  helper,
  status,
}: {
  label: string;
  value: string;
  helper: string;
  status?: RepereStatus;
}) {
  const toneClasses =
    status?.ok === false
      ? "border-amber-200 bg-amber-50"
      : status?.ok === true
        ? "border-emerald-200 bg-emerald-50/60"
        : "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border p-4 transition-colors ${toneClasses}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
      {status && <ReperePill status={status} />}
    </div>
  );
}

export function MetricsCards({ metrics }: { metrics: Metrics }) {
  // Verdicts de la grille pédagogique — recalculés à chaque modification.
  const reperes = assessMetrics(metrics);
  const byId = (id: RepereStatus["id"]) =>
    reperes.find((r) => r.id === id);

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
        status={byId("concentration")}
      />
      <Card
        label="Poids immobilier"
        value={formatPct(metrics.poidsImmoPct)}
        helper="Résidence + locatif"
        status={byId("immobilier")}
      />
      <Card
        label="Coussin de liquidité"
        value={
          metrics.coussinMois === null
            ? "—"
            : `${metrics.coussinMois} mois`
        }
        helper="Repère : 3 à 6 mois de dépenses"
        status={byId("coussin")}
      />
      <Card
        label="Actifs volatils"
        value={formatPct(metrics.partVolatilePct)}
        helper="Actions, ETF, crypto"
        status={byId("horizon_risque")}
      />
    </div>
  );
}
