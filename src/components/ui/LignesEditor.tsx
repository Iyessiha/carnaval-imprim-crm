'use client'
import { useState, useRef, useEffect } from 'react'
import { Plus, X, Search } from 'lucide-react'
import { inputStyle } from './index'
import { formatFCFA } from '@/lib/utils'

export interface Ligne {
  designation: string
  qte: number
  pu: number
  remise_ligne?: number
  produit_id?: string
}

export interface Tarif {
  id: string
  categorie: string
  designation: string
  format?: string
  grammage?: string
  finition?: string
  prix_unitaire: number
  unite: string
}

export default function LignesEditor({
  lignes, onChange, produits = [], tarifs = [],
}: {
  lignes: Ligne[]
  onChange: (lignes: Ligne[]) => void
  produits?: { id: string; nom: string; prix_base: number; unite: string }[]
  tarifs?: Tarif[]
}) {
  const [suggestions, setSuggestions] = useState<Tarif[]>([])
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const dropRef = useRef<HTMLDivElement>(null)

  const allItems: Tarif[] = [
    ...tarifs,
    ...produits.map(p => ({
      id: p.id, categorie: 'Produit', designation: p.nom,
      prix_unitaire: p.prix_base, unite: p.unite,
    })),
  ]

  const set = (i: number, k: keyof Ligne, v: string | number) =>
    onChange(lignes.map((l, j) => j === i ? { ...l, [k]: v } : l))

  const add = () => onChange([...lignes, { designation: '', qte: 1, pu: 0 }])
  const rm  = (i: number) => onChange(lignes.filter((_, j) => j !== i))

  const handleDesignation = (i: number, val: string) => {
    set(i, 'designation', val)
    setActiveIdx(i)
    setQuery(val)
    if (val.length >= 1) {
      const q = val.toLowerCase()
      setSuggestions(
        allItems.filter(t =>
          t.designation.toLowerCase().includes(q) ||
          t.categorie.toLowerCase().includes(q) ||
          (t.format || '').toLowerCase().includes(q)
        ).slice(0, 8)
      )
    } else {
      setSuggestions([])
    }
  }

  const pick = (i: number, t: Tarif) => {
    onChange(lignes.map((l, j) => j === i
      ? { ...l, designation: t.designation, pu: t.prix_unitaire, produit_id: t.id }
      : l
    ))
    setSuggestions([])
    setActiveIdx(null)
  }

  // Fermer dropdown si clic outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setSuggestions([])
        setActiveIdx(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const sousTotal = lignes.reduce((s, l) => s + (l.qte || 0) * (l.pu || 0) - (l.remise_ligne || 0), 0)

  return (
    <div ref={dropRef}>
      {/* En-têtes colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 130px 30px', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase' as const }}>Désignation / Prestation</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase' as const, textAlign: 'center' as const }}>Qté</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase' as const, textAlign: 'right' as const }}>P.U. HT</span>
        <span />
      </div>

      {lignes.map((l, i) => (
        <div key={i} style={{ marginBottom: 8, position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 130px 30px', gap: 6, alignItems: 'center' }}>
            {/* Désignation avec autocomplete */}
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, padding: '9px 10px', width: '100%' }}
                placeholder="Saisir ou choisir une prestation…"
                value={l.designation}
                onChange={e => handleDesignation(i, e.target.value)}
                onFocus={() => {
                  if (l.designation.length === 0) {
                    setSuggestions(allItems.slice(0, 8))
                    setActiveIdx(i)
                  }
                }}
              />
              {/* Dropdown suggestions */}
              {activeIdx === i && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#fff', border: '1px solid #E4DDD6', borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,.12)', overflow: 'hidden', marginTop: 2,
                }}>
                  {suggestions.map((t, si) => (
                    <div
                      key={si}
                      onMouseDown={() => pick(i, t)}
                      style={{
                        padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #F0EEEC',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#fff', transition: 'background .1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FDE8F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1B1A1C' }}>{t.designation}</div>
                        <div style={{ fontSize: 11, color: '#7A736C', marginTop: 2 }}>
                          {t.categorie}{t.format ? ` · ${t.format}` : ''}{t.finition ? ` · ${t.finition}` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#C2117A' }}>{formatFCFA(t.prix_unitaire)}</div>
                        <div style={{ fontSize: 10, color: '#7A736C' }}>{t.unite}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Quantité */}
            <input
              type="number" min="1" step="1"
              style={{ ...inputStyle, padding: '9px 8px', textAlign: 'center' as const }}
              value={l.qte || ''}
              onChange={e => set(i, 'qte', parseFloat(e.target.value) || 0)}
            />
            {/* Prix unitaire */}
            <input
              type="number" min="0" step="500"
              style={{ ...inputStyle, padding: '9px 8px', textAlign: 'right' as const }}
              value={l.pu || ''}
              onChange={e => set(i, 'pu', parseFloat(e.target.value) || 0)}
            />
            {/* Supprimer */}
            <button
              onClick={() => rm(i)}
              disabled={lignes.length === 1}
              style={{ background: 'none', border: 'none', cursor: lignes.length === 1 ? 'default' : 'pointer', color: '#D14343', padding: 4, display: 'flex', opacity: lignes.length === 1 ? .3 : 1 }}
            >
              <X size={16} />
            </button>
          </div>
          {/* Sous-total ligne */}
          {l.pu > 0 && l.qte > 0 && (
            <div style={{ fontSize: 11, color: '#7A736C', textAlign: 'right' as const, marginTop: 2, paddingRight: 38 }}>
              = {formatFCFA(l.qte * l.pu)}
            </div>
          )}
        </div>
      ))}

      {/* Bouton ajouter ligne */}
      <button onClick={add} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: '#F6F4F1', border: '1px dashed #E4DDD6',
        padding: '8px 14px', borderRadius: 9, cursor: 'pointer',
        fontSize: 12, fontWeight: 600, color: '#7A736C',
        fontFamily: 'inherit', marginTop: 4,
      }}>
        <Plus size={14} /> Ajouter une ligne
      </button>

      {/* Sous-total */}
      {lignes.length > 0 && (
        <div style={{ textAlign: 'right' as const, marginTop: 12, paddingTop: 8, borderTop: '1px solid #E4DDD6', fontSize: 13, color: '#1B1A1C' }}>
          Sous-total : <strong>{formatFCFA(sousTotal)}</strong>
        </div>
      )}
    </div>
  )
}
