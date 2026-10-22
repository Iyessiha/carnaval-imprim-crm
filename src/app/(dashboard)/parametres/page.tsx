import { exigerModule, chargerSession } from '@/lib/acces-serveur'
import { createClient } from '@/lib/supabase/server'
import ParametresClient from './ParametresClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Paramètres — Carnaval Imprim CRM' }

export default async function ParametresPage() {
  await exigerModule('parametres')
  const { user, profil } = await chargerSession()
  const supabase = await createClient()

  // La clé API FNE n'est JAMAIS lue ni envoyée au navigateur : on ne transmet que son état.
  const [
    { data: entrepriseData },
    { data: fneData },
    { data: profiles },
  ] = await Promise.all([
    supabase.from('entreprise').select('*').limit(1).maybeSingle(),
    supabase.from('fne_config').select('id, mode, url_prod, url_test, actif').limit(1).maybeSingle(),
    supabase.from('profiles')
      .select('id, nom, email, role, actif, poste, telephone, permissions, derniere_connexion, created_at')
      .order('created_at'),
  ])

  return (
    <ParametresClient
      entreprise={(entrepriseData || null) as Record<string, unknown> | null}
      fneConfig={(fneData || null) as Record<string, unknown> | null}
      profiles={profiles || []}
      currentUserId={user?.id ?? ''}
      isAdmin={profil?.role === 'Admin' && profil.actif === true}
    />
  )
}
