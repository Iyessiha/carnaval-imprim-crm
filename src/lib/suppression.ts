// Suppressions : messages clairs pour l'utilisateur, et contrôle que la base a bien supprimé.

/** Message lisible à partir d'une erreur Supabase lors d'une suppression. */
export function messageSuppression(erreur: { message: string; code?: string }, libelle: string): string {
  // 23503 = violation de clé étrangère : la fiche est utilisée par d'autres documents
  if (erreur.code === '23503' || /foreign key|violates foreign/i.test(erreur.message)) {
    return `${libelle} est utilisé par d'autres documents (devis, factures, productions…) : suppression impossible.`
  }
  return 'Suppression impossible : ' + erreur.message
}

/** Vrai si la base a effectivement supprimé au moins une ligne (sinon la sécurité par ligne a refusé). */
export const ligneSupprimee = (lignes: { id: string }[] | null | undefined) => !!lignes?.length
