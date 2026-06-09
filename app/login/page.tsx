import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";
import { Disclaimer } from "@/components/Disclaimer";
import { SiteHeader } from "@/components/SiteHeader";
import { getOptionalUser, isSupabaseConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await getOptionalUser();
  if (user) redirect("/");

  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader userEmail={null} />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-ink">Se connecter</h1>
            <p className="mt-1 text-sm text-slate-500">
              Conservez vos radiographies et comparez votre allocation dans le
              temps.
            </p>

            <div className="mt-5">
              {configured ? (
                <LoginForm />
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  L'authentification n'est pas configurée sur cette instance.
                  L'outil reste utilisable en{" "}
                  <Link href="/" className="font-medium underline">
                    mode invité
                  </Link>
                  .
                </div>
              )}
            </div>

            {searchParams.error && (
              <p className="mt-4 text-sm text-red-600">
                Le lien de connexion a expiré ou est invalide. Réessayez.
              </p>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-slate-500">
            <Link href="/" className="font-medium text-accent hover:underline">
              ← Continuer en mode invité
            </Link>
          </p>
        </div>
      </main>

      <Disclaimer />
    </div>
  );
}
