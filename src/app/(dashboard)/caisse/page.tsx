export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import CaisseClient from './CaisseClient'
export const metadata = { title: 'Caisse — Carnaval Imprim CRM' }
export default async function CaissePage() {
  const supabase = await createClient()
  const [
    { data: operations },
    { data: ouvertures },
    { data: factures },
    { data: depenses },
    { data: entData },
  ] = await Promise.all([
    supabase.from('caisse_operations').select('*, factures(numero, clients(nom)), depenses(libelle)').order('date', { ascending: false }).order('heure', { ascending: false }),
    supabase.from('caisse_ouvertures').select('*').order('date', { ascending: false }),
    supabase.from('factures').select('id, numero, clients(nom)').order('created_at', { ascending: false }).limit(100),
    supabase.from('depenses').select('id, libelle, date').order('date', { ascending: false }).limit(100),
    supabase.from('entreprise').select('nom, ncc, rc, siege, tel').single(),
  ])
  const ent = entData as Record<string,string> | null
  return <CaisseClient operations={operations||[]} ouvertures={ouvertures||[]} factures={factures||[]} depenses={depenses||[]} entreprise={ent} />
}
