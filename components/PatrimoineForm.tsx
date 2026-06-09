"use client";

import {
  ASSET_CLASSES,
  HORIZON_OPTIONS,
  type AssetClassId,
  type Horizon,
  type PatrimoineInput,
} from "@/lib/types";
import { formatEuro } from "@/lib/format";

interface Props {
  value: PatrimoineInput;
  onChange: (next: PatrimoineInput) => void;
  onSubmit: () => void;
  onReset: () => void;
  loading: boolean;
}

export function PatrimoineForm({
  value,
  onChange,
  onSubmit,
  onReset,
  loading,
}: Props) {
  const total = ASSET_CLASSES.reduce(
    (sum, c) => sum + (value.allocations[c.id] || 0),
    0,
  );

  const setAllocation = (id: AssetClassId, raw: string) => {
    const n = raw === "" ? 0 : Math.max(0, Number(raw));
    onChange({
      ...value,
      allocations: { ...value.allocations, [id]: Number.isFinite(n) ? n : 0 },
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      <fieldset className="space-y-3" disabled={loading}>
        <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Répartition par classe d'actifs
        </legend>
        <div className="space-y-3">
          {ASSET_CLASSES.map((c) => (
            <div key={c.id}>
              <label
                htmlFor={`alloc-${c.id}`}
                className="flex items-baseline justify-between"
              >
                <span className="text-sm font-medium text-ink">{c.label}</span>
              </label>
              <div className="mt-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id={`alloc-${c.id}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1000}
                    value={value.allocations[c.id] || ""}
                    onChange={(e) => setAllocation(c.id, e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm tabular-nums outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    €
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-400">{c.hint}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm">
          <span className="font-medium text-slate-600">Total patrimoine</span>
          <span className="font-semibold tabular-nums text-ink">
            {formatEuro(total)}
          </span>
        </div>
      </fieldset>

      <fieldset className="space-y-4" disabled={loading}>
        <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Contexte
        </legend>

        <div>
          <label
            htmlFor="depenses"
            className="text-sm font-medium text-ink"
          >
            Dépenses mensuelles
          </label>
          <div className="relative mt-1">
            <input
              id="depenses"
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              value={value.depensesMensuelles || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  depensesMensuelles:
                    e.target.value === ""
                      ? 0
                      : Math.max(0, Number(e.target.value)),
                })
              }
              placeholder="0"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm tabular-nums outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              €
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Sert à calculer votre coussin de liquidité (en mois couverts).
          </p>
        </div>

        <div>
          <span className="text-sm font-medium text-ink">
            Horizon d'investissement
          </span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {HORIZON_OPTIONS.map((opt) => {
              const active = value.horizon === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onChange({ ...value, horizon: opt.id as Horizon })
                  }
                  className={
                    "rounded-lg border px-3 py-2 text-left text-sm transition " +
                    (active
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-slate-300 bg-white text-slate-600 hover:border-slate-400")
                  }
                  aria-pressed={active}
                >
                  <span className="block font-medium">{opt.label}</span>
                  <span className="block text-xs opacity-70">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || total <= 0}
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyse en cours…" : "Lancer la radiographie"}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
        >
          Réinitialiser
        </button>
      </div>
    </form>
  );
}
