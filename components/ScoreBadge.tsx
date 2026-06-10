"use client";

import { useEffect, useState } from "react";

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

const ANIMATION_MS = 900;

/** Compte de 0 au score à l'apparition (sauf préférence reduced-motion). */
function useCountUp(target: number): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ANIMATION_MS);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubique
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return value;
}

export function ScoreBadge({ score }: { score: number }) {
  const displayed = useCountUp(score);
  // Couleur et libellé suivent la valeur affichée : la carte « traverse »
  // les bandes pendant la montée, puis se stabilise sur le verdict final.
  const { label, classes, bar } = band(displayed);

  return (
    <div className={clsx("rounded-xl border p-5 transition-colors", classes)}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium uppercase tracking-wide">
          Score de robustesse
        </span>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-bold tabular-nums">{displayed}</span>
        <span className="text-lg font-medium opacity-70">/ 100</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/60">
        <div
          className={clsx("h-full rounded-full transition-all", bar)}
          style={{ width: `${Math.max(0, Math.min(100, displayed))}%` }}
        />
      </div>
      <p className="mt-2 text-xs opacity-80">
        Capacité à encaisser un choc (perte de revenu, marché baissier, besoin
        de cash) sans casse majeure.
      </p>
    </div>
  );
}
