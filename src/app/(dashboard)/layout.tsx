export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/shared/Sidebar'
import PWAInstall from '@/components/PWAInstall'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Compte désactivé : la base refuse toute modification (sécurité par ligne). On le dit
  // clairement plutôt que de laisser l'utilisateur modifier sans que rien ne soit enregistré.
  const { data: profil } = await supabase.from('profiles').select('actif').eq('id', user.id).maybeSingle()
  const compteInactif = (profil as { actif?: boolean } | null)?.actif === false

  return (
    <div className="dashboard-wrap">
      <Sidebar />
      <main className="dashboard-main">
        {compteInactif && (
          <div role="alert" style={{ background:'#D14343', color:'#fff', padding:'10px 16px', fontSize:13, fontWeight:600, lineHeight:1.4 }}>
            ⚠️ Votre compte est désactivé : vous pouvez consulter les données mais aucune modification ne sera enregistrée.
            Contactez l&apos;administrateur pour réactiver votre accès.
          </div>
        )}
        {children}
      </main>
      <PWAInstall />
    </div>
  )
}
