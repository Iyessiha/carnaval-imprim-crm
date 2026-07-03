export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import TarifsClient from './TarifsClient'
export const metadata = { title: 'Tarifs d\'impression — Carnaval Imprim CRM' }
export default async function TarifsPage() {
  const supabase = await createClient()
  const { data: tarifs } = await supabase
    .from('tarifs_impression')
    .select('*')
    .order('categorie')
    .order('ordre')
  return <TarifsClient tarifs={tarifs || []} />
}
