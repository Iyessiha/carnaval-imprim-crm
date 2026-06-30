import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Vérifier que l'utilisateur est authentifié
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Récupérer la config FNE (clé API reste côté serveur — jamais exposée au navigateur)
  const apiKey = process.env.FNE_API_KEY
  const url = process.env.FNE_URL_PROD || process.env.FNE_URL_TEST

  if (!apiKey || !url) {
    return NextResponse.json(
      { error: 'FNE non configuré — contactez l\'administrateur' },
      { status: 503 }
    )
  }

  const body = await req.json()

  try {
    const response = await fetch(`${url}/external/invoices/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('FNE API Error:', data)
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
