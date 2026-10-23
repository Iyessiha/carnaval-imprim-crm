import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Formatage monétaire FCFA ────────────────────────────────────
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

// ── Formatage date française ────────────────────────────────────
export function formatDateFR(dateStr: string | null): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// ── Calcul des totaux d'un document ────────────────────────────
export function calculerTotaux(
  lignes: { qte: number; pu: number; remise_ligne?: number }[],
  remise: number,
  tauxTva: number,
  tvaApplicable: boolean
) {
  const sousTotal = lignes.reduce(
    (s, l) => s + l.qte * l.pu - (l.remise_ligne || 0),
    0
  )
  const baseHT = Math.max(0, sousTotal - remise)
  const tva = tvaApplicable ? Math.round(baseHT * (tauxTva / 100)) : 0
  return { sousTotal, remise, baseHT, tva, ttc: baseHT + tva }
}

// ── Statut de paiement d'une facture ───────────────────────────
export function statutPaiement(ttc: number, montantPaye: number): 'Impayée' | 'Partiel' | 'Payée' {
  if (montantPaye <= 0) return 'Impayée'
  if (montantPaye >= ttc) return 'Payée'
  return 'Partiel'
}

// ── Couleurs des statuts ────────────────────────────────────────
export const STATUT_COLORS: Record<string, string> = {
  'Brouillon':     'bg-gray-100 text-gray-600',
  'Envoyé':        'bg-blue-100 text-blue-700',
  'Accepté':       'bg-green-100 text-green-700',
  'Refusé':        'bg-red-100 text-red-700',
  'En attente':    'bg-orange-100 text-orange-700',
  'En production': 'bg-blue-100 text-blue-700',
  'Terminé':       'bg-purple-100 text-purple-700',
  'Livré':         'bg-green-100 text-green-700',
  'Impayée':       'bg-red-100 text-red-700',
  'Partiel':       'bg-orange-100 text-orange-700',
  'Payée':         'bg-green-100 text-green-700',
  'Certifiée':     'bg-green-100 text-green-700',
  'Non certifiée': 'bg-gray-100 text-gray-600',
}

// ── Date du jour ISO ────────────────────────────────────────────
// Date du jour (AAAA-MM-JJ) en heure locale : toISOString() donnerait la date UTC, décalée la nuit.
export const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ── Année et mois d'une date ISO « AAAA-MM-JJ » ─────────────────
// `new Date('2026-03-01')` est lu en UTC : selon le fuseau du navigateur, la date peut
// basculer sur le mois précédent. On découpe la chaîne à la place. mois : 0 = janvier.
export function moisDe(dateIso: string | null | undefined): { annee: number; mois: number } {
  const [annee, mois] = (dateIso || '').slice(0, 10).split('-').map(Number)
  return { annee: annee || 0, mois: (mois || 1) - 1 }
}

// ── Signe d'un document : un avoir (note de crédit) se soustrait du chiffre d'affaires ──
export const signeDocument = (f: { is_avoir?: boolean | null }) => (f.is_avoir ? -1 : 1)
