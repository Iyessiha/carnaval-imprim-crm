'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, Receipt,
  Printer, PackageCheck, ShoppingCart, Package,
  Truck, Calculator, Banknote, Wallet,
  BarChart3, Settings, LogOut,
  AlertCircle, Menu, X, TrendingDown
} from 'lucide-react'

const nav = [
  { href: '/dashboard',    label: 'Tableau de bord',  icon: LayoutDashboard },
  { divider: 'Commercial' },
  { href: '/clients',      label: 'Clients',           icon: Users },
  { href: '/devis',        label: 'Devis',             icon: FileText },
  { href: '/factures',     label: 'Factures',          icon: Receipt },
  { href: '/relances',     label: 'Relances',          icon: AlertCircle },
  { divider: 'Production' },
  { href: '/production',   label: 'Ordres de prod.',   icon: Printer },
  { href: '/livraisons',   label: 'Bons livraison',    icon: PackageCheck },
  { divider: 'Achats' },
  { href: '/bons',         label: 'Bons commande',     icon: ShoppingCart },
  { href: '/fournisseurs', label: 'Fournisseurs',      icon: Truck },
  { divider: 'Référentiel' },
  { href: '/catalogue',    label: 'Tarifs impression', icon: Package },
  { divider: 'Finances' },
  { href: '/caisse',       label: 'Caisse',            icon: Banknote },
  { href: '/bons-caisse',  label: 'Bons de caisse',    icon: Wallet },
  { href: '/comptabilite', label: 'Comptabilité',      icon: Calculator },
  { divider: 'Rapports' },
  { href: '/stats',        label: 'Statistiques',      icon: BarChart3 },
  { divider: 'Admin' },
  { href: '/parametres',   label: 'Paramètres',        icon: Settings },
]

const bottomNav = [
  { href: '/dashboard',  label: 'Accueil',    icon: LayoutDashboard },
  { href: '/devis',      label: 'Devis',      icon: FileText },
  { href: '/factures',   label: 'Factures',   icon: Receipt },
  { href: '/production', label: 'Production', icon: Printer },
  { href: '/caisse',     label: 'Caisse',     icon: Banknote },
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

  useEffect(() => { setOpen(false) }, [pathname])

  const handleLogout = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const NavContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Logo */}
      <div style={{ height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', borderBottom:'1px solid #F0EEEC', flexShrink:0 }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', lineHeight:0 }} onClick={()=>setOpen(false)}>
          <Image src="/logo.png" alt="Carnaval Imprim" width={120} height={67}
            style={{ height:34, width:'auto', objectFit:'contain' }} priority />
        </Link>
        {isMobile && (
          <button onClick={()=>setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#7A736C', padding:4, display:'flex' }}>
            <X size={20}/>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, overflowY:'auto', padding:'6px 8px', display:'flex', flexDirection:'column', gap:1 }}>
        {nav.map((item, idx) => {
          if ('divider' in item) return (
            <div key={idx} style={{ fontSize:9, fontWeight:800, color:'#C2117A', textTransform:'uppercase', letterSpacing:'1.5px', padding:'10px 8px 3px', marginTop:2 }}>
              {item.divider}
            </div>
          )
          const active = pathname === item.href || pathname.startsWith(item.href+'/')
          return (
            <Link key={item.href} href={item.href!} style={{
              display:'flex', alignItems:'center', gap:9,
              padding:'8px 10px', borderRadius:9, textDecoration:'none',
              fontSize:12.5, fontWeight:600,
              color: active ? '#fff' : '#1B1A1C',
              background: active ? '#C2117A' : 'transparent',
              transition: 'background .12s',
            }}>
              <item.icon size={15}/> {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Déconnexion */}
      <div style={{ padding:'8px 8px 0', borderTop:'1px solid #E4DDD6' }}>
        <button onClick={handleLogout} style={{
          display:'flex', alignItems:'center', gap:9,
          padding:'8px 10px', borderRadius:9, width:'100%',
          border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
          color:'#7A736C', background:'transparent', fontFamily:'inherit',
        }}>
          <LogOut size={14}/> Déconnexion
        </button>
        <div style={{ fontSize:9, color:'#B0A89F', padding:'4px 10px 6px', lineHeight:1.5 }}>
          NCC : 240220333S
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      {!isMobile && (
        <aside style={{ width:220, position:'fixed', top:0, bottom:0, left:0, zIndex:40, background:'#fff', borderRight:'1px solid #E4DDD6', overflow:'hidden' }}>
          <NavContent/>
        </aside>
      )}

      {/* Mobile header */}
      {isMobile && (
        <header className="mobile-header">
          <button onClick={()=>setOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#1B1A1C', padding:8, display:'flex' }}>
            <Menu size={24}/>
          </button>
          <Link href="/" style={{ lineHeight:0 }}>
            <Image src="/logo.png" alt="Carnaval Imprim" width={100} height={56}
              style={{ height:32, width:'auto', objectFit:'contain' }} priority/>
          </Link>
          <div style={{ width:40 }}/>
        </header>
      )}

      {/* Drawer mobile */}
      {isMobile && (
        <>
          <div onClick={()=>setOpen(false)} className={`sidebar-overlay ${open?'open':''}`}/>
          <aside style={{
            position:'fixed', top:0, bottom:0, left:0, width:260,
            background:'#fff', zIndex:40,
            transform: open?'translateX(0)':'translateX(-100%)',
            transition:'transform .25s cubic-bezier(.4,0,.2,1)',
            boxShadow: open?'4px 0 24px rgba(0,0,0,.2)':'none',
            overflowY:'auto',
          }}>
            <NavContent/>
          </aside>
        </>
      )}

      {/* Bottom nav */}
      {isMobile && (
        <nav className="bottom-nav">
          {bottomNav.map(item => {
            const active = pathname===item.href||pathname.startsWith(item.href+'/')
            return (
              <Link key={item.href} href={item.href} className={`bottom-nav-item ${active?'active':''}`}>
                <item.icon size={22} strokeWidth={active?2.5:1.8}/>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
