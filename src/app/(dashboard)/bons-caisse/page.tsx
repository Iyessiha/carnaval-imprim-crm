export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import BonsCaisseClient from './BonsCaisseClient'
export const metadata = { title: 'Bons de caisse — Carnaval Imprim CRM' }
export default async function BonsCaissePage() {
  const supabase = await createClient()
  const [{ data: operations }, { data: entData }] = await Promise.all([
    supabase.from('caisse_operations')
      .select('*, factures(numero, clients(nom))')
      .order('date', { ascending: false })
      .order('heure', { ascending: false })
      .limit(200),
    supabase.from('entreprise').select('nom, siege, tel, rc, ncc').single(),
  ])
  const ent = entData as Record<string,string>|null
  return <BonsCaisseClient operations={operations||[]} entreprise={ent} />
}
