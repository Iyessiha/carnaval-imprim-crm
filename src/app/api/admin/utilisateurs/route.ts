import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { exigerAdmin } from '@/lib/acces-serveur'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLES, MODULES } from '@/lib/acces'

export const dynamic = 'force-dynamic'

const schemaPermissions = z.record(z.enum(MODULES), z.boolean()).nullable()

const schemaCreation = z.object({
  nom: z.string().trim().min(1, 'Le nom est obligatoire'),
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide').optional().or(z.literal('')),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
  role: z.enum(ROLES),
  poste: z.string().trim().optional().nullable(),
  telephone: z.string().trim().optional().nullable(),
  permissions: schemaPermissions.optional(),
})

export async function POST(req: NextRequest) {
  const admin = await exigerAdmin()
  if (!admin) return NextResponse.json({ error: 'Réservé aux administrateurs' }, { status: 403 })

  const verif = schemaCreation.safeParse(await req.json().catch(() => null))
  if (!verif.success) {
    return NextResponse.json({ error: verif.error.issues[0]?.message || 'Données invalides' }, { status: 400 })
  }
  const donnees = verif.data

  const service = createAdminClient()
  // Sans e-mail, un identifiant technique est généré : la connexion se fait avec ce compte.
  const email = donnees.email || `compte.${crypto.randomUUID().slice(0, 8)}@comptes.carnavalimprim.local`

  const { data: cree, error: eCree } = await service.auth.admin.createUser({
    email,
    password: donnees.password,
    email_confirm: true,
  })
  if (eCree || !cree.user) {
    const deja = /already|registered|exists/i.test(eCree?.message || '')
    return NextResponse.json(
      { error: deja ? 'Un compte existe déjà avec cette adresse e-mail' : (eCree?.message || 'Création impossible') },
      { status: deja ? 409 : 400 }
    )
  }

  const { error: eProfil } = await service.from('profiles').upsert({
    id: cree.user.id,
    nom: donnees.nom,
    email,
    role: donnees.role,
    actif: true,
    poste: donnees.poste || null,
    telephone: donnees.telephone || null,
    permissions: donnees.permissions ?? null,
  }, { onConflict: 'id' })

  if (eProfil) {
    // Pas de compte orphelin : on annule la création auth si le profil n'a pas pu être écrit.
    await service.auth.admin.deleteUser(cree.user.id)
    return NextResponse.json({ error: 'Profil non créé : ' + eProfil.message }, { status: 500 })
  }

  return NextResponse.json({ id: cree.user.id }, { status: 201 })
}
