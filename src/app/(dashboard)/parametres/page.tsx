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
    { data: authUser },
  ] = await Promise.all([
    supabase.from('entreprise').select('*').single(),
    supabase.from('fne_config').select('*').limit(1).single(),
    supabase.from('profiles')
      .select('id, nom, email, role, actif, poste, telephone, permissions, derniere_connexion, created_at')
      .order('created_at'),
    supabase.auth.getUser(),
  ])

  // Typer proprement
  const entreprise = (entrepriseData || {}) as Record<string, unknown>
  const fneConfig = (fneData || {}) as Record<string, unknown>
  const currentUserId = authUser?.data?.user?.id || ''
  const currentProfile = (profiles || []).find((p: {id:string;role:string}) => p.id === currentUserId)
  const isAdmin = currentProfile?.role === 'Admin'

  return (
    <ParametresClient
      entreprise={entreprise}
      fneConfig={fneConfig}
      profiles={profiles || []}
      currentUserId={currentUserId}
      isAdmin={isAdmin ?? false}
    />
  )
}
