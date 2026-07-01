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
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: '#7A736C', fontSize: 14, margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {(q !== undefined || onAdd || extra) && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {q !== undefined && (
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#7A736C' }} />
              <input
                value={q} onChange={e => setQ?.(e.target.value)}
                placeholder={searchPlaceholder || 'Rechercher…'}
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
            </div>
          )}
          {extra}
          {onAdd && (
            <button onClick={onAdd} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: '#C2117A', color: '#fff', border: 'none',
              padding: '10px 16px', borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Plus size={16} /> {addLabel || 'Nouveau'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
