"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { formatEuro, formatPct } from "@/lib/format";
import type { Metrics } from "@/lib/types";

// Palette sobre, registre finance (bleus + neutres + un accent).
const COLORS = [
  "#1d4ed8",
  "#3b82f6",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#64748b",
  "#94a3b8",
];

export function AllocationDonut({ metrics }: { metrics: Metrics }) {
  const data = metrics.repartition
    .filter((r) => r.montant > 0)
    .map((r) => ({ name: r.label, value: r.montant, pct: r.pct }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400">
        Renseignez vos actifs pour visualiser l'allocation.
      </div>
    );
  }

  return (
    <div className="h-72 w-full" aria-label="Répartition de l'allocation patrimoniale">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={1.5}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, _name, entry) => [
              `${formatEuro(value)} · ${formatPct(
                (entry?.payload as { pct: number }).pct,
              )}`,
              (entry?.payload as { name: string }).name,
            ]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
