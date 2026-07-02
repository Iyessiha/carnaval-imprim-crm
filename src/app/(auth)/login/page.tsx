'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Import dynamique pour éviter le prerendering côté serveur
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1B1A1C 0%, #2d0820 50%, #C2117A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 40,
        width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1B1A1C', letterSpacing: '.5px' }}>CARNAVAL</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#C2117A', letterSpacing: 4, marginTop: 2 }}>IMPRIM</div>
          <div style={{ fontSize: 13, color: '#7A736C', marginTop: 8 }}>Espace de gestion</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A736C', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.3px' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="vous@carnavalimprim.ci"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #E4DDD6', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A736C', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.3px' }}>Mot de passe</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #E4DDD6', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {error && (
            <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 13, background: '#C2117A', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1,
            fontFamily: 'inherit'
          }}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 11, color: '#7A736C', textAlign: 'center', lineHeight: 1.6 }}>
          CARNAVAL IMPRIM · NCC 240220333S<br />
          Plateforme développée par MonWe Infinity LLC
        </div>
      </div>
    </div>
  )
}
