import { createClient } from '@/lib/supabase/server'
import ProductionImprimerieClient from './ProductionImprimerieClient'

export const metadata = { title: 'Production — Carnaval Imprim CRM' }

export default async function ProductionPage() {
  const supabase = await createClient()

  const [
    { data: bons },
    { data: clients },
    { data: machines },
    { data: profiles },
    { data: factures },
  ] = await Promise.all([
    supabase.from('bons_travail').select(`
      *, clients(nom),
      operateur:profiles!operateur_id(nom),
      machines(nom, type),
      etapes_fabrication(*),
      controles_qualite(*)
    `).order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nom').order('nom'),
    supabase.from('machines').select('*').order('nom'),
    supabase.from('profiles').select('id, nom, role').eq('actif', true).order('nom'),
    supabase.from('factures').select('id, numero').order('created_at', { ascending: false }).limit(50),
  ])

  return (
    <ProductionImprimerieClient
      bons={bons || []}
      clients={clients || []}
      machines={machines || []}
      profiles={profiles || []}
      factures={factures || []}
    />
  )
}
