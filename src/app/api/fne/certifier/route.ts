import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { chargerSession } from '@/lib/acces-serveur'
import { peutAcceder } from '@/lib/acces'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Contenu exigé par la DGI. Tout ce qui ne correspond pas est refusé avant d'appeler FNE.
const schemaFacture = z.object({
  invoiceType: z.enum(['sale', 'avoir']),
  paymentMethod: z.enum(['cash', 'mobile-money', 'wave', 'cheque', 'virement', 'carte']),
  template: z.enum(['B2B', 'B2G', 'B2C', 'B2F']),
  clientNcc: z.string().optional(),
  clientCompanyName: z.string().min(1, 'Nom du client obligatoire'),
  clientPhone: z.string().optional().default(''),
  clientEmail: z.string().optional(),
  pointOfSale: z.string().min(1),
  establishment: z.string().min(1),
  items: z.array(z.object({
    taxes: z.array(z.string()).min(1),
    description: z.string().min(1),
    quantity: z.number().positive(),
    amount: z.number().min(0),
    discount: z.number().min(0).optional(),
    measurementUnit: z.string().optional(),
    reference: z.string().optional(),
  })).min(1, 'Au moins une ligne est obligatoire'),
  discount: z.number().min(0).optional(),
  isRne: z.boolean(),
  rne: z.string().optional(),
}).superRefine((f, ctx) => {
  if (f.template === 'B2B' && !f.clientNcc) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['clientNcc'], message: 'Le NCC du client est obligatoire pour une facture B2B' })
  }
})

/** Configuration FNE : base de données d'abord (saisie dans Paramètres), variables d'environnement en secours. */
async function configurationFne() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('fne_config')
    .select('api_key, url_test, url_prod, mode')
    .limit(1)
    .maybeSingle()

  const config = data as { api_key: string | null; url_test: string | null; url_prod: string | null; mode: string } | null
  const mode = config?.mode === 'production' ? 'production' : 'test'
  const apiKey = config?.api_key || process.env.FNE_API_KEY || ''
  const url = mode === 'production'
    ? (config?.url_prod || process.env.FNE_URL_PROD || '')
    : (config?.url_test || process.env.FNE_URL_TEST || '')

  return { apiKey, url, mode }
}

export async function POST(req: NextRequest) {
  const { user, profil } = await chargerSession()
  if (!user || !profil || !profil.actif) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  if (!peutAcceder(profil, 'factures')) {
    return NextResponse.json({ error: 'Votre compte ne peut pas certifier de factures' }, { status: 403 })
  }

  let corps: unknown
  try {
    corps = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const verif = schemaFacture.safeParse(corps)
  if (!verif.success) {
    return NextResponse.json(
      { error: verif.error.issues[0]?.message || 'Données de facture invalides' },
      { status: 400 }
    )
  }

  let config
  try {
    config = await configurationFne()
  } catch (err) {
    console.error('Configuration FNE:', err)
    return NextResponse.json({ error: 'FNE non configuré — contactez l\'administrateur' }, { status: 503 })
  }
  if (!config.apiKey || !config.url) {
    return NextResponse.json({ error: 'FNE non configuré — contactez l\'administrateur' }, { status: 503 })
  }

  try {
    const response = await fetch(`${config.url}/external/invoices/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(verif.data),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('FNE API Error:', response.status, data)
      return NextResponse.json(
        { error: data.message || 'Erreur DGI FNE', details: data },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error('FNE fetch error:', err)
    return NextResponse.json(
      { error: 'Impossible de joindre le serveur DGI FNE' },
      { status: 502 }
    )
  }
}
