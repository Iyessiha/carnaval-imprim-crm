'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/any'
import { formatDateFR } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import { Check, Pencil, Trash2, Phone, Mail } from 'lucide-react'

type Fournisseur = {
  id: string; nom: string; contact: string | null; telephone: string | null
  email: string | null; adresse: string | null; produits_fournis: string | null
  notes: string | null; created_at: string
}

export default function FournisseursClient({ fournisseurs: initial }: { fournisseurs: Fournisseur[] }) {
  const router = useRouter()
  const [fournisseurs, setFournisseurs] = useState(initial)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [sel, setSel] = useState<Fournisseur | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(() =>
    fournisseurs.filter(f => (f.nom + (f.contact || '') + (f.produits_fournis || '')).toLowerCase().includes(q.toLowerCase())),
    [fournisseurs, q])

  const EMPTY = { nom: '', contact: '', telephone: '', email: '', adresse: '', produits_fournis: '', notes: '' }
  const [form, setForm] = useState(EMPTY)
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const toBody = () => ({
    nom: form.nom,
    contact: form.contact || null,
    telephone: form.telephone || null,
    email: form.email || null,
    adresse: form.adresse || null,
    produits_fournis: form.produits_fournis || null,
    notes: form.notes || null,
  })

  const save = async () => {
    if (!form.nom.trim()) { setError('Le nom est obligatoire.'); return }
    setLoading(true); setError('')
    const sb = getSupabase()
    if (sel?.id) {
      const { error: e } = await sb.from('fournisseurs').update(toBody()).eq('id', sel.id)
      if (e) { setError(e.message); setLoading(false); return }
      setFournisseurs(prev => prev.map(f => f.id === sel.id ? { ...f, ...toBody() } : f))
    } else {
      const { data, error: e } = await sb.from('fournisseurs').insert(toBody()).select().single()
      if (e) { setError(e.message); setLoading(false); return }
      setFournisseurs(prev => [data as Fournisseur, ...prev])
    }
    setLoading(false); setModal(null); setSel(null); router.refresh()
  }

  const del = async (f: Fournisseur) => {
    if (!confirm(`Supprimer "${f.nom}" ?`)) return
    const sb = getSupabase()
    await sb.from('fournisseurs').delete().eq('id', f.id)
    setFournisseurs(prev => prev.filter(x => x.id !== f.id)); router.refresh()
  }

  const formValue = sel ? {
    nom: sel.nom, contact: sel.contact || '', telephone: sel.telephone || '',
    email: sel.email || '', adresse: sel.adresse || '',
    produits_fournis: sel.produits_fournis || '', notes: sel.notes || '',
  } : EMPTY

  const FormContent = (
    <div>
      {error && <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
      <Field label="Nom / Raison sociale *">
        <input style={inputStyle} value={form.nom} onChange={e => setF('nom', e.target.value)} placeholder="Ex: Imprimerie XYZ" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Contact"><input style={inputStyle} value={form.contact} onChange={e => setF('contact', e.target.value)} /></Field>
        <Field label="Téléphone"><input style={inputStyle} value={form.telephone} onChange={e => setF('telephone', e.target.value)} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="E-mail"><input type="email" style={inputStyle} value={form.email} onChange={e => setF('email', e.target.value)} /></Field>
        <Field label="Adresse"><input style={inputStyle} value={form.adresse} onChange={e => setF('adresse', e.target.value)} /></Field>
      </div>
      <Field label="Produits / Services fournis">
        <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
          value={form.produits_fournis}
          onChange={e => setF('produits_fournis', e.target.value)}
          placeholder="Ex: Papier offset, consommables, sous-traitance numérique…" />
      </Field>
      <Field label="Notes">
        <textarea style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} value={form.notes} onChange={e => setF('notes', e.target.value)} />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <BtnGhost onClick={() => { setModal(null); setSel(null) }}>Annuler</BtnGhost>
        <BtnPrimary onClick={save} disabled={loading}><Check size={16} />{loading ? '…' : 'Enregistrer'}</BtnPrimary>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Fournisseurs"
        subtitle={`${fournisseurs.length} fournisseur${fournisseurs.length > 1 ? 's' : ''}`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher un fournisseur…"
        onAdd={() => { setError(''); setForm(EMPTY); setModal('create') }} addLabel="Nouveau fournisseur"
      />
      <TableWrap minWidth={720}>
        <thead><tr>
          {['Fournisseur', 'Contact', 'Téléphone / Email', 'Produits fournis', 'Depuis', ''].map(h => <th key={h} style={th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map(f => (
            <tr key={f.id}>
              <td style={td}>
                <div style={{ fontWeight: 600 }}>{f.nom}</div>
                {f.adresse && <div style={{ fontSize: 11, color: '#7A736C', marginTop: 2 }}>{f.adresse}</div>}
              </td>
              <td style={{ ...td, fontSize: 13 }}>{f.contact || '—'}</td>
              <td style={td}>
                {f.telephone && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}><Phone size={12} style={{ color: '#7A736C' }} />{f.telephone}</div>}
                {f.email && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#7A736C', marginTop: 2 }}><Mail size={11} />{f.email}</div>}
                {!f.telephone && !f.email && '—'}
              </td>
              <td style={{ ...td, fontSize: 12, color: '#7A736C', maxWidth: 200 }}>
                {f.produits_fournis ? f.produits_fournis.slice(0, 60) + (f.produits_fournis.length > 60 ? '…' : '') : '—'}
              </td>
              <td style={{ ...td, fontSize: 12, color: '#7A736C', whiteSpace: 'nowrap' }}>{formatDateFR(f.created_at.slice(0, 10))}</td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <BtnIcon onClick={() => { setError(''); setSel(f); setForm(formValue); setModal('edit') }}><Pencil size={16} /></BtnIcon>
                <BtnIcon onClick={() => del(f)} danger><Trash2 size={16} /></BtnIcon>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <EmptyRow text="Aucun fournisseur." cols={6} />}
        </tbody>
      </TableWrap>
      {modal === 'create' && <Modal title="Nouveau fournisseur" onClose={() => { setModal(null); setError('') }} wide>{FormContent}</Modal>}
      {modal === 'edit' && sel && <Modal title={`Modifier — ${sel.nom}`} onClose={() => { setModal(null); setSel(null); setError('') }} wide>{FormContent}</Modal>}
    </div>
  )
}
