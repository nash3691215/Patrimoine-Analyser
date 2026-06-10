/**
 * Rend visible l'invariant central de l'app : la frontière déterministe / IA.
 * Bloc statique (server component), pensé pour un public éducation financière :
 * dire précisément ce que l'IA fait, et surtout ce qu'elle ne fait pas.
 */

const REPO_METRICS_URL =
  "https://github.com/nash3691215/Patrimoine-Analyser/blob/main/lib/metrics.ts";

const STEPS = [
  {
    step: "1",
    title: "Vos chiffres : du code, pas de l'IA",
    body: "Part liquide, concentration, poids immobilier, coussin de liquidité : chaque métrique est calculée par des fonctions déterministes — mêmes entrées, mêmes résultats, vérifiables ligne par ligne dans le code ouvert.",
  },
  {
    step: "2",
    title: "L'IA n'invente aucun chiffre",
    body: "Le modèle reçoit uniquement ces métriques déjà calculées. Son rôle : les interpréter et enseigner les principes (concentration, liquidité, horizon). Il ne calcule jamais, et n'a accès à rien d'autre.",
  },
  {
    step: "3",
    title: "Une sortie sous contrat",
    body: "Sa réponse doit respecter un schéma JSON strict, validé côté serveur. Non conforme ? Elle est rejetée et régénérée — jamais affichée telle quelle. Le score et les vigilances que vous lisez ont passé ce contrôle.",
  },
] as const;

export function TrustArchitecture() {
  return (
    <section
      aria-labelledby="fiabilite-titre"
      className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
    >
      <h2
        id="fiabilite-titre"
        className="text-sm font-semibold uppercase tracking-wide text-slate-500"
      >
        Pourquoi cette analyse est fiable
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        L'architecture sépare strictement ce qui se <em>calcule</em> de ce qui
        s'<em>interprète</em>.
      </p>

      <ol className="mt-5 grid gap-4 lg:grid-cols-3">
        {STEPS.map((s) => (
          <li
            key={s.step}
            className="relative rounded-xl border border-slate-200 bg-white p-5"
          >
            <span
              aria-hidden
              className="absolute -top-3 left-5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
            >
              {s.step}
            </span>
            <h3 className="mt-1 font-semibold text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {s.body}
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs text-slate-500">
        La clé API et la grille d'analyse restent côté serveur ; l'historique
        des comptes est isolé par Row Level Security.{" "}
        <a
          href={REPO_METRICS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent hover:underline"
        >
          Voir le calcul des métriques sur GitHub →
        </a>
      </p>
    </section>
  );
}
