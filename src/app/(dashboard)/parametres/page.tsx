export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ParametresClient from './ParametresClient'

export const metadata = { title: 'Paramètres — Carnaval Imprim CRM' }

export default async function ParametresPage() {
  const supabase = await createClient()

  // 1. Récupérer l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Lire son profil directement par id (plus fiable que getUser seul)
  const { data: monProfil } = await supabase
    .from('profiles')
    .select('role, actif')
    .eq('id', user.id)
    .single()

  // 3. isAdmin : vérifié en base, pas depuis le JWT
  const isAdmin = monProfil?.role === 'Admin' && monProfil?.actif === true

  // 4. Charger les autres données en parallèle
  const [
    { data: entrepriseData },
    { data: fneData },
    { data: profiles },
  ] = await Promise.all([
    supabase.from('entreprise').select('*').single(),
    supabase.from('fne_config').select('*').limit(1).maybeSingle(),
    supabase.from('profiles')
      .select('id, nom, email, role, actif, poste, telephone, permissions, derniere_connexion, created_at')
      .order('created_at'),
  ])

  return (
    <ParametresClient
      entreprise={(entrepriseData || {}) as Record<string, unknown>}
      fneConfig={(fneData || {}) as Record<string, unknown>}
      profiles={profiles || []}
      currentUserId={user.id}
      isAdmin={isAdmin}
    />
  )
}
