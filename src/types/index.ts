// ── Types métier Carnaval Imprim CRM ───────────────────────────

export type Role = 'Admin' | 'Commercial' | 'Production' | 'Comptabilité'

export type TypeClient = 'Entreprise' | 'Institution' | 'ONG' | 'Particulier'

export type TemplateFne = 'B2B' | 'B2G' | 'B2C' | 'B2F'

export type StatutDevis = 'Brouillon' | 'Envoyé' | 'Accepté' | 'Refusé'

export type StatutProduction = 'En attente' | 'En production' | 'Terminé' | 'Livré'

export type StatutBonCommande = 'En cours' | 'Reçu' | 'Annulé'

export type ModePayment =
  | 'cash'
  | 'mobile-money'
  | 'wave'
  | 'cheque'
  | 'virement'
  | 'carte'

export type CategorieProduiit =
  | 'Supports imprimés'
  | 'Grand format'
  | 'Textile'
  | 'Objets pub'
  | 'Service'

// ── Ligne de document (devis / facture) ────────────────────────
export interface LigneDocument {
  id?: string
  designation: string
  qte: number
  pu: number
  remise_ligne?: number
  produit_id?: string
  ordre?: number
  // FNE
  taxes?: string[]
  measurement_unit?: string
  reference_article?: string
}

// ── Totaux calculés ────────────────────────────────────────────
export interface Totaux {
  sousTotal: number
  remise: number
  baseHT: number
  tva: number
  ttc: number
}

// ── Navigation sidebar ─────────────────────────────────────────
export interface NavItem {
  id: string
  label: string
  href: string
  icon: string
  roles?: Role[]
}
