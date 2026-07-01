'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/any'
import { formatDateFR } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, X, Check, Users, Building2, Phone, Mail, MapPin } from 'lucide-react'

interface Client {
  id: string; nom: string; contact: string | null; telephone: string | null
  email: string | null; adresse: string | null; ncc: string | null
  type: string; template_fne_defaut: string; notes: string | null
  created_at: string; updated_at: string
}
interface ClientForm {
  nom: string; contact: string; telephone: string; email: string
  adresse: string; ncc: string; type: string; template_fne_defaut: string; notes: string
}

const TYPES = ['Entreprise', 'Institution', 'ONG', 'Particulier'] as const
const TEMPLATES = ['B2B', 'B2G', 'B2C', 'B2F'] as const
const TC: Record<string, { bg: string; color: string }> = {
  'Entreprise': { bg: '#F0E8F8', color: '#7B2FA5' },
  'Institution': { bg: '#E5EDF8', color: '#2A5FA5' },
  'ONG': { bg: '#E8F7EE', color: '#3A9A5C' },
  'Particulier': { bg: '#F0EEEC', color: '#7A736C' },
}
const SI: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #E4DDD6', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit', color: '#1B1A1C' }
const SL: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#7A736C', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.3px' }
const BP: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, background: '#C2117A', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const BG: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', color: '#1B1A1C', border: '1px solid #E4DDD6', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const BI: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', color: '#7A736C', padding: 6, borderRadius: 8, display: 'inline-flex', alignItems: 'center' }
const EMPTY: ClientForm = { nom: '', contact: '', telephone: '', email: '', adresse: '', ncc: '', type: 'Entreprise', template_fne_defaut: 'B2B', notes: '' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={SL}>{label}</label>{children}</div>
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(27,26,28,.45)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, marginTop: 28, marginBottom: 28, boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #E4DDD6' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={BI}><X size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  )
}
function Form({ value, onSave, onCancel, loading }: { value: ClientForm; onSave: (d: ClientForm) => void; onCancel: () => void; loading: boolean }) {
  const [f, setF] = useState<ClientForm>(value)
  const s = (k: keyof ClientForm, v: string) => setF(p => ({ ...p, [k]: v }))
  return (
    <div>
      <Field label="Nom *"><input style={SI} value={f.nom} onChange={e => s('nom', e.target.value)} placeholder="Ex: Global Business Solutions" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Contact"><input style={SI} value={f.contact} onChange={e => s('contact', e.target.value)} /></Field>
        <Field label="Téléphone"><input style={SI} value={f.telephone} onChange={e => s('telephone', e.target.value)} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="E-mail"><input style={SI} type="email" value={f.email} onChange={e => s('email', e.target.value)} /></Field>
        <Field label="Type"><select style={SI} value={f.type} onChange={e => s('type', e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
      </div>
      <Field label="Adresse"><input style={SI} value={f.adresse} onChange={e => s('adresse', e.target.value)} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="NCC"><input style={SI} value={f.ncc} onChange={e => s('ncc', e.target.value)} placeholder="4501234567A" /></Field>
        <Field label="Template FNE">
          <select style={SI} value={f.template_fne_defaut} onChange={e => s('template_fne_defaut', e.target.value)}>
            {TEMPLATES.map(t => <option key={t} value={t}>{t} {t==='B2B'?'(Entreprise)':t==='B2G'?'(État)':t==='B2C'?'(Particulier)':'(International)'}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Notes"><textarea style={{ ...SI, minHeight: 60, resize: 'vertical' }} value={f.notes} onChange={e => s('notes', e.target.value)} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button onClick={onCancel} style={BG} disabled={loading}>Annuler</button>
        <button style={{ ...BP, opacity: loading ? .7 : 1 }} disabled={loading || !f.nom.trim()} onClick={() => f.nom.trim() ? onSave(f) : alert('Nom obligatoire.')}>
          <Check size={16} />{loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default function ClientsClient({ clients: initial }: { clients: Client[] }) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>(initial)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [sel, setSel] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const filtered = useMemo(() => clients.filter(c => [c.nom,c.contact,c.telephone,c.email,c.adresse,c.ncc].join(' ').toLowerCase().includes(q.toLowerCase())), [clients, q])

  const toRecord = (f: ClientForm) => ({ nom: f.nom, contact: f.contact||null, telephone: f.telephone||null, email: f.email||null, adresse: f.adresse||null, ncc: f.ncc||null, type: f.type, template_fne_defaut: f.template_fne_defaut, notes: f.notes||null })

  const create = async (form: ClientForm) => {
    setLoading(true); setError('')
    const sb = getSupabase()
    const { data, error: e } = await sb.from('clients').insert(toRecord(form)).select().single()
    setLoading(false)
    if (e) { setError(e.message); return }
    setClients(prev => [data as Client, ...prev]); setModal(null); router.refresh()
  }
  const update = async (form: ClientForm) => {
    if (!sel) return
    setLoading(true); setError('')
    const sb = getSupabase()
    const { data, error: e } = await sb.from('clients').update(toRecord(form)).eq('id', sel.id).select().single()
    setLoading(false)
    if (e) { setError(e.message); return }
    setClients(prev => prev.map(c => c.id === (data as Client).id ? (data as Client) : c)); setModal(null); setSel(null); router.refresh()
  }
  const del = async (c: Client) => {
    if (!confirm(`Supprimer "${c.nom}" ?`)) return
    const sb = getSupabase()
    const { error: e } = await sb.from('clients').delete().eq('id', c.id)
    if (e) { alert(e.message); return }
    setClients(prev => prev.filter(x => x.id !== c.id)); router.refresh()
  }

  const TH: React.CSSProperties = { textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase', letterSpacing: '.3px', whiteSpace: 'nowrap', background: '#F6F4F1' }
  const TD: React.CSSProperties = { padding: '13px 16px', fontSize: 13, borderTop: '1px solid #E4DDD6', verticalAlign: 'middle' }
  const fv = sel ? { nom: sel.nom, contact: sel.contact||'', telephone: sel.telephone||'', email: sel.email||'', adresse: sel.adresse||'', ncc: sel.ncc||'', type: sel.type, template_fne_defaut: sel.template_fne_defaut, notes: sel.notes||'' } : EMPTY

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Clients</h1>
        <p style={{ color: '#7A736C', fontSize: 14, margin: '4px 0 0' }}>{clients.length} client{clients.length>1?'s':''}</p>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#7A736C' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher…" style={{ ...SI, paddingLeft: 36 }} />
        </div>
        <button style={BP} onClick={() => { setSel(null); setModal('create') }}><Plus size={16} /> Nouveau client</button>
      </div>
      {error && <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
      <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
            <thead><tr><th style={TH}>Client</th><th style={TH}>Contact</th><th style={TH}>Téléphone</th><th style={TH}>Type</th><th style={TH}>FNE</th><th style={TH}>Date</th><th style={TH}></th></tr></thead>
            <tbody>
              {filtered.map(c => {
                const tc = TC[c.type] || TC['Particulier']
                return (
                  <tr key={c.id}>
                    <td style={TD}>
                      <div style={{ fontWeight: 600 }}>{c.nom}</div>
                      {c.email && <div style={{ fontSize: 12, color: '#7A736C', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><Mail size={11} />{c.email}</div>}
                      {c.ncc && <div style={{ fontSize: 11, color: '#7A736C', marginTop: 2 }}>NCC : {c.ncc}</div>}
                    </td>
                    <td style={TD}>{c.contact||'—'}{c.adresse&&<div style={{ fontSize: 11, color: '#7A736C', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}><MapPin size={10} />{c.adresse}</div>}</td>
                    <td style={TD}>{c.telephone?<div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={13} style={{ color: '#7A736C' }} />{c.telephone}</div>:'—'}</td>
                    <td style={TD}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: tc.bg, color: tc.color }}>{c.type==='Entreprise'?<Building2 size={11} />:<Users size={11} />}{c.type}</span></td>
                    <td style={TD}><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#e5edf8', color: '#2A5FA5' }}>{c.template_fne_defaut}</span></td>
                    <td style={{ ...TD, fontSize: 12, color: '#7A736C', whiteSpace: 'nowrap' }}>{formatDateFR(c.created_at.slice(0,10))}</td>
                    <td style={{ ...TD, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => { setSel(c); setModal('edit') }} style={BI}><Pencil size={16} /></button>
                      <button onClick={() => del(c)} style={{ ...BI, color: '#D14343' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: '#7A736C', fontSize: 14 }}>{q ? `Aucun résultat pour "${q}"` : 'Aucun client.'}</div>}
      </div>
      {modal === 'create' && <Modal title="Nouveau client" onClose={() => setModal(null)}><Form value={EMPTY} onSave={create} onCancel={() => setModal(null)} loading={loading} /></Modal>}
      {modal === 'edit' && sel && <Modal title={`Modifier — ${sel.nom}`} onClose={() => { setModal(null); setSel(null) }}><Form value={fv} onSave={update} onCancel={() => { setModal(null); setSel(null) }} loading={loading} /></Modal>}
    </div>
  )
}
