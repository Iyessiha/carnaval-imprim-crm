'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDateFR } from '@/lib/utils'
import type { Database } from '@/types/database.types'
import {
  Plus, Search, Pencil, Trash2, X, Check,
  Users, Building2, Phone, Mail, MapPin
} from 'lucide-react'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']

const TYPES = ['Entreprise', 'Institution', 'ONG', 'Particulier'] as const
const TEMPLATES_FNE = ['B2B', 'B2G', 'B2C', 'B2F'] as const

const TYPE_COLORS: Record<string, string> = {
  'Entreprise':   'bg-purple-100 text-purple-700',
  'Institution':  'bg-blue-100 text-blue-700',
  'ONG':          'bg-green-100 text-green-700',
  'Particulier':  'bg-gray-100 text-gray-600',
}

// ── Styles ─────────────────────────────────────────────────────
const S = {
  input: {
    width: '100%', padding: '10px 12px',
    border: '1px solid #E4DDD6', borderRadius: 10,
    fontSize: 14, outline: 'none', background: '#fff',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  label: {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#7A736C', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '.3px',
  } as React.CSSProperties,
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: '#C2117A', color: '#fff', border: 'none',
    padding: '10px 16px', borderRadius: 10,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: '#fff', color: '#1B1A1C',
    border: '1px solid #E4DDD6', padding: '10px 16px',
    borderRadius: 10, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  } as React.CSSProperties,
  iconBtn: {
    background: 'transparent', border: 'none',
    cursor: 'pointer', color: '#7A736C',
    padding: 6, borderRadius: 8,
    display: 'inline-flex', alignItems: 'center',
  } as React.CSSProperties,
}

// ── Formulaire client ───────────────────────────────────────────
const EMPTY_FORM: ClientInsert = {
  nom: '', contact: '', telephone: '', email: '',
  adresse: '', ncc: '', type: 'Entreprise',
  template_fne_defaut: 'B2B', notes: '',
}

function ClientForm({
  initial, onSave, onCancel, loading,
}: {
  initial: ClientInsert
  onSave: (data: ClientInsert) => void
  onCancel: () => void
  loading: boolean
}) {
  const [f, setF] = useState<ClientInsert>(initial)
  const set = (k: keyof ClientInsert, v: string) =>
    setF((p) => ({ ...p, [k]: v }))

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  )

  return (
    <div>
      <Field label="Nom / Raison sociale *">
        <input style={S.input} value={f.nom || ''} onChange={e => set('nom', e.target.value)} placeholder="Ex: Global Business Solutions" />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Contact">
          <input style={S.input} value={f.contact || ''} onChange={e => set('contact', e.target.value)} placeholder="M. Koffi" />
        </Field>
        <Field label="Téléphone">
          <input style={S.input} value={f.telephone || ''} onChange={e => set('telephone', e.target.value)} placeholder="07 07 07 07 07" />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="E-mail">
          <input style={S.input} type="email" value={f.email || ''} onChange={e => set('email', e.target.value)} placeholder="contact@client.ci" />
        </Field>
        <Field label="Type">
          <select style={S.input} value={f.type || 'Entreprise'} onChange={e => set('type', e.target.value)}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Adresse">
        <input style={S.input} value={f.adresse || ''} onChange={e => set('adresse', e.target.value)} placeholder="Plateau, Abidjan" />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="NCC (compte contribuable)">
          <input style={S.input} value={f.ncc || ''} onChange={e => set('ncc', e.target.value)} placeholder="4501234567A" />
        </Field>
        <Field label="Template FNE par défaut">
          <select style={S.input} value={f.template_fne_defaut || 'B2B'} onChange={e => set('template_fne_defaut', e.target.value)}>
            {TEMPLATES_FNE.map(t => <option key={t} value={t}>{t} {t === 'B2B' ? '(Entreprise)' : t === 'B2G' ? '(État)' : t === 'B2C' ? '(Particulier)' : '(International)'}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Notes internes">
        <textarea
          style={{ ...S.input, minHeight: 60, resize: 'vertical' }}
          value={f.notes || ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="Remarques, conditions particulières…"
        />
      </Field>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button onClick={onCancel} style={S.btnGhost} disabled={loading}>Annuler</button>
        <button
          style={{ ...S.btnPrimary, opacity: loading ? .7 : 1 }}
          disabled={loading || !f.nom?.trim()}
          onClick={() => f.nom?.trim() ? onSave(f) : alert('Le nom est obligatoire.')}
        >
          <Check size={16} />
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

// ── Modal ───────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(27,26,28,.45)',
        zIndex: 50, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', padding: 16, overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%',
          maxWidth: 560, marginTop: 28, marginBottom: 28,
          boxShadow: '0 24px 60px rgba(0,0,0,.25)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #E4DDD6',
        }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={S.iconBtn}><X size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  )
}

// ── Page principale ─────────────────────────────────────────────
export default function ClientsClient({ clients: initial }: { clients: Client[] }) {
  const router = useRouter()
  const supabase = createClient()

  const [clients, setClients] = useState<Client[]>(initial)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filtrage
  const filtered = useMemo(() =>
    clients.filter(c =>
      [c.nom, c.contact, c.telephone, c.email, c.adresse, c.ncc]
        .join(' ').toLowerCase()
        .includes(q.toLowerCase())
    ), [clients, q])

  // Créer
  const handleCreate = async (data: ClientInsert) => {
    setLoading(true); setError('')
    const { data: created, error } = await supabase
      .from('clients').insert(data).select().single()
    setLoading(false)
    if (error) { setError(error.message); return }
    setClients(prev => [created, ...prev])
    setModal(null)
    router.refresh()
  }

  // Modifier
  const handleUpdate = async (data: ClientInsert) => {
    if (!selected) return
    setLoading(true); setError('')
    const { data: updated, error } = await supabase
      .from('clients').update(data).eq('id', selected.id).select().single()
    setLoading(false)
    if (error) { setError(error.message); return }
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
    setModal(null); setSelected(null)
    router.refresh()
  }

  // Supprimer
  const handleDelete = async (client: Client) => {
    if (!confirm(`Supprimer le client "${client.nom}" ?`)) return
    const { error } = await supabase.from('clients').delete().eq('id', client.id)
    if (error) { alert(error.message); return }
    setClients(prev => prev.filter(c => c.id !== client.id))
    router.refresh()
  }

  const openEdit = (c: Client) => { setSelected(c); setModal('edit') }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Clients</h1>
        <p style={{ color: '#7A736C', fontSize: 14, margin: '4px 0 0' }}>
          {clients.length} client{clients.length > 1 ? 's' : ''} enregistré{clients.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#7A736C' }} />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Rechercher un client…"
            style={{ ...S.input, paddingLeft: 36 }}
          />
        </div>
        <button style={S.btnPrimary} onClick={() => { setSelected(null); setModal('create') }}>
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Tableau */}
      <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
            <thead>
              <tr style={{ background: '#F6F4F1' }}>
                {['Client', 'Contact', 'Téléphone', 'Type', 'FNE', 'Ajouté le', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '11px 16px',
                    fontSize: 11, fontWeight: 700, color: '#7A736C',
                    textTransform: 'uppercase', letterSpacing: '.3px', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid #E4DDD6' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.nom}</div>
                    {c.email && (
                      <div style={{ fontSize: 12, color: '#7A736C', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Mail size={11} />{c.email}
                      </div>
                    )}
                    {c.ncc && (
                      <div style={{ fontSize: 11, color: '#7A736C', marginTop: 2 }}>NCC : {c.ncc}</div>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13 }}>
                    {c.contact || '—'}
                    {c.adresse && (
                      <div style={{ fontSize: 11, color: '#7A736C', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                        <MapPin size={10} />{c.adresse}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13 }}>
                    {c.telephone ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Phone size={13} style={{ color: '#7A736C' }} />{c.telephone}
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 11, fontWeight: 600, padding: '3px 10px',
                      borderRadius: 999,
                    }} className={TYPE_COLORS[c.type] || ''}>
                      {c.type === 'Entreprise' ? <Building2 size={11} /> : <Users size={11} />}
                      {c.type}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 6,
                      background: '#e5edf8', color: '#2A5FA5',
                    }}>
                      {c.template_fne_defaut}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#7A736C', whiteSpace: 'nowrap' }}>
                    {formatDateFR(c.created_at.slice(0, 10))}
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(c)} style={S.iconBtn} title="Modifier">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      style={{ ...S.iconBtn, color: '#D14343' }}
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: '#7A736C', fontSize: 14 }}>
            {q ? `Aucun résultat pour "${q}"` : 'Aucun client. Créez le premier !'}
          </div>
        )}
      </div>

      {/* Stats rapides */}
      {clients.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
          {TYPES.map(type => {
            const count = clients.filter(c => c.type === type).length
            if (!count) return null
            return (
              <div key={type} style={{
                background: '#fff', border: '1px solid #E4DDD6',
                borderRadius: 10, padding: '8px 14px',
                fontSize: 12, color: '#7A736C',
              }}>
                <strong style={{ color: '#1B1A1C' }}>{count}</strong> {type}{count > 1 ? 's' : ''}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Créer */}
      {modal === 'create' && (
        <Modal title="Nouveau client" onClose={() => setModal(null)}>
          <ClientForm
            initial={EMPTY_FORM}
            onSave={handleCreate}
            onCancel={() => setModal(null)}
            loading={loading}
          />
        </Modal>
      )}

      {/* Modal Modifier */}
      {modal === 'edit' && selected && (
        <Modal title={`Modifier — ${selected.nom}`} onClose={() => { setModal(null); setSelected(null) }}>
          <ClientForm
            initial={selected}
            onSave={handleUpdate}
            onCancel={() => { setModal(null); setSelected(null) }}
            loading={loading}
          />
        </Modal>
      )}
    </div>
  )
}
