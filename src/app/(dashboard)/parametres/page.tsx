export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import ParametresClient from './ParametresClient'
export const metadata = { title: 'Paramètres — Carnaval Imprim CRM' }
export default async function ParametresPage() {
  const supabase = await createClient()
  const [
    { data: entrepriseData },
    { data: fneData },
    { data: profiles },
    { data: moi },
  ] = await Promise.all([
    supabase.from('entreprise').select('*').single(),
    supabase.from('fne_config').select('*').single(),
    supabase.from('profiles_with_email').select('*').order('created_at'),
    supabase.auth.getUser(),
  ])
  const entreprise = entrepriseData as Record<string, unknown> | null
  const fneConfig = fneData as Record<string, unknown> | null
  const currentUserId = moi.data.user?.id || ''
  const isAdmin = profiles?.find(p => p.id === currentUserId)?.role === 'Admin'
  return (
    <ParametresClient
      entreprise={entreprise}
      fneConfig={fneConfig}
      profiles={profiles || []}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
    />
  )
}
