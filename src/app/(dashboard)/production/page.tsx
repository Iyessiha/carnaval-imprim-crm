import { createClient } from '@/lib/supabase/server'
import ProductionClient from './ProductionClient'

export const metadata = { title: 'Production — Carnaval Imprim CRM' }

export default async function ProductionPage() {
  const supabase = await createClient()
  const [{ data: productions }, { data: clients }, { data: types }, { data: profiles }] = await Promise.all([
    supabase.from('productions').select('*, clients(nom), types_impression(libelle)').order('date', { ascending: false }),
    supabase.from('clients').select('id, nom').order('nom'),
    supabase.from('types_impression').select('*').order('libelle'),
    supabase.from('profiles').select('id, nom').eq('actif', true),
  ])
  return <ProductionClient productions={productions || []} clients={clients || []} types={types || []} profiles={profiles || []} />
}
