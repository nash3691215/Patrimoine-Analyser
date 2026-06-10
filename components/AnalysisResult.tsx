import type { PartialAnalysis } from "@/lib/partial-json";
import { ScoreBadge } from "./ScoreBadge";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Carte d'attente du score pendant la génération. */
function ScoreSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="mt-3 h-10 w-20 rounded bg-slate-200" />
      <div className="mt-3 h-2 w-full rounded-full bg-slate-200" />
    </div>
  );
}

const isText = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0;

/**
 * Affiche une analyse, complète ou en cours de streaming.
 *
 * En mode `streaming`, le prop `analysis` est un aperçu partiel (JSON réparé) :
 * chaque section n'apparaît que lorsque ses premières données arrivent, et le
 * score (généré en dernier) reste en squelette jusqu'à la fin.
 */
export function AnalysisResult({
  analysis,
  streaming = false,
}: {
  analysis: PartialAnalysis;
  streaming?: boolean;
}) {
  const forces = (analysis.forces ?? []).filter(isText);
  const pistes = (analysis.pistes ?? []).filter(isText);
  const vigilances = (analysis.vigilances ?? []).filter((v) =>
    isText(v?.titre),
  );

  return (
    <div className="space-y-4" aria-busy={streaming}>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Section title="Synthèse">
          <p className="text-sm leading-relaxed text-ink">
            {analysis.synthese ?? ""}
            {streaming && (
              <span
                aria-hidden
                className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-accent/60 align-text-bottom motion-reduce:animate-none"
              />
            )}
          </p>
        </Section>
        {typeof analysis.score_robustesse === "number" ? (
          <ScoreBadge score={analysis.score_robustesse} />
        ) : (
          <ScoreSkeleton />
        )}
      </div>

      {(forces.length > 0 || pistes.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {forces.length > 0 && (
            <Section title="Forces">
              <ul className="space-y-2">
                {forces.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink">
                    <span aria-hidden className="mt-0.5 text-emerald-600">
                      ✓
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {pistes.length > 0 && (
            <Section title="Pistes de réflexion">
              <ul className="space-y-2">
                {pistes.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink">
                    <span aria-hidden className="mt-0.5 text-accent">
                      →
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}

      {vigilances.length > 0 && (
        <Section title="Points de vigilance">
          <ul className="space-y-4">
            {vigilances.map((v, i) => (
              <li
                key={i}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <p className="font-semibold text-ink">{v.titre}</p>
                {isText(v.principe) && (
                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">
                      Le principe —{" "}
                    </span>
                    {v.principe}
                  </p>
                )}
                {isText(v.detail) && (
                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">
                      Dans votre cas —{" "}
                    </span>
                    {v.detail}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
