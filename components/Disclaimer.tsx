/**
 * Avertissement réglementaire, calqué sur le langage d'un acteur régulé.
 * Visible et permanent (placé en pied de chaque page).
 */
export function Disclaimer() {
  return (
    <aside
      role="note"
      className="border-t border-slate-200 bg-white/60 px-4 py-6 text-xs leading-relaxed text-slate-500"
    >
      <div className="mx-auto max-w-5xl">
        <p className="font-semibold text-slate-600">
          Avertissement — information à vocation éducative
        </p>
        <p className="mt-1">
          Cet outil fournit une analyse pédagogique destinée à vous aider à
          comprendre la structure de votre patrimoine. Il ne constitue pas un
          conseil en investissement personnalisé, lequel dépend de la situation,
          des objectifs et du profil propres à chaque investisseur. Investir
          comporte des risques, notamment de perte en capital. Les performances
          passées ne préjugent pas des performances futures.
        </p>
      </div>
    </aside>
  );
}
