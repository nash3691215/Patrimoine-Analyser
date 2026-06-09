import Link from "next/link";
import { redirect } from "next/navigation";

import { Disclaimer } from "@/components/Disclaimer";
import { SiteHeader } from "@/components/SiteHeader";
import { ScoreBadge } from "@/components/ScoreBadge";
import { getOptionalUser, isSupabaseConfigured } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatEuro, formatPct } from "@/lib/format";
import type { Analysis } from "@/lib/schema";
import type { Metrics, PatrimoineInput } from "@/lib/types";

export const dynamic = "force-dynamic";

interface AnalyseRow {
  id: string;
  created_at: string;
  snapshot: { input: PatrimoineInput; metrics: Metrics };
  result: Analysis;
}

export default async function HistoryPage() {
  if (!isSupabaseConfigured()) redirect("/");
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("id, created_at, snapshot, result")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as AnalyseRow[];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader userEmail={user.email ?? null} />

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Mon historique
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Vos radiographies enregistrées, de la plus récente à la plus
                ancienne. Comparez l'évolution de votre score et de votre
                allocation dans le temps.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-400"
            >
              Nouvelle radiographie
            </Link>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Impossible de charger l'historique. Vérifiez la configuration de
              la table et du RLS.
            </div>
          )}

          {!error && rows.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-10 text-center text-sm text-slate-500">
              Aucune radiographie enregistrée pour l'instant.{" "}
              <Link
                href="/"
                className="font-medium text-accent hover:underline"
              >
                Lancez votre première analyse
              </Link>
              .
            </div>
          )}

          <div className="mt-6 space-y-4">
            {rows.map((row) => {
              const m = row.snapshot.metrics;
              return (
                <article
                  key={row.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        {formatDate(row.created_at)}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-ink">
                        {formatEuro(m.total)}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {row.result.synthese}
                      </p>

                      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                        <div>
                          <dt className="text-xs text-slate-400">Liquide</dt>
                          <dd className="font-medium tabular-nums text-ink">
                            {formatPct(m.partLiquidePct)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-400">Immobilier</dt>
                          <dd className="font-medium tabular-nums text-ink">
                            {formatPct(m.poidsImmoPct)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-400">
                            Concentration
                          </dt>
                          <dd className="font-medium tabular-nums text-ink">
                            {formatPct(m.concentration.pct)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-400">Coussin</dt>
                          <dd className="font-medium tabular-nums text-ink">
                            {m.coussinMois === null
                              ? "—"
                              : `${m.coussinMois} mois`}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="self-center">
                      <ScoreBadge score={row.result.score_robustesse} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <Disclaimer />
    </div>
  );
}
