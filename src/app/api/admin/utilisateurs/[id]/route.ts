import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { exigerAdmin } from '@/lib/acces-serveur'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLES, MODULES } from '@/lib/acces'

export const dynamic = 'force-dynamic'

const schemaModification = z.object({
  nom: z.string().trim().min(1, 'Le nom est obligatoire').optional(),
  role: z.enum(ROLES).optional(),
  poste: z.string().trim().nullable().optional(),
  telephone: z.string().trim().nullable().optional(),
  permissions: z.record(z.enum(MODULES), z.boolean()).nullable().optional(),
  actif: z.boolean().optional(),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères').optional(),
})

type Contexte = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Contexte) {
  const admin = await exigerAdmin()
  if (!admin) return NextResponse.json({ error: 'Réservé aux administrateurs' }, { status: 403 })

  const { id } = await params
  const verif = schemaModification.safeParse(await req.json().catch(() => null))
  if (!verif.success) {
    return NextResponse.json({ error: verif.error.issues[0]?.message || 'Données invalides' }, { status: 400 })
  }
  const m = verif.data
  const service = createAdminClient()

  const { data: cible } = await service.from('profiles').select('id, role, actif').eq('id', id).maybeSingle()
  if (!cible) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const seModifieLui = id === admin.id
  const retireRoleOuAcces =
    (m.role !== undefined && m.role !== 'Admin' && cible.role === 'Admin') ||
    (m.actif === false)

  if (seModifieLui && retireRoleOuAcces) {
    return NextResponse.json({ error: 'Vous ne pouvez pas retirer vos propres droits d\'administrateur ni désactiver votre compte' }, { status: 400 })
  }

  // Toujours au moins un administrateur actif dans l'équipe.
  if (cible.role === 'Admin' && cible.actif && retireRoleOuAcces) {
    const { count } = await service.from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'Admin').eq('actif', true).neq('id', id)
    if (!count) {
      return NextResponse.json({ error: 'Impossible : il doit rester au moins un administrateur actif' }, { status: 409 })
    }
  }

  // Changement de mot de passe (le compte garde ses données)
  if (m.password) {
    const { error } = await service.auth.admin.updateUserById(id, { password: m.password })
    if (error) return NextResponse.json({ error: 'Mot de passe non modifié : ' + error.message }, { status: 400 })
  }

  // Activation / désactivation : la base refuse déjà les écritures d'un compte inactif,
  // et on bloque aussi la connexion côté authentification.
  if (m.actif !== undefined) {
    const { error } = await service.auth.admin.updateUserById(id, {
      ban_duration: m.actif ? 'none' : '876000h',
    })
    if (error) return NextResponse.json({ error: 'Accès non modifié : ' + error.message }, { status: 400 })
  }

  const champs: Record<string, unknown> = {}
  if (m.nom !== undefined) champs.nom = m.nom
  if (m.role !== undefined) champs.role = m.role
  if (m.poste !== undefined) champs.poste = m.poste || null
  if (m.telephone !== undefined) champs.telephone = m.telephone || null
  if (m.permissions !== undefined) champs.permissions = m.permissions
  if (m.actif !== undefined) champs.actif = m.actif

  if (Object.keys(champs).length) {
    const { error } = await service.from('profiles').update(champs).eq('id', id)
    if (error) return NextResponse.json({ error: 'Profil non modifié : ' + error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
