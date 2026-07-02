export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import StatsClient from './StatsClient'
export const metadata = { title: 'Statistiques — Carnaval Imprim CRM' }
export default async function StatsPage() {
  const supabase = await createClient()
  const [{ data: factures }, { data: devis }, { data: productions }, { data: clients }, { data: entData }] = await Promise.all([
    supabase.from('factures').select('id, date, tva_applicable, remise, fne_certifiee, client_id, factures_lignes(qte,pu,designation), paiements(montant,date), clients(nom)'),
    supabase.from('devis').select('id, date, statut, tva_applicable, remise, devis_lignes(qte,pu), clients(nom)'),
    supabase.from('productions').select('id, date, statut, quantite, caracteristique, clients(nom)'),
    supabase.from('clients').select('id, nom, type, created_at'),
    supabase.from('entreprise').select('taux_tva').single(),
  ])
  const tva = (entData as {taux_tva:number}|null)?.taux_tva ?? 18
  return <StatsClient factures={factures||[]} devis={devis||[]} productions={productions||[]} clients={clients||[]} tauxTva={tva} />
}
