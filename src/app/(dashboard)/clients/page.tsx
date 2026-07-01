import { createClient } from '@/lib/supabase/server'
import ClientsClient from './ClientsClient'

export const metadata = { title: 'Clients — Carnaval Imprim CRM' }

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  return <ClientsClient clients={clients || []} />
}
