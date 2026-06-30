// ── Types FNE / DGI Côte d'Ivoire ──────────────────────────────
export type FneTemplate = 'B2B' | 'B2G' | 'B2C' | 'B2F'
export type FnePaymentMethod =
  | 'cash'
  | 'mobile-money'
  | 'wave'
  | 'cheque'
  | 'virement'
  | 'carte'

export interface FneItem {
  taxes: string[]           // ['TVA'] | ['TVAB'] | ['TVAC'] | ['TVAD']
  description: string
  quantity: number
  amount: number            // Prix unitaire HT en FCFA
  discount?: number
  measurementUnit?: string  // 'pcs' | 'm2' | 'feuille' | etc.
  reference?: string
  customTaxes?: { name: string; amount: number }[]
}

export interface FneCertifyPayload {
  invoiceType: 'sale' | 'avoir'
  paymentMethod: FnePaymentMethod
  template: FneTemplate
  clientNcc?: string          // Obligatoire si B2B
  clientCompanyName: string
  clientPhone: string
  clientEmail?: string
  pointOfSale: string
  establishment: string
  items: FneItem[]
  discount?: number
  isRne: boolean
  rne?: string
}

export interface FneCertifyResponse {
  reference: string           // ex: 9606123E25000000019
  token: string               // UUID de vérification DGI
  qrCodeUrl: string           // lien vérification DGI
  balanceStickers: number     // solde stickers restants
}

// ── Appel via API Route Next.js (clé API DGI côté serveur) ─────
export async function certifierFacture(
  payload: FneCertifyPayload
): Promise<FneCertifyResponse> {
  const res = await fetch('/api/fne/certifier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`FNE Error ${res.status}: ${err}`)
  }

  return res.json()
}

// ── Mapper une facture vers le payload FNE ─────────────────────
export function mapFactureToFnePayload(
  facture: {
    template_fne: FneTemplate
    payment_method_fne: FnePaymentMethod
    is_avoir: boolean
    lignes: {
      designation: string
      qte: number
      pu: number
      taxes: string[]
      measurement_unit?: string
      reference_article?: string
    }[]
    remise?: number
  },
  client: {
    nom: string
    telephone?: string
    email?: string
    ncc?: string
  },
  entreprise: {
    fne_point_of_sale: string
    fne_establishment: string
    ncc: string
  }
): FneCertifyPayload {
  return {
    invoiceType: facture.is_avoir ? 'avoir' : 'sale',
    paymentMethod: facture.payment_method_fne,
    template: facture.template_fne,
    clientNcc: facture.template_fne === 'B2B' ? client.ncc : undefined,
    clientCompanyName: client.nom,
    clientPhone: client.telephone || '',
    clientEmail: client.email,
    pointOfSale: entreprise.fne_point_of_sale,
    establishment: entreprise.fne_establishment,
    items: facture.lignes.map((l) => ({
      taxes: l.taxes || ['TVA'],
      description: l.designation,
      quantity: l.qte,
      amount: l.pu,
      measurementUnit: l.measurement_unit || 'pcs',
      reference: l.reference_article,
    })),
    discount: facture.remise || 0,
    isRne: false,
  }
}
