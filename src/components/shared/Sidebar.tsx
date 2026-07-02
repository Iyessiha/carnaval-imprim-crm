'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, FileText, Receipt, Printer, Package, Truck, Settings, LogOut } from 'lucide-react'

const nav = [
  { href: '/dashboard',    label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/clients',      label: 'Clients',          icon: Users },
  { href: '/devis',        label: 'Devis',             icon: FileText },
  { href: '/factures',     label: 'Factures',          icon: Receipt },
  { href: '/production',   label: 'Production',        icon: Printer },
  { href: '/catalogue',    label: 'Catalogue',         icon: Package },
  { href: '/fournisseurs', label: 'Fournisseurs',      icon: Truck },
  { href: '/parametres',   label: 'Paramètres',        icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside style={{
      width: 220, background: '#fff', borderRight: '1px solid #E4DDD6',
      position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 30,
      display: 'flex', flexDirection: 'column', padding: '20px 10px',
      overflowY: 'auto'
    }}>
      {/* Logo */}
      <div style={{ padding: '4px 8px 20px' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#1B1A1C', letterSpacing: '.5px' }}>CARNAVAL</div>
        <div style={{ fontWeight: 700, fontSize: 9, color: '#C2117A', letterSpacing: '3px', marginTop: 1 }}>IMPRIM</div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
              fontSize: 13, fontWeight: 600,
              color: active ? '#fff' : '#1B1A1C',
              background: active ? '#C2117A' : 'transparent',
            }}>
              <item.icon size={17} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Déconnexion */}
      <div style={{ paddingTop: 12, borderTop: '1px solid #E4DDD6' }}>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10, width: '100%',
          border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          color: '#7A736C', background: 'transparent', fontFamily: 'inherit'
        }}>
          <LogOut size={17} /> Déconnexion
        </button>
        <div style={{ fontSize: 10, color: '#7A736C', padding: '6px 8px 0', lineHeight: 1.5 }}>
          NCC : 240220333S<br />RC : CI-ABJ-03-2024-B13-05735
        </div>
      </div>
    </aside>
  )
}
