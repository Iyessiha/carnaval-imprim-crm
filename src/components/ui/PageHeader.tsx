'use client'
import { Search, Plus } from 'lucide-react'
import { inputStyle } from './index'

export default function PageHeader({
  title, subtitle, q, setQ, searchPlaceholder,
  onAdd, addLabel, extra,
}: {
  title: string
  subtitle?: string
  q?: string
  setQ?: (v: string) => void
  searchPlaceholder?: string
  onAdd?: () => void
  addLabel?: string
  extra?: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      {/* Titre */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{title}</h1>
          {subtitle && <p style={{ color: '#7A736C', fontSize: 13, margin: '3px 0 0' }}>{subtitle}</p>}
        </div>
        {/* Bouton ajouter visible en haut sur mobile */}
        {onAdd && (
          <button onClick={onAdd} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#C2117A', color: '#fff',
            border: 'none', padding: '10px 16px', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}>
            <Plus size={16} />
            <span className="hide-mobile">{addLabel || 'Ajouter'}</span>
            <span className="hide-desktop">Ajouter</span>
          </button>
        )}
      </div>

      {/* Barre recherche + filtres */}
      {(q !== undefined || extra) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {q !== undefined && (
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#7A736C', pointerEvents: 'none' }} />
              <input
                value={q}
                onChange={e => setQ?.(e.target.value)}
                placeholder={searchPlaceholder || 'Rechercher…'}
                style={{ ...inputStyle, paddingLeft: 34, width: '100%' }}
              />
            </div>
          )}
          {extra}
        </div>
      )}
    </div>
  )
}
