import type { Analysis } from "@/lib/schema";
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

export function AnalysisResult({ analysis }: { analysis: Analysis }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Section title="Synthèse">
          <p className="text-sm leading-relaxed text-ink">{analysis.synthese}</p>
        </Section>
        <ScoreBadge score={analysis.score_robustesse} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Forces">
          <ul className="space-y-2">
            {analysis.forces.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink">
                <span aria-hidden className="mt-0.5 text-emerald-600">
                  ✓
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Pistes de réflexion">
          <ul className="space-y-2">
            {analysis.pistes.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink">
                <span aria-hidden className="mt-0.5 text-accent">
                  →
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Points de vigilance">
        <ul className="space-y-4">
          {analysis.vigilances.map((v, i) => (
            <li
              key={i}
              className="rounded-lg border border-slate-100 bg-slate-50 p-4"
            >
              <p className="font-semibold text-ink">{v.titre}</p>
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-medium text-slate-700">Le principe — </span>
                {v.principe}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-medium text-slate-700">
                  Dans votre cas —{" "}
                </span>
                {v.detail}
              </p>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
