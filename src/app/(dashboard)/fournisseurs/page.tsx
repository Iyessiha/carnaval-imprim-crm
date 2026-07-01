import { createClient } from '@/lib/supabase/server'
import FournisseursClient from './FournisseursClient'
export const metadata = { title: 'Fournisseurs — Carnaval Imprim CRM' }
export default async function FournisseursPage() {
  const supabase = await createClient()
  const { data: fournisseurs } = await supabase.from('fournisseurs').select('*').order('nom')
  return <FournisseursClient fournisseurs={fournisseurs||[]} />
}
