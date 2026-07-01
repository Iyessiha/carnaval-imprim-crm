import { createClient } from '@/lib/supabase/server'
import FacturesClient from './FacturesClient'
export const metadata = { title: 'Factures — Carnaval Imprim CRM' }
export default async function FacturesPage() {
  const supabase = await createClient()
  const [{ data: factures }, { data: clients }, { data: produits }, { data: entreprise }] = await Promise.all([
    supabase.from('factures').select('*, factures_lignes(*), paiements(*), clients(nom, ncc, telephone, email, adresse)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nom, ncc, telephone, email, adresse, template_fne_defaut').order('nom'),
    supabase.from('produits').select('id, nom, prix_base, unite').eq('actif', true).order('nom'),
    supabase.from('entreprise').select('*').single(),
  ])
  return <FacturesClient factures={factures || []} clients={clients || []} produits={produits || []} entreprise={entreprise} />
}
