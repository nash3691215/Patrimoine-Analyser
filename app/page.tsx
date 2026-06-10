import { RadiographieTool } from "@/components/RadiographieTool";
import { Disclaimer } from "@/components/Disclaimer";
import { SiteHeader } from "@/components/SiteHeader";
import { TrustArchitecture } from "@/components/TrustArchitecture";
import { getOptionalUser } from "@/lib/auth";

// Page dynamique : l'état de connexion dépend des cookies de la requête.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getOptionalUser();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader userEmail={user?.email ?? null} />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Radiographiez l'allocation de votre patrimoine
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Saisissez votre répartition. L'outil calcule des métriques
              objectives — part liquide, concentration, poids immobilier,
              coussin de liquidité — puis en propose une lecture pédagogique
              pour identifier vos angles morts. Démonstration pré-remplie : vous
              pouvez lancer l'analyse sans rien saisir ni créer de compte.
            </p>
          </div>

          <div className="mt-8">
            <RadiographieTool isAuthenticated={Boolean(user)} />
          </div>

          <div className="mt-10">
            <TrustArchitecture />
          </div>
        </section>
      </main>

      <Disclaimer />
    </div>
  );
}
