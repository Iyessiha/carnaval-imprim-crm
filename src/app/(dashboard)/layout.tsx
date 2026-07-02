export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/shared/Sidebar'
import PWAInstall from '@/components/PWAInstall'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="dashboard-wrap">
      <Sidebar />
      <main className="dashboard-main">
        {children}
      </main>
      <PWAInstall />
    </div>
  )
}
