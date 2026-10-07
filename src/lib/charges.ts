// Helpers partagés pour les charges fixes (tableau de bord + page de gestion)
export const FREQUENCES = ['mensuelle', 'trimestrielle', 'semestrielle', 'annuelle'] as const
export type Frequence = typeof FREQUENCES[number]

// Nombre de mois entre deux échéances
const MOIS: Record<string, number> = { mensuelle: 1, trimestrielle: 3, semestrielle: 6, annuelle: 12 }

export const moisParPeriode = (f: string) => MOIS[f] ?? 1

/** Montant ramené au mois (ex. 120 000 annuel → 10 000 / mois) */
export const montantMensuel = (montant: number, frequence: string) =>
  (Number(montant) || 0) / moisParPeriode(frequence)

/** Échéance suivante (YYYY-MM-DD) à partir d'une date, selon la fréquence */
export const echeanceSuivante = (date: string | null, frequence: string) => {
  const base = date ? new Date(date + 'T00:00:00') : new Date()
  const jour = base.getDate()
  const d = new Date(base.getFullYear(), base.getMonth() + moisParPeriode(frequence), 1)
  // garder le même jour du mois (31 → dernier jour du mois suivant si besoin)
  const dernier = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(jour, dernier))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
