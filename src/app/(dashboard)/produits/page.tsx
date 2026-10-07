export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import CatalogueClient from '../catalogue/CatalogueClient'

export const metadata = { title: 'Produits — Carnaval Imprim CRM' }

export default async function ProduitsPage() {
  const supabase = await createClient()
  const [{ data: produits }, { data: types }] = await Promise.all([
    supabase.from('produits').select('*, types_impression(libelle)').order('nom'),
    supabase.from('types_impression').select('*').order('libelle'),
  ])
  return <CatalogueClient produits={produits || []} types={types || []} />
}
