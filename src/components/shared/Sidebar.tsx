'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, Receipt, Printer,
  Package, Truck, Settings, LogOut, BarChart3,
  AlertCircle, ShoppingCart, Calculator, Banknote,
  PackageCheck, Wallet
} from 'lucide-react'

const nav = [
  { href: '/dashboard',    label: 'Tableau de bord', icon: LayoutDashboard },
  { divider: 'Commercial' },
  { href: '/clients',      label: 'Clients',          icon: Users },
  { href: '/devis',        label: 'Devis',             icon: FileText },
  { href: '/factures',     label: 'Factures',          icon: Receipt },
  { href: '/relances',     label: 'Relances',          icon: AlertCircle },
  { divider: 'Opérations' },
  { href: '/production',   label: 'Production',        icon: Printer },
  { href: '/livraisons',   label: 'Bons livraison',    icon: PackageCheck },
  { href: '/bons',         label: 'Bons commande',     icon: ShoppingCart },
  { divider: 'Référentiel' },
  { href: '/catalogue',    label: 'Catalogue',         icon: Package },
  { href: '/fournisseurs', label: 'Fournisseurs',      icon: Truck },
  { divider: 'Gestion' },
  { href: '/comptabilite', label: 'Comptabilité',      icon: Calculator },
  { href: '/caisse',       label: 'Caisse',            icon: Banknote },
  { href: '/bons-caisse',  label: 'Bons de caisse',    icon: Wallet },
  { href: '/stats',        label: 'Statistiques',      icon: BarChart3 },
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
      display: 'flex', flexDirection: 'column', padding: '0 0 8px',
      overflowY: 'auto'
    }}>
      {/* ── Header logo : même hauteur qu'une navbar standard (56px) ── */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center',
        padding: '0 14px', borderBottom: '1px solid #F0EEEC',
        flexShrink: 0,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', lineHeight: 0 }}>
          <Image
            src="/logo.png"
            alt="Carnaval Imprim"
            width={120}
            height={67}
            style={{ height: 36, width: 'auto', objectFit: 'contain' }}
            priority
          />
        </Link>
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, padding: '6px 8px' }}>
        {nav.map((item, idx) => {
          if ('divider' in item) return (
            <div key={idx} style={{
              fontSize: 9, fontWeight: 800, color: '#C2117A',
              textTransform: 'uppercase', letterSpacing: '1.5px',
              padding: '10px 8px 3px', marginTop: 2
            }}>
              {item.divider}
            </div>
          )
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href!} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 9, textDecoration: 'none',
              fontSize: 12, fontWeight: 600,
              color: active ? '#fff' : '#1B1A1C',
              background: active ? '#C2117A' : 'transparent',
            }}>
              <item.icon size={15} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* ── Déconnexion ────────────────────────────────────────── */}
      <div style={{ padding: '8px 8px 0', borderTop: '1px solid #E4DDD6' }}>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '8px 10px', borderRadius: 9, width: '100%',
          border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          color: '#7A736C', background: 'transparent', fontFamily: 'inherit'
        }}>
          <LogOut size={14} /> Déconnexion
        </button>
        <div style={{ fontSize: 9, color: '#B0A89F', padding: '4px 10px 0', lineHeight: 1.5 }}>
          NCC : 240220333S
        </div>
      </div>
    </aside>
  )
}
