'use client'
import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/any'

// Déconnexion : efface la session puis renvoie à la page de connexion.
export default function Deconnexion() {
  const [enCours, setEnCours] = useState(false)

  const deconnecter = async () => {
    setEnCours(true)
    try {
      await getSupabase().auth.signOut()
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <button
      onClick={deconnecter}
      disabled={enCours}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C2117A', color: '#fff',
        border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        cursor: enCours ? 'wait' : 'pointer', fontFamily: 'inherit',
      }}
    >
      <LogOut size={14} /> {enCours ? 'Déconnexion…' : 'Se déconnecter'}
    </button>
  )
}
