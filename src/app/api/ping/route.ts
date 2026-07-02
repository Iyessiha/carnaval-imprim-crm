import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('entreprise').select('id').limit(1)
    if (error) throw error
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Supabase actif' })
  } catch (err) {
    return NextResponse.json({ status: 'error', message: String(err) }, { status: 500 })
  }
}
