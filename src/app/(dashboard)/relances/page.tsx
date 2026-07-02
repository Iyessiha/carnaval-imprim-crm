export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import RelancesClient from './RelancesClient'
export const metadata = { title: 'Relances — Carnaval Imprim CRM' }
export default async function RelancesPage() {
  const supabase = await createClient()
  const [{ data: factures }, { data: entData }] = await Promise.all([
    supabase.from('factures').select('*, factures_lignes(qte,pu), paiements(montant,date,mode), clients(nom,telephone,email,adresse)').order('date', { ascending: false }),
    supabase.from('entreprise').select('nom, siege, tel, email, rc, ncc, taux_tva').single(),
  ])
  const ent = entData as { nom:string; siege:string; tel:string; email:string; rc:string; ncc:string; taux_tva:number } | null
  return <RelancesClient factures={factures||[]} entreprise={ent} />
}
