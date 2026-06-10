import Link from "next/link";

/** En-tête commun : titre + navigation selon l'état de connexion. */
export function SiteHeader({ userEmail }: { userEmail: string | null }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
        Version bêta de démonstration — destinée à l'évaluation par un
        recruteur, données fictives.
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            R
          </span>
          <span className="text-sm font-semibold text-ink">
            Radiographie de patrimoine
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {userEmail ? (
            <>
              <Link
                href="/history"
                className="font-medium text-slate-600 hover:text-ink"
              >
                Mon historique
              </Link>
              <span className="hidden text-slate-400 sm:inline">
                {userEmail}
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="font-medium text-slate-500 hover:text-ink"
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-accent px-3 py-1.5 font-semibold text-white hover:bg-accent/90"
            >
              Se connecter
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
