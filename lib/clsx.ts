/** Concaténation conditionnelle de classes (mini utilitaire sans dépendance). */
export function clsx(
  ...parts: (string | false | null | undefined)[]
): string {
  return parts.filter(Boolean).join(" ");
}
