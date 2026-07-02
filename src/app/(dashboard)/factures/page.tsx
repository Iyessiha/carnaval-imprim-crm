export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import FacturesClient from './FacturesClient'
export const metadata = { title: 'Factures — Carnaval Imprim CRM' }
export default async function FacturesPage() {
  const supabase = await createClient()
  const [{ data: factures }, { data: clients }, { data: produits }, { data: entData }] = await Promise.all([
    supabase.from('factures').select('*, factures_lignes(*), paiements(*), clients(nom,ncc,telephone,email,adresse)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nom, ncc, telephone, email, adresse, template_fne_defaut').order('nom'),
    supabase.from('produits').select('id, nom, prix_base, unite').eq('actif', true).order('nom'),
    supabase.from('entreprise').select('nom, forme, siege, tel, email, rc, ncc, taux_tva, fne_point_of_sale, fne_establishment').single(),
  ])
  const ent = entData as { nom: string; forme?: string; siege: string; tel: string; email: string; rc: string; ncc: string; taux_tva: number; fne_point_of_sale?: string; fne_establishment?: string } | null
  return <FacturesClient factures={factures || []} clients={clients || []} produits={produits || []} entreprise={ent} />
}
