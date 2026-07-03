export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import BonsLivraisonClient from './BonsLivraisonClient'
export const metadata = { title: 'Bons de livraison — Carnaval Imprim CRM' }
export default async function LivraisonsPage() {
  const supabase = await createClient()
  const [{ data: productions }, { data: entData }] = await Promise.all([
    supabase.from('productions')
      .select('id, date, caracteristique, format, quantite, statut, numero_bl, date_livraison_reelle, date_livraison_prevue, client_id, devis_id, clients(nom, adresse, telephone), devis(numero)')
      .order('created_at', { ascending: false }),
    supabase.from('entreprise').select('nom, siege, tel, rc, ncc').single(),
  ])
  return <BonsLivraisonClient productions={productions||[]} entreprise={entData as Record<string,string>|null} />
}
