import { clsx } from "@/lib/clsx";

/** Renvoie une bande de couleur + libellé selon le score de robustesse. */
function band(score: number): { label: string; classes: string; bar: string } {
  if (score >= 75) {
    return {
      label: "Robuste",
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
      bar: "bg-emerald-500",
    };
  }
  if (score >= 50) {
    return {
      label: "Correct",
      classes: "bg-amber-50 text-amber-700 border-amber-200",
      bar: "bg-amber-500",
    };
  }
  if (score >= 30) {
    return {
      label: "Fragile",
      classes: "bg-orange-50 text-orange-700 border-orange-200",
      bar: "bg-orange-500",
    };
  }
  return {
    label: "À consolider",
    classes: "bg-red-50 text-red-700 border-red-200",
    bar: "bg-red-500",
  };
}

export function ScoreBadge({ score }: { score: number }) {
  const { label, classes, bar } = band(score);
  return (
    <div className={clsx("rounded-xl border p-5", classes)}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium uppercase tracking-wide">
          Score de robustesse
        </span>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-bold tabular-nums">{score}</span>
        <span className="text-lg font-medium opacity-70">/ 100</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/60">
        <div
          className={clsx("h-full rounded-full transition-all", bar)}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
      <p className="mt-2 text-xs opacity-80">
        Capacité à encaisser un choc (perte de revenu, marché baissier, besoin
        de cash) sans casse majeure.
      </p>
    </div>
  );
}
