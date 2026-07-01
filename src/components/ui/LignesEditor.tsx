'use client'
import { Plus, X } from 'lucide-react'
import { inputStyle, labelStyle } from './index'
import { formatFCFA } from '@/lib/utils'

export interface Ligne {
  designation: string
  qte: number
  pu: number
  remise_ligne?: number
  produit_id?: string
}

export default function LignesEditor({
  lignes, onChange, produits = [],
}: {
  lignes: Ligne[]
  onChange: (lignes: Ligne[]) => void
  produits?: { id: string; nom: string; prix_base: number; unite: string }[]
}) {
  const set = (i: number, k: keyof Ligne, v: string | number) =>
    onChange(lignes.map((l, j) => j === i ? { ...l, [k]: v } : l))

  const add = () => onChange([...lignes, { designation: '', qte: 1, pu: 0 }])
  const rm  = (i: number) => onChange(lignes.filter((_, j) => j !== i))

  const sousTotal = lignes.reduce((s, l) => s + l.qte * l.pu - (l.remise_ligne || 0), 0)

  return (
    <div>
      <label style={labelStyle}>Lignes de prestation</label>

      {/* En-têtes */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 70px 120px 30px',
        gap: 8, marginBottom: 6,
      }}>
        <span style={{ ...labelStyle, marginBottom: 0 }}>Désignation</span>
        <span style={{ ...labelStyle, marginBottom: 0, textAlign: 'center' }}>Qté</span>
        <span style={{ ...labelStyle, marginBottom: 0, textAlign: 'right' }}>P.U. HT</span>
        <span />
      </div>

      {lignes.map((l, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '1fr 70px 120px 30px',
          gap: 8, marginBottom: 8, alignItems: 'center',
        }}>
          <div>
            <input
              list="produits-list"
              style={{ ...inputStyle, padding: '8px 10px' }}
              placeholder="Désignation"
              value={l.designation}
              onChange={e => {
                const prod = produits.find(p => p.nom === e.target.value)
                set(i, 'designation', e.target.value)
                if (prod) set(i, 'pu', prod.prix_base)
              }}
            />
            <datalist id="produits-list">
              {produits.map(p => <option key={p.id} value={p.nom} />)}
            </datalist>
          </div>
          <input
            type="number" min="0.01" step="0.01"
            style={{ ...inputStyle, padding: '8px 10px', textAlign: 'center' }}
            value={l.qte}
            onChange={e => set(i, 'qte', Number(e.target.value))}
          />
          <input
            type="number" min="0"
            style={{ ...inputStyle, padding: '8px 10px', textAlign: 'right' }}
            value={l.pu}
            onChange={e => set(i, 'pu', Number(e.target.value))}
          />
          <button onClick={() => rm(i)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#D14343', padding: 4, display: 'inline-flex',
          }}>
            <X size={16} />
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <button onClick={add} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#fff', border: '1px solid #E4DDD6',
          padding: '7px 12px', borderRadius: 9,
          fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#1B1A1C',
        }}>
          <Plus size={14} /> Ajouter une ligne
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1B1A1C' }}>
          Sous-total : {formatFCFA(sousTotal)}
        </span>
      </div>
    </div>
  )
}
