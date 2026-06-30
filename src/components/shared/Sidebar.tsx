'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, FileText, Receipt,
  Printer, Package, Truck, Settings, LogOut
} from 'lucide-react'

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
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{
      width: 240, background: '#fff', borderRight: '1px solid #E4DDD6',
      position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 30,
      display: 'flex', flexDirection: 'column', padding: '20px 12px',
      overflowY: 'auto'
    }}>
      {/* Logo */}
      <div style={{ padding: '4px 8px 24px' }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#1B1A1C', letterSpacing: '.5px' }}>CARNAVAL</div>
        <div style={{ fontWeight: 700, fontSize: 9, color: '#C2117A', letterSpacing: '3px', marginTop: 1 }}>IMPRIM</div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '11px 13px', borderRadius: 11, textDecoration: 'none',
              fontSize: 14, fontWeight: 600,
              color: active ? '#fff' : '#1B1A1C',
              background: active ? '#C2117A' : 'transparent',
            }}>
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Déconnexion */}
      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #E4DDD6' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 11,
            padding: '11px 13px', borderRadius: 11, width: '100%',
            border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            color: '#7A736C', background: 'transparent'
          }}
        >
          <LogOut size={18} />
          Déconnexion
        </button>
        <div style={{ fontSize: 11, color: '#7A736C', padding: '8px 8px 0', lineHeight: 1.5 }}>
          CARNAVAL IMPRIM<br />NCC : 240220333S
        </div>
      </div>
    </aside>
  )
}
