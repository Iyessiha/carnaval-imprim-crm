'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDateFR } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, X, Check, Users, Building2, Phone, Mail, MapPin } from 'lucide-react'

// ── Types locaux stricts ────────────────────────────────────────
interface Client {
  id: string
  nom: string
  contact: string | null
  telephone: string | null
  email: string | null
  adresse: string | null
  ncc: string | null
  type: string
  template_fne_defaut: string
  notes: string | null
  created_at: string
  updated_at: string
}

interface ClientForm {
  nom: string
  contact: string
  telephone: string
  email: string
  adresse: string
  ncc: string
  type: string
  template_fne_defaut: string
  notes: string
}

// Helper pour bypasser l'inférence stricte de Supabase sur insert/update
function toRecord(f: ClientForm): Record<string, string | null> {
  return {
    nom: f.nom,
    contact: f.contact || null,
    telephone: f.telephone || null,
    email: f.email || null,
    adresse: f.adresse || null,
    ncc: f.ncc || null,
    type: f.type,
    template_fne_defaut: f.template_fne_defaut,
    notes: f.notes || null,
  }
}

const TYPES = ['Entreprise', 'Institution', 'ONG', 'Particulier'] as const
const TEMPLATES_FNE = ['B2B', 'B2G', 'B2C', 'B2F'] as const

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'Entreprise':  { bg: '#F0E8F8', color: '#7B2FA5' },
  'Institution': { bg: '#E5EDF8', color: '#2A5FA5' },
  'ONG':         { bg: '#E8F7EE', color: '#3A9A5C' },
  'Particulier': { bg: '#F0EEEC', color: '#7A736C' },
}

const S = {
  input: {
    width: '100%', padding: '10px 12px',
    border: '1px solid #E4DDD6', borderRadius: 10,
    fontSize: 14, outline: 'none', background: '#fff',
    fontFamily: 'inherit', color: '#1B1A1C',
  } as React.CSSProperties,
  label: {
    display: 'block', fontSize: 11, fontWeight: 700 as const,
    color: '#7A736C', marginBottom: 6,
    textTransform: 'uppercase' as const, letterSpacing: '.3px',
  } as React.CSSProperties,
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: '#C2117A', color: '#fff', border: 'none',
    padding: '10px 16px', borderRadius: 10,
    fontSize: 13, fontWeight: 600 as const, cursor: 'pointer', fontFamily: 'inherit',
  } as React.CSSProperties,
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: '#fff', color: '#1B1A1C', border: '1px solid #E4DDD6',
    padding: '10px 16px', borderRadius: 10,
    fontSize: 13, fontWeight: 600 as const, cursor: 'pointer', fontFamily: 'inherit',
  } as React.CSSProperties,
  iconBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: '#7A736C', padding: 6, borderRadius: 8,
    display: 'inline-flex', alignItems: 'center',
  } as React.CSSProperties,
}

const EMPTY: ClientForm = {
  nom: '', contact: '', telephone: '', email: '',
  adresse: '', ncc: '', type: 'Entreprise',
  template_fne_defaut: 'B2B', notes: '',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(27,26,28,.45)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, marginTop: 28, marginBottom: 28, boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #E4DDD6' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={S.iconBtn}><X size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  )
}

function ClientFormComp({ value, onSave, onCancel, loading }: {
  value: ClientForm
  onSave: (data: ClientForm) => void
  onCancel: () => void
  loading: boolean
}) {
  const [f, setF] = useState<ClientForm>(value)
  const set = (k: keyof ClientForm, v: string) => setF(p => ({ ...p, [k]: v }))

  return (
    <div>
      <Field label="Nom / Raison sociale *">
        <input style={S.input} value={f.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: Global Business Solutions" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Contact">
          <input style={S.input} value={f.contact} onChange={e => set('contact', e.target.value)} placeholder="M. Koffi" />
        </Field>
        <Field label="Téléphone">
          <input style={S.input} value={f.telephone} onChange={e => set('telephone', e.target.value)} placeholder="07 07 07 07 07" />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="E-mail">
          <input style={S.input} type="email" value={f.email} onChange={e => set('email', e.target.value)} placeholder="contact@client.ci" />
        </Field>
        <Field label="Type">
          <select style={S.input} value={f.type} onChange={e => set('type', e.target.value)}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Adresse">
        <input style={S.input} value={f.adresse} onChange={e => set('adresse', e.target.value)} placeholder="Plateau, Abidjan" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="NCC (compte contribuable)">
          <input style={S.input} value={f.ncc} onChange={e => set('ncc', e.target.value)} placeholder="4501234567A" />
        </Field>
        <Field label="Template FNE par défaut">
          <select style={S.input} value={f.template_fne_defaut} onChange={e => set('template_fne_defaut', e.target.value)}>
            {TEMPLATES_FNE.map(t => (
              <option key={t} value={t}>
                {t} {t === 'B2B' ? '(Entreprise)' : t === 'B2G' ? '(État)' : t === 'B2C' ? '(Particulier)' : '(International)'}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notes internes">
        <textarea
          style={{ ...S.input, minHeight: 60, resize: 'vertical' }}
          value={f.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Remarques, conditions particulières…"
        />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button onClick={onCancel} style={S.btnGhost} disabled={loading}>Annuler</button>
        <button
          style={{ ...S.btnPrimary, opacity: loading ? .7 : 1 }}
          disabled={loading || !f.nom.trim()}
          onClick={() => f.nom.trim() ? onSave(f) : alert('Le nom est obligatoire.')}
        >
          <Check size={16} />
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default function ClientsClient({ clients: initial }: { clients: Client[] }) {
  const router = useRouter()
  const supabase = createClient()

  const [clients, setClients] = useState<Client[]>(initial)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(() =>
    clients.filter(c =>
      [c.nom, c.contact, c.telephone, c.email, c.adresse, c.ncc]
        .join(' ').toLowerCase().includes(q.toLowerCase())
    ), [clients, q])

  const handleCreate = async (form: ClientForm) => {
    setLoading(true); setError('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: e } = await (supabase.from('clients') as any)
      .insert(toRecord(form))
      .select()
      .single()
    setLoading(false)
    if (e) { setError(e.message); return }
    setClients(prev => [data as Client, ...prev])
    setModal(null); router.refresh()
  }

  const handleUpdate = async (form: ClientForm) => {
    if (!selected) return
    setLoading(true); setError('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: e } = await (supabase.from('clients') as any)
      .update(toRecord(form))
      .eq('id', selected.id)
      .select()
      .single()
    setLoading(false)
    if (e) { setError(e.message); return }
    setClients(prev => prev.map(c => c.id === (data as Client).id ? (data as Client) : c))
    setModal(null); setSelected(null); router.refresh()
  }

  const handleDelete = async (client: Client) => {
    if (!confirm(`Supprimer le client "${client.nom}" ?`)) return
    const { error: e } = await supabase.from('clients').delete().eq('id', client.id)
    if (e) { alert(e.message); return }
    setClients(prev => prev.filter(c => c.id !== client.id)); router.refresh()
  }

  const th: React.CSSProperties = {
    textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700,
    color: '#7A736C', textTransform: 'uppercase', letterSpacing: '.3px',
    whiteSpace: 'nowrap', background: '#F6F4F1'
  }
  const td: React.CSSProperties = {
    padding: '13px 16px', fontSize: 13,
    borderTop: '1px solid #E4DDD6', verticalAlign: 'middle'
  }

  const formValue = selected ? {
    nom: selected.nom,
    contact: selected.contact || '',
    telephone: selected.telephone || '',
    email: selected.email || '',
    adresse: selected.adresse || '',
    ncc: selected.ncc || '',
    type: selected.type,
    template_fne_defaut: selected.template_fne_defaut,
    notes: selected.notes || '',
  } : EMPTY

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Clients</h1>
        <p style={{ color: '#7A736C', fontSize: 14, margin: '4px 0 0' }}>
          {clients.length} client{clients.length > 1 ? 's' : ''} enregistré{clients.length > 1 ? 's' : ''}
        </p>
      </div>

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

      {error && (
        <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
            <thead>
              <tr>
                <th style={th}>Client</th>
                <th style={th}>Contact</th>
                <th style={th}>Téléphone</th>
                <th style={th}>Type</th>
                <th style={th}>FNE</th>
                <th style={th}>Ajouté le</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const tc = TYPE_COLORS[c.type] || TYPE_COLORS['Particulier']
                return (
                  <tr key={c.id}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{c.nom}</div>
                      {c.email && (
                        <div style={{ fontSize: 12, color: '#7A736C', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Mail size={11} />{c.email}
                        </div>
                      )}
                      {c.ncc && <div style={{ fontSize: 11, color: '#7A736C', marginTop: 2 }}>NCC : {c.ncc}</div>}
                    </td>
                    <td style={td}>
                      {c.contact || '—'}
                      {c.adresse && (
                        <div style={{ fontSize: 11, color: '#7A736C', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          <MapPin size={10} />{c.adresse}
                        </div>
                      )}
                    </td>
                    <td style={td}>
                      {c.telephone
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={13} style={{ color: '#7A736C' }} />{c.telephone}</div>
                        : '—'}
                    </td>
                    <td style={td}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: tc.bg, color: tc.color }}>
                        {c.type === 'Entreprise' ? <Building2 size={11} /> : <Users size={11} />}
                        {c.type}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#e5edf8', color: '#2A5FA5' }}>
                        {c.template_fne_defaut}
                      </span>
                    </td>
                    <td style={{ ...td, fontSize: 12, color: '#7A736C', whiteSpace: 'nowrap' }}>
                      {formatDateFR(c.created_at.slice(0, 10))}
                    </td>
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => { setSelected(c); setModal('edit') }} style={S.iconBtn} title="Modifier">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(c)} style={{ ...S.iconBtn, color: '#D14343' }} title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: '#7A736C', fontSize: 14 }}>
            {q ? `Aucun résultat pour "${q}"` : 'Aucun client. Créez le premier !'}
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {TYPES.map(type => {
          const count = clients.filter(c => c.type === type).length
          if (!count) return null
          return (
            <span key={type} style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 10, padding: '6px 14px', fontSize: 12, color: '#7A736C' }}>
              <strong style={{ color: '#1B1A1C' }}>{count}</strong> {type}{count > 1 ? 's' : ''}
            </span>
          )
        })}
      </div>

      {modal === 'create' && (
        <Modal title="Nouveau client" onClose={() => setModal(null)}>
          <ClientFormComp value={EMPTY} onSave={handleCreate} onCancel={() => setModal(null)} loading={loading} />
        </Modal>
      )}

      {modal === 'edit' && selected && (
        <Modal title={`Modifier — ${selected.nom}`} onClose={() => { setModal(null); setSelected(null) }}>
          <ClientFormComp
            value={formValue}
            onSave={handleUpdate}
            onCancel={() => { setModal(null); setSelected(null) }}
            loading={loading}
          />
        </Modal>
      )}
    </div>
  )
}
