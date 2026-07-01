import { createClient } from '@/lib/supabase/server'
import CatalogueClient from './CatalogueClient'
export const metadata = { title: 'Catalogue — Carnaval Imprim CRM' }
export default async function CataloguePage() {
  const supabase = await createClient()
  const [{ data: produits }, { data: types }] = await Promise.all([
    supabase.from('produits').select('*, types_impression(libelle)').order('nom'),
    supabase.from('types_impression').select('*').order('libelle'),
  ])
  return <CatalogueClient produits={produits || []} types={types || []} />
}
