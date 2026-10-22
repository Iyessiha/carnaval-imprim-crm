export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { chargerSession } from '@/lib/acces-serveur'
import { routesAccessibles } from '@/lib/acces'
import Sidebar from '@/components/shared/Sidebar'
import PWAInstall from '@/components/PWAInstall'
import Deconnexion from '@/components/shared/Deconnexion'

const TOUTES_LES_ROUTES = [
  '/dashboard', '/clients', '/devis', '/factures', '/relances', '/production', '/livraisons',
  '/fournisseurs', '/bons', '/produits', '/catalogue', '/caisse', '/bons-caisse', '/charges',
  '/comptabilite', '/stats', '/parametres',
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profil } = await chargerSession()
  if (!user) redirect('/login')

  // Compte désactivé (ou sans profil) : la base ne laisse rien lire ni écrire.
  // On affiche clairement la situation plutôt qu'une application vide.
  if (!profil || !profil.actif) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#F6F4F1' }}>
        <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 16, padding: 28, maxWidth: 440, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Compte désactivé</div>
          <p style={{ fontSize: 14, color: '#7A736C', lineHeight: 1.6, margin: '0 0 20px' }}>
            Votre accès à Carnaval Imprim CRM est désactivé. Contactez l&apos;administrateur pour le réactiver.
          </p>
          <Deconnexion />
        </div>
      </div>
    )
  }

  const routes = routesAccessibles(profil, TOUTES_LES_ROUTES)

  return (
    <div className="dashboard-wrap">
      <Sidebar routes={routes} />
      <main className="dashboard-main">
        {children}
      </main>
      <PWAInstall />
    </div>
  )
}
