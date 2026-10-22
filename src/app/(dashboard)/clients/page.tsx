import { exigerModule } from '@/lib/acces-serveur'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import ClientsClient from './ClientsClient'

export const metadata = { title: 'Clients — Carnaval Imprim CRM' }

export default async function ClientsPage() {
  await exigerModule('clients')
  const supabase = await createClient()
  const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
  return <ClientsClient clients={data || []} />
}
