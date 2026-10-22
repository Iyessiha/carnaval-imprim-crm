// ── Droits d'accès par module ───────────────────────────────────
// Source unique : utilisée par le serveur (garde des pages et API), la barre latérale
// et l'écran Paramètres. La base (RLS) bloque déjà les comptes désactivés ; ici on
// contrôle en plus l'accès à chaque module selon le rôle et les permissions personnalisées.

export const MODULES = [
  'clients', 'devis', 'factures', 'relances', 'production', 'livraisons', 'bons',
  'catalogue', 'fournisseurs', 'comptabilite', 'caisse', 'bons-caisse', 'stats', 'parametres',
] as const
export type Module = typeof MODULES[number]

export const ROLES = ['Admin', 'Secrétaire/Comptable', 'Production'] as const
export type Role = typeof ROLES[number]

export const PERMS_DEFAUT: Record<Role, Record<Module, boolean>> = {
  'Admin': Object.fromEntries(MODULES.map(m => [m, true])) as Record<Module, boolean>,
  // Fusion des anciens accès Commercial + Comptabilité : un même poste fait les deux
  'Secrétaire/Comptable': {
    clients: true, devis: true, factures: true, relances: true, production: false,
    livraisons: true, bons: false, catalogue: true, fournisseurs: true, comptabilite: true,
    caisse: true, 'bons-caisse': true, stats: true, parametres: false,
  },
  'Production': {
    clients: false, devis: false, factures: false, relances: false, production: true,
    livraisons: true, bons: true, catalogue: true, fournisseurs: true, comptabilite: false,
    caisse: false, 'bons-caisse': false, stats: false, parametres: false,
  },
}

// Route → module de droits. Les routes absentes (ex. /dashboard) sont ouvertes à tout compte actif.
export const MODULE_PAR_ROUTE: Record<string, Module> = {
  '/clients': 'clients',
  '/devis': 'devis',
  '/factures': 'factures',
  '/relances': 'relances',
  '/production': 'production',
  '/livraisons': 'livraisons',
  '/bons': 'bons',
  '/produits': 'catalogue',
  '/catalogue': 'catalogue',
  '/fournisseurs': 'fournisseurs',
  '/caisse': 'caisse',
  '/bons-caisse': 'bons-caisse',
  '/charges': 'comptabilite',
  '/comptabilite': 'comptabilite',
  '/stats': 'stats',
  '/parametres': 'parametres',
}

export type ProfilAcces = {
  role: string
  actif: boolean
  permissions?: Partial<Record<Module, boolean>> | null
}

/** Droits effectifs d'un compte : défauts du rôle, surchargés par les permissions personnalisées. */
export function droitsEffectifs(profil: ProfilAcces | null | undefined): Record<Module, boolean> {
  if (!profil || !profil.actif) return Object.fromEntries(MODULES.map(m => [m, false])) as Record<Module, boolean>
  if (profil.role === 'Admin') return PERMS_DEFAUT.Admin  // un administrateur ne peut pas être verrouillé
  const defauts = PERMS_DEFAUT[profil.role as Role] ?? Object.fromEntries(MODULES.map(m => [m, false]))
  return { ...defauts, ...(profil.permissions ?? {}) } as Record<Module, boolean>
}

export function peutAcceder(profil: ProfilAcces | null | undefined, module: Module): boolean {
  return droitsEffectifs(profil)[module] === true
}

/** Routes (href) accessibles à ce compte, dashboard inclus. */
export function routesAccessibles(profil: ProfilAcces | null | undefined, toutesLesRoutes: string[]): string[] {
  return toutesLesRoutes.filter(href => {
    const module = MODULE_PAR_ROUTE[href]
    return module === undefined ? !!profil?.actif : peutAcceder(profil, module)
  })
}
