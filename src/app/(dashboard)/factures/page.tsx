export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import FacturesClient from './FacturesClient'
export const metadata = { title: 'Factures — Carnaval Imprim CRM' }
export default async function FacturesPage() {
  const supabase = await createClient()
  const [
    { data: factures },
    { data: clients },
    { data: produits },
    { data: tarifs },
    { data: entData },
    { data: fneData },
  ] = await Promise.all([
    supabase.from('factures').select('*, factures_lignes(*), clients(nom,telephone,email,adresse,ncc), paiements(*)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nom, ncc, template_fne_defaut, telephone, email, adresse').order('nom'),
    supabase.from('produits').select('id, nom, prix_base, unite').eq('actif', true).order('nom'),
    supabase.from('tarifs_impression').select('*').eq('actif', true).order('ordre'),
    supabase.from('entreprise').select('nom, siege, tel, email, rc, ncc, taux_tva, fne_point_of_sale, fne_establishment').single(),
    supabase.from('fne_config').select('*').limit(1).maybeSingle(),
  ])
  const ent = entData as Record<string,string|number>|null
  const fne = fneData as Record<string,string>|null
  return <FacturesClient factures={factures||[]} clients={clients||[]} produits={produits||[]} tarifs={tarifs||[]} tauxTva={Number(ent?.taux_tva??18)} entreprise={ent} fneConfig={fne} />
}
