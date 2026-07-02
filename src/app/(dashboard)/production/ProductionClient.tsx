'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/any'
import { formatDateFR, today } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import { Check, Pencil, Trash2, Eye, Plus } from 'lucide-react'

const STATUTS = ['En attente', 'En production', 'Terminé', 'Livré'] as const
const NATURES = ['PRODUCTION', 'SOUS-TRAITANCE', 'ECHANTILLON'] as const

type Production = {
  id: string; date: string; nature: string; caracteristique: string
  type_impression_id: string | null; papier: string | null
  recto_verso: boolean; nb_pages: number | null; finition: string | null
  format: string | null; quantite: number; statut: string
  date_livraison_prevue: string | null; client_id: string | null
  notes: string | null; created_at: string
  clients: { nom: string } | null
  types_impression: { libelle: string } | null
}
type Client = { id: string; nom: string }
type Type = { id: string; libelle: string }
type Profile = { id: string; nom: string }

export default function ProductionClient({ productions: initial, clients, types, profiles }: {
  productions: Production[]; clients: Client[]; types: Type[]; profiles: Profile[]
}) {
  const router = useRouter()
  const [productions, setProductions] = useState(initial)
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState('Tous')
  const [modal, setModal] = useState<'create' | 'edit' | 'view' | null>(null)
  const [sel, setSel] = useState<Production | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(() => productions
    .filter(p => filtre === 'Tous' || p.statut === filtre)
    .filter(p => (p.caracteristique + (p.clients?.nom || '') + p.format).toLowerCase().includes(q.toLowerCase())),
    [productions, q, filtre])

  const emptyForm = {
    date: today(), nature: 'PRODUCTION', caracteristique: '',
    type_impression_id: types[0]?.id || '', papier: '',
    recto_verso: false, nb_pages: null, finition: '', format: '',
    quantite: 1, statut: 'En attente', date_livraison_prevue: '',
    client_id: '', notes: '',
  }
  const [form, setForm] = useState<Partial<Production>>(emptyForm)
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const openCreate = () => { setError(''); setForm(emptyForm); setModal('create') }
  const openEdit = (p: Production) => { setError(''); setSel(p); setForm({ ...p }); setModal('edit') }
  const openView = (p: Production) => { setSel(p); setModal('view') }

  const save = async () => {
    if (!form.caracteristique?.trim()) { setError('La caractéristique est obligatoire.'); return }
    setLoading(true); setError('')
    const sb = getSupabase()
    const body = {
      date: form.date || today(),
      nature: form.nature || 'PRODUCTION',
      caracteristique: form.caracteristique,
      type_impression_id: form.type_impression_id || null,
      papier: form.papier || null,
      recto_verso: form.recto_verso || false,
      nb_pages: form.nb_pages || null,
      finition: form.finition || null,
      format: form.format || null,
      quantite: form.quantite || 1,
      statut: form.statut || 'En attente',
      date_livraison_prevue: form.date_livraison_prevue || null,
      client_id: form.client_id || null,
      notes: form.notes || null,
    }

    if (sel?.id) {
      const { error: e } = await sb.from('productions').update(body).eq('id', sel.id)
      if (e) { setError(e.message); setLoading(false); return }
      const client = clients.find(c => c.id === form.client_id)
      const type = types.find(t => t.id === form.type_impression_id)
      setProductions(prev => prev.map(p => p.id === sel.id ? {
        ...p, ...body,
        clients: client ? { nom: client.nom } : null,
        types_impression: type ? { libelle: type.libelle } : null,
      } : p))
    } else {
      const { data, error: e } = await sb.from('productions').insert(body).select().single()
      if (e) { setError(e.message); setLoading(false); return }
      const client = clients.find(c => c.id === form.client_id)
      const type = types.find(t => t.id === form.type_impression_id)
      setProductions(prev => [{ ...data, clients: client ? { nom: client.nom } : null, types_impression: type ? { libelle: type.libelle } : null }, ...prev])
    }
    setLoading(false); setModal(null); setSel(null); router.refresh()
  }

  const del = async (p: Production) => {
    if (!confirm(`Supprimer cet ordre de production ?`)) return
    const sb = getSupabase()
    await sb.from('productions').delete().eq('id', p.id)
    setProductions(prev => prev.filter(x => x.id !== p.id)); router.refresh()
  }

  const updateStatut = async (p: Production, statut: string) => {
    const sb = getSupabase()
    await sb.from('productions').update({ statut }).eq('id', p.id)
    setProductions(prev => prev.map(x => x.id === p.id ? { ...x, statut } : x))
    router.refresh()
  }

  const FormContent = (
    <div>
      {error && <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Date"><input type="date" style={inputStyle} value={form.date || today()} onChange={e => setF('date', e.target.value)} /></Field>
        <Field label="Nature">
          <select style={inputStyle} value={form.nature || 'PRODUCTION'} onChange={e => setF('nature', e.target.value)}>
            {NATURES.map(n => <option key={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Statut">
          <select style={inputStyle} value={form.statut || 'En attente'} onChange={e => setF('statut', e.target.value)}>
            {STATUTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Caractéristique / Description *">
        <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
          value={form.caracteristique || ''}
          onChange={e => setF('caracteristique', e.target.value)}
          placeholder="Ex: Brochure dos carré collé — SYNTHESE PND — couv 250g offset 80g recto-verso 50 pages"
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Client">
          <select style={inputStyle} value={form.client_id || ''} onChange={e => setF('client_id', e.target.value)}>
            <option value="">— Sans client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </Field>
        <Field label="Type d'impression">
          <select style={inputStyle} value={form.type_impression_id || ''} onChange={e => setF('type_impression_id', e.target.value)}>
            <option value="">— Sélectionner —</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.libelle}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Format fini"><input style={inputStyle} value={form.format || ''} onChange={e => setF('format', e.target.value)} placeholder="Ex: 21x29,7cm" /></Field>
        <Field label="Quantité"><input type="number" min="1" style={inputStyle} value={form.quantite || 1} onChange={e => setF('quantite', Number(e.target.value))} /></Field>
        <Field label="Livraison prévue"><input type="date" style={inputStyle} value={form.date_livraison_prevue || ''} onChange={e => setF('date_livraison_prevue', e.target.value)} /></Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Papier / Support"><input style={inputStyle} value={form.papier || ''} onChange={e => setF('papier', e.target.value)} placeholder="Ex: Couché 250g" /></Field>
        <Field label="Finition"><input style={inputStyle} value={form.finition || ''} onChange={e => setF('finition', e.target.value)} placeholder="Ex: Soft touch, Vernis" /></Field>
        <Field label="Nb pages"><input type="number" min="0" style={inputStyle} value={form.nb_pages || ''} onChange={e => setF('nb_pages', e.target.value ? Number(e.target.value) : null)} placeholder="0" /></Field>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 14, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.recto_verso || false} onChange={e => setF('recto_verso', e.target.checked)} />
        Recto-verso
      </label>

      <Field label="Notes internes">
        <textarea style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} value={form.notes || ''} onChange={e => setF('notes', e.target.value)} />
      </Field>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
        <BtnGhost onClick={() => { setModal(null); setSel(null) }}>Annuler</BtnGhost>
        <BtnPrimary onClick={save} disabled={loading}><Check size={16} />{loading ? 'Enregistrement…' : 'Enregistrer'}</BtnPrimary>
      </div>
    </div>
  )

  // Stats
  const stats = STATUTS.map(s => ({ label: s, count: productions.filter(p => p.statut === s).length }))

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Production"
        subtitle={`${productions.length} ordres · ${productions.filter(p => p.statut === 'En production').length} en cours`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher un ordre…"
        onAdd={openCreate} addLabel="Nouvel ordre"
        extra={
          <select value={filtre} onChange={e => setFiltre(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '10px 14px' }}>
            {['Tous', ...STATUTS].map(s => <option key={s}>{s}</option>)}
          </select>
        }
      />

      {/* Stats rapides */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {stats.map(s => (
          <div key={s.label} onClick={() => setFiltre(s.label === filtre ? 'Tous' : s.label)}
            style={{ background: '#fff', border: `1px solid ${filtre === s.label ? '#C2117A' : '#E4DDD6'}`, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
            <Badge value={s.label} /> <strong style={{ marginLeft: 6 }}>{s.count}</strong>
          </div>
        ))}
      </div>

      <TableWrap minWidth={920}>
        <thead><tr>
          {['Date', 'Caractéristique', 'Client', 'Format', 'Qté', 'Type', 'Livraison', 'Statut', ''].map(h => <th key={h} style={th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map(p => {
            const retard = p.date_livraison_prevue && new Date(p.date_livraison_prevue) < new Date() && p.statut !== 'Livré'
            return (
              <tr key={p.id}>
                <td style={{ ...td, whiteSpace: 'nowrap', fontSize: 12 }}>{formatDateFR(p.date)}</td>
                <td style={td}>
                  <div style={{ fontWeight: 600, fontSize: 13, maxWidth: 280 }}>{p.caracteristique.slice(0, 60)}{p.caracteristique.length > 60 ? '…' : ''}</div>
                  <div style={{ fontSize: 11, color: '#7A736C', marginTop: 2 }}>
                    {p.recto_verso ? 'R/V' : 'Recto'}{p.nb_pages ? ` · ${p.nb_pages}p` : ''}{p.finition ? ` · ${p.finition}` : ''}
                  </div>
                </td>
                <td style={{ ...td, fontSize: 12 }}>{p.clients?.nom || '—'}</td>
                <td style={{ ...td, fontSize: 12, whiteSpace: 'nowrap' }}>{p.format || '—'}</td>
                <td style={{ ...td, fontWeight: 700 }}>{p.quantite?.toLocaleString('fr-FR')}</td>
                <td style={{ ...td, fontSize: 12 }}>{p.types_impression?.libelle || '—'}</td>
                <td style={{ ...td, fontSize: 12, whiteSpace: 'nowrap', color: retard ? '#D14343' : '#7A736C', fontWeight: retard ? 700 : 400 }}>
                  {p.date_livraison_prevue ? formatDateFR(p.date_livraison_prevue) : '—'}{retard ? ' ⚠️' : ''}
                </td>
                <td style={td}>
                  <select value={p.statut}
                    onChange={e => updateStatut(p, e.target.value)}
                    style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 8, border: '1px solid #E4DDD6', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}>
                    {STATUTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <BtnIcon onClick={() => openView(p)} title="Détail"><Eye size={16} /></BtnIcon>
                  <BtnIcon onClick={() => openEdit(p)} title="Modifier"><Pencil size={16} /></BtnIcon>
                  <BtnIcon onClick={() => del(p)} danger title="Supprimer"><Trash2 size={16} /></BtnIcon>
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && <EmptyRow text="Aucun ordre de production." cols={9} />}
        </tbody>
      </TableWrap>

      {modal === 'create' && <Modal title="Nouvel ordre de production" onClose={() => { setModal(null); setError('') }} wide>{FormContent}</Modal>}
      {modal === 'edit' && sel && <Modal title={`Modifier — ${sel.caracteristique.slice(0, 40)}`} onClose={() => { setModal(null); setSel(null); setError('') }} wide>{FormContent}</Modal>}

      {modal === 'view' && sel && (
        <Modal title="Détail de production" onClose={() => { setModal(null); setSel(null) }} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {[
              ['Date', formatDateFR(sel.date)],
              ['Nature', sel.nature],
              ['Client', sel.clients?.nom || '—'],
              ['Type', sel.types_impression?.libelle || '—'],
              ['Format', sel.format || '—'],
              ['Quantité', sel.quantite?.toLocaleString('fr-FR')],
              ['Papier', sel.papier || '—'],
              ['Finition', sel.finition || '—'],
              ['Recto-verso', sel.recto_verso ? 'Oui' : 'Non'],
              ['Nb pages', sel.nb_pages?.toString() || '—'],
              ['Livraison prévue', sel.date_livraison_prevue ? formatDateFR(sel.date_livraison_prevue) : '—'],
              ['Statut', sel.statut],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#F6F4F1', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 6 }}>Caractéristique</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{sel.caracteristique}</div>
          </div>
          {sel.notes && (
            <div style={{ background: '#FEF3E2', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 14 }}>{sel.notes}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {STATUTS.map(s => s !== sel.statut && (
              <BtnGhost key={s} onClick={() => { updateStatut(sel, s); setModal(null) }}>→ {s}</BtnGhost>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
