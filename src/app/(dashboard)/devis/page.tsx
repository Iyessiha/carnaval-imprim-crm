import { createClient } from '@/lib/supabase/server'
import DevisClient from './DevisClient'

export const metadata = { title: 'Devis — Carnaval Imprim CRM' }

export default async function DevisPage() {
  const supabase = await createClient()
  const [
    { data: devis },
    { data: clients },
    { data: produits },
    { data: entrepriseData },
  ] = await Promise.all([
    supabase.from('devis').select('*, devis_lignes(*), clients(nom)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nom, ncc, template_fne_defaut').order('nom'),
    supabase.from('produits').select('id, nom, prix_base, unite').eq('actif', true).order('nom'),
    supabase.from('entreprise').select('taux_tva').single(),
  ])
  const tva = (entrepriseData as { taux_tva: number } | null)?.taux_tva ?? 18
  return <DevisClient devis={devis || []} clients={clients || []} produits={produits || []} tauxTva={tva} />
}
