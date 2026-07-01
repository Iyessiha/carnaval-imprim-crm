import { createClient } from '@/lib/supabase/server'
import FacturesClient from './FacturesClient'

export const metadata = { title: 'Factures — Carnaval Imprim CRM' }

export default async function FacturesPage() {
  const supabase = await createClient()

  const [
    { data: factures },
    { data: clients },
    { data: produits },
    { data: entreprise },
    { data: fneConfig },
  ] = await Promise.all([
    supabase.from('factures').select('*, clients(nom, ncc, telephone, email, adresse, template_fne_defaut), factures_lignes(*), paiements(*)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nom, ncc, telephone, email, adresse, template_fne_defaut').order('nom'),
    supabase.from('produits').select('id, nom, prix_base, unite').eq('actif', true).order('nom'),
    supabase.from('entreprise').select('*').single(),
    supabase.from('fne_config').select('mode, actif, balance_stickers').single(),
  ])

  return (
    <FacturesClient
      factures={factures || []}
      clients={clients || []}
      produits={produits || []}
      entreprise={entreprise}
      fneConfig={fneConfig}
    />
  )
}
