import { createClient } from '@/lib/supabase/server'
import FacturesClient from './FacturesClient'

export const metadata = { title: 'Factures — Carnaval Imprim CRM' }

export default async function FacturesPage() {
  const supabase = await createClient()
  const [
    { data: factures },
    { data: clients },
    { data: produits },
    { data: entrepriseData },
  ] = await Promise.all([
    supabase.from('factures').select('*, factures_lignes(*), paiements(*), clients(nom, ncc, telephone, email)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nom, ncc, telephone, email, template_fne_defaut').order('nom'),
    supabase.from('produits').select('id, nom, prix_base, unite').eq('actif', true).order('nom'),
    supabase.from('entreprise').select('nom, taux_tva, rc, ncc, siege, tel, fne_point_of_sale, fne_establishment').single(),
  ])
  const entreprise = entrepriseData as { nom: string; taux_tva: number; rc?: string; ncc?: string; siege?: string; tel?: string; fne_point_of_sale?: string; fne_establishment?: string } | null
  return <FacturesClient factures={factures || []} clients={clients || []} produits={produits || []} entreprise={entreprise} />
}
