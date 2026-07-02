'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, Receipt, Printer,
  Package, Truck, Settings, LogOut, BarChart3,
  AlertCircle, ShoppingCart, Calculator, Banknote,
  PackageCheck, Wallet, Menu, X
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

// Navigation rapide pour la barre du bas mobile (5 items max)
const bottomNav = [
  { href: '/dashboard',  label: 'Accueil',   icon: LayoutDashboard },
  { href: '/clients',    label: 'Clients',   icon: Users },
  { href: '/devis',      label: 'Devis',     icon: FileText },
  { href: '/factures',   label: 'Factures',  icon: Receipt },
  { href: '/production', label: 'Production', icon: Printer },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Fermer la sidebar quand on change de page (mobile)
  useEffect(() => { setOpen(false) }, [pathname])

  const handleLogout = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const SidebarContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Logo */}
      <div style={{ height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', borderBottom:'1px solid #F0EEEC', flexShrink:0 }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', lineHeight:0 }} onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="Carnaval Imprim" width={120} height={67}
            style={{ height:34, width:'auto', objectFit:'contain' }} priority />
        </Link>
        {isMobile && (
          <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#7A736C', padding:4, display:'flex' }}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ display:'flex', flexDirection:'column', gap:1, flex:1, padding:'6px 8px', overflowY:'auto' }}>
        {nav.map((item, idx) => {
          if ('divider' in item) return (
            <div key={idx} style={{ fontSize:9, fontWeight:800, color:'#C2117A', textTransform:'uppercase', letterSpacing:'1.5px', padding:'10px 8px 3px', marginTop:2 }}>
              {item.divider}
            </div>
          )
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href!} style={{
              display:'flex', alignItems:'center', gap:9,
              padding:'9px 10px', borderRadius:9, textDecoration:'none',
              fontSize:13, fontWeight:600,
              color: active ? '#fff' : '#1B1A1C',
              background: active ? '#C2117A' : 'transparent',
            }}>
              <item.icon size={15} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Déconnexion */}
      <div style={{ padding:'8px 8px 0', borderTop:'1px solid #E4DDD6' }}>
        <button onClick={handleLogout} style={{
          display:'flex', alignItems:'center', gap:9,
          padding:'9px 10px', borderRadius:9, width:'100%',
          border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
          color:'#7A736C', background:'transparent', fontFamily:'inherit'
        }}>
          <LogOut size={14} /> Déconnexion
        </button>
        <div style={{ fontSize:9, color:'#B0A89F', padding:'4px 10px 6px', lineHeight:1.5 }}>
          NCC : 240220333S
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* ── SIDEBAR DESKTOP ─────────────────────────────── */}
      <aside className="sidebar-desktop" style={{
        background:'#fff',
        display: isMobile ? 'none' : 'block',
      }}>
        <SidebarContent />
      </aside>

      {/* ── MOBILE HEADER ───────────────────────────────── */}
      {isMobile && (
        <header className="mobile-header">
          <button onClick={() => setOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#1B1A1C', padding:8, display:'flex', alignItems:'center' }}>
            <Menu size={24} />
          </button>
          <Link href="/" style={{ lineHeight:0 }}>
            <Image src="/logo.png" alt="Carnaval Imprim" width={100} height={56}
              style={{ height:32, width:'auto', objectFit:'contain' }} priority />
          </Link>
          <div style={{ width:40 }} />
        </header>
      )}

      {/* ── SIDEBAR MOBILE (drawer) ──────────────────────── */}
      {isMobile && (
        <>
          {/* Overlay */}
          <div
            className={`sidebar-overlay ${open ? 'open' : ''}`}
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside style={{
            position:'fixed', top:0, bottom:0, left:0,
            width:260, background:'#fff', zIndex:40,
            transform: open ? 'translateX(0)' : 'translateX(-100%)',
            transition:'transform .25s cubic-bezier(.4,0,.2,1)',
            boxShadow: open ? '4px 0 24px rgba(0,0,0,.2)' : 'none',
            overflowY:'auto',
          }}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── BOTTOM NAV MOBILE ───────────────────────────── */}
      {isMobile && (
        <nav className="bottom-nav">
          {bottomNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} className={`bottom-nav-item ${active ? 'active' : ''}`}>
                <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
