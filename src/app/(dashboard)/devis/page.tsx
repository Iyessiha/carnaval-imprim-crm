export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import DevisClient from './DevisClient'
export const metadata = { title: 'Devis — Carnaval Imprim CRM' }
export default async function DevisPage() {
  const supabase = await createClient()
  const [{ data: devis }, { data: clients }, { data: produits }, { data: entData }] = await Promise.all([
    supabase.from('devis').select('*, devis_lignes(*), clients(nom,telephone,email,adresse,ncc)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nom, ncc, template_fne_defaut, telephone, email, adresse').order('nom'),
    supabase.from('produits').select('id, nom, prix_base, unite').eq('actif', true).order('nom'),
    supabase.from('entreprise').select('nom, siege, tel, email, rc, ncc, taux_tva').single(),
  ])
  const ent = entData as { nom: string; siege: string; tel: string; email: string; rc: string; ncc: string; taux_tva: number } | null
  return <DevisClient devis={devis || []} clients={clients || []} produits={produits || []} tauxTva={ent?.taux_tva ?? 18} entreprise={ent} />
}
