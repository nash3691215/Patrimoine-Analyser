/** Helpers de formatage partagés (client & serveur). */

export const formatEuro = (n: number): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export const formatPct = (n: number): string =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n)} %`;

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
