export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import BonsLivraisonClient from './BonsLivraisonClient'
export const metadata = { title: 'Bons de livraison — Carnaval Imprim CRM' }
export default async function BonsLivraisonPage() {
  const supabase = await createClient()
  const [
    { data: productions },
    { data: clients },
    { data: entData },
  ] = await Promise.all([
    supabase.from('productions').select('id, caracteristique, format, quantite, date, statut, client_id, clients(nom, adresse, telephone)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nom, adresse, telephone').order('nom'),
    supabase.from('entreprise').select('nom, siege, tel, rc, ncc').single(),
  ])
  const ent = entData as Record<string,string>|null
  return <BonsLivraisonClient productions={productions||[]} clients={clients||[]} entreprise={ent} />
}
