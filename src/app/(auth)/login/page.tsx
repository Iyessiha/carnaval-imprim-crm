'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError('Email ou mot de passe incorrect.'); setLoading(false); return }
      if (data.session) window.location.href = '/dashboard'
    } catch {
      setError('Une erreur est survenue. Réessayez.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1B1A1C 0%, #2d0820 50%, #C2117A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '36px 40px',
        width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.3)'
      }}>
        {/* Vrai logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Image
            src="/logo.png"
            alt="Carnaval Imprim"
            width={280}
            height={157}
            style={{ width: '100%', maxWidth: 260, height: 'auto', objectFit: 'contain' }}
            priority
          />
          <div style={{ fontSize: 13, color: '#7A736C', marginTop: 8 }}>
            Espace de gestion
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A736C', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.3px' }}>
              E-mail
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@carnavalimprim.ci"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #E4DDD6', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7A736C', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.3px' }}>
              Mot de passe
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #E4DDD6', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 13,
            background: loading ? '#E4DDD6' : '#C2117A',
            color: loading ? '#7A736C' : '#fff',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
          }}>
            {loading ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 11, color: '#B0A89F', textAlign: 'center', lineHeight: 1.6 }}>
          CARNAVAL IMPRIM · NCC 240220333S<br />
          Plateforme développée par MonWe Infinity LLC
        </div>
      </div>
    </div>
  )
}
