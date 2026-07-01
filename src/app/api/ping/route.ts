import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Route appelée par un cron externe (ex: cron-job.org) toutes les 5 jours
// pour éviter la mise en pause automatique du projet Supabase Free
export async function GET() {
  try {
    const supabase = await createClient()
    // Requête légère — juste un ping sur la table entreprise
    const { error } = await supabase
      .from('entreprise')
      .select('id')
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Supabase ping OK — projet actif',
    })
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: String(err) },
      { status: 500 }
    )
  }
}
