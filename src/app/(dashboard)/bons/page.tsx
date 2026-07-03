export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import BonsClient from './BonsClient'
export const metadata = { title: 'Bons de commande — Carnaval Imprim CRM' }
export default async function BonsPage() {
  const supabase = await createClient()
  const [{ data: bons }, { data: fournisseurs }, { data: entData }] = await Promise.all([
    supabase.from('bons_commande_fournisseurs').select('*, bons_commande_lignes(*), fournisseurs(nom)').order('created_at', { ascending: false }),
    supabase.from('fournisseurs').select('id, nom').order('nom'),
    supabase.from('entreprise').select('taux_tva').single(),
  ])
  const tauxTva = (entData as {taux_tva:number}|null)?.taux_tva ?? 18
  return <BonsClient bons={bons||[]} fournisseurs={fournisseurs||[]} tauxTva={tauxTva} />
}
