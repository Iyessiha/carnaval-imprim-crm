// Garde d'accès côté serveur (pages et layout). Le contrôle se fait en base, pas dans le navigateur.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { peutAcceder, type Module, type ProfilAcces } from '@/lib/acces'

export type ProfilComplet = ProfilAcces & { id: string; nom: string }

/** Compte connecté + profil. `profil` est null si le profil n'existe pas. */
export async function chargerSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profil: null, supabase }

  const { data } = await supabase
    .from('profiles')
    .select('id, nom, role, actif, permissions')
    .eq('id', user.id)
    .maybeSingle()

  return { user, profil: (data as ProfilComplet | null), supabase }
}

/** Redirige vers le tableau de bord si le compte n'a pas accès au module. */
export async function exigerModule(module: Module) {
  const { profil } = await chargerSession()
  if (!profil || !peutAcceder(profil, module)) redirect('/dashboard')
  return profil
}

/** Seul un compte administrateur actif peut gérer les comptes utilisateurs. */
export async function exigerAdmin() {
  const { user, profil } = await chargerSession()
  if (!user || !profil?.actif || profil.role !== 'Admin') return null
  return { id: user.id }
}
