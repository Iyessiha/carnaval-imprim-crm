'use client'
import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Enregistrer le service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})

      // Recharger automatiquement dès qu'une nouvelle version prend le
      // contrôle, pour ne jamais rester bloqué sur du code obsolète
      // après un déploiement.
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })
    }

    // Détecter si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      // Afficher la bannière après 3s
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
      setShowBanner(false)
    }
    setPrompt(null)
  }

  if (installed || !showBanner || !prompt) return null

  return (
    <div style={{
      position: 'fixed', bottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 8px)',
      left: 16, right: 16, zIndex: 100,
      background: '#1B1A1C', borderRadius: 16, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,.3)',
      animation: 'slideUp .3s ease',
    }}>
      <style>{`@keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
      <div style={{ width:40, height:40, borderRadius:10, background:'#C2117A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Download size={20} color="#fff" />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:2 }}>
          Installer l&apos;application
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', lineHeight:1.4 }}>
          Accès rapide depuis votre écran d&apos;accueil
        </div>
      </div>
      <button onClick={handleInstall} style={{
        background:'#C2117A', color:'#fff', border:'none',
        padding:'8px 14px', borderRadius:9,
        fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0, fontFamily:'inherit',
      }}>
        Installer
      </button>
      <button onClick={() => setShowBanner(false)} style={{
        background:'none', border:'none', cursor:'pointer',
        color:'rgba(255,255,255,.5)', padding:4, display:'flex', flexShrink:0,
      }}>
        <X size={16} />
      </button>
    </div>
  )
}
