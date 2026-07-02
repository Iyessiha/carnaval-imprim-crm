export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import BonsClient from './BonsClient'
export const metadata = { title: 'Bons de commande — Carnaval Imprim CRM' }
export default async function BonsPage() {
  const supabase = await createClient()
  const [{ data: bons }, { data: fournisseurs }] = await Promise.all([
    supabase.from('bons_commande_fournisseurs').select('*, bons_commande_lignes(*), fournisseurs(nom)').order('created_at', { ascending: false }),
    supabase.from('fournisseurs').select('id, nom').order('nom'),
  ])
  return <BonsClient bons={bons||[]} fournisseurs={fournisseurs||[]} />
}
