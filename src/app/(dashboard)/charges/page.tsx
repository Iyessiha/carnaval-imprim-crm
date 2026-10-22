import { exigerModule } from '@/lib/acces-serveur'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import ChargesClient from './ChargesClient'

export const metadata = { title: 'Charges fixes — Carnaval Imprim CRM' }

export default async function ChargesPage() {
  await exigerModule('comptabilite')
  const supabase = await createClient()
  const { data: charges } = await supabase
    .from('charges_fixes').select('*').order('actif', { ascending: false }).order('prochaine_echeance', { nullsFirst: false })
  return <ChargesClient charges={charges || []} />
}
