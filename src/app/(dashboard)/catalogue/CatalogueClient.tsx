'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/any'
import { formatFCFA } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import { Check, Pencil, Trash2, Package, ToggleLeft, ToggleRight } from 'lucide-react'

const CATEGORIES = ['Supports imprimés', 'Grand format', 'Textile', 'Objets pub', 'Service'] as const
const CAT_COLORS: Record<string, string> = {
  'Supports imprimés': '#E5EDF8',
  'Grand format':      '#E8F7EE',
  'Textile':           '#F0E8F8',
  'Objets pub':        '#FEF3E2',
  'Service':           '#F0EEEC',
}
const CAT_TEXT: Record<string, string> = {
  'Supports imprimés': '#2A5FA5',
  'Grand format':      '#3A9A5C',
  'Textile':           '#7B2FA5',
  'Objets pub':        '#F39200',
  'Service':           '#7A736C',
}

type Produit = {
  id: string; nom: string; categorie: string
  type_impression_id: string | null; prix_base: number; unite: string
  description: string | null; actif: boolean; created_at: string
  types_impression: { libelle: string } | null
}
type Type = { id: string; libelle: string }

export default function CatalogueClient({ produits: initial, types }: {
  produits: Produit[]; types: Type[]
}) {
  const router = useRouter()
  const [produits, setProduits] = useState(initial)
  const [q, setQ] = useState('')
  const [filtreCat, setFiltreCat] = useState('Tous')
  const [filtreActif, setFiltreActif] = useState('Actifs')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [sel, setSel] = useState<Produit | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(() => produits
    .filter(p => filtreCat === 'Tous' || p.categorie === filtreCat)
    .filter(p => filtreActif === 'Tous' || (filtreActif === 'Actifs' ? p.actif : !p.actif))
    .filter(p => (p.nom + (p.description || '')).toLowerCase().includes(q.toLowerCase())),
    [produits, q, filtreCat, filtreActif])

  const emptyForm = { nom: '', categorie: 'Supports imprimés', type_impression_id: '', prix_base: 0, unite: 'unité', description: '', actif: true }
  const [form, setForm] = useState<Partial<Produit>>(emptyForm)
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.nom?.trim()) { setError('Le nom est obligatoire.'); return }
    setLoading(true); setError('')
    const sb = getSupabase()
    const body = {
      nom: form.nom, categorie: form.categorie,
      type_impression_id: form.type_impression_id || null,
      prix_base: form.prix_base || 0,
      unite: form.unite || 'unité',
      description: form.description || null,
      actif: form.actif ?? true,
    }
    if (sel?.id) {
      const { error: e } = await sb.from('produits').update(body).eq('id', sel.id)
      if (e) { setError(e.message); setLoading(false); return }
      const type = types.find(t => t.id === form.type_impression_id)
      setProduits(prev => prev.map(p => p.id === sel.id ? { ...p, ...body, types_impression: type ? { libelle: type.libelle } : null } : p))
    } else {
      const { data, error: e } = await sb.from('produits').insert(body).select().single()
      if (e) { setError(e.message); setLoading(false); return }
      const type = types.find(t => t.id === form.type_impression_id)
      setProduits(prev => [{ ...data, types_impression: type ? { libelle: type.libelle } : null }, ...prev])
    }
    setLoading(false); setModal(null); setSel(null); router.refresh()
  }

  const toggleActif = async (p: Produit) => {
    const sb = getSupabase()
    await sb.from('produits').update({ actif: !p.actif }).eq('id', p.id)
    setProduits(prev => prev.map(x => x.id === p.id ? { ...x, actif: !x.actif } : x))
  }

  const del = async (p: Produit) => {
    if (!confirm(`Supprimer "${p.nom}" ?`)) return
    const sb = getSupabase()
    await sb.from('produits').delete().eq('id', p.id)
    setProduits(prev => prev.filter(x => x.id !== p.id)); router.refresh()
  }

  const FormContent = (
    <div>
      {error && <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
      <Field label="Nom du produit / service *">
        <input style={inputStyle} value={form.nom || ''} onChange={e => setF('nom', e.target.value)} placeholder="Ex: Carte de visite" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Catégorie">
          <select style={inputStyle} value={form.categorie || 'Supports imprimés'} onChange={e => setF('categorie', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Type d'impression">
          <select style={inputStyle} value={form.type_impression_id || ''} onChange={e => setF('type_impression_id', e.target.value)}>
            <option value="">— Aucun —</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.libelle}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Prix de base (FCFA)">
          <input type="number" min="0" style={inputStyle} value={form.prix_base || 0} onChange={e => setF('prix_base', Number(e.target.value))} />
        </Field>
        <Field label="Unité">
          <input style={inputStyle} value={form.unite || ''} onChange={e => setF('unite', e.target.value)} placeholder="unité, m², 100 ex…" />
        </Field>
      </div>
      <Field label="Description">
        <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={form.description || ''} onChange={e => setF('description', e.target.value)} placeholder="Spécifications, formats disponibles…" />
      </Field>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', marginBottom: 14 }}>
        <input type="checkbox" checked={form.actif ?? true} onChange={e => setF('actif', e.target.checked)} />
        Produit actif (visible dans les devis/factures)
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <BtnGhost onClick={() => { setModal(null); setSel(null) }}>Annuler</BtnGhost>
        <BtnPrimary onClick={save} disabled={loading}><Check size={16} />{loading ? '…' : 'Enregistrer'}</BtnPrimary>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Catalogue produits"
        subtitle={`${produits.filter(p => p.actif).length} actifs · ${produits.filter(p => !p.actif).length} inactifs`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher un produit…"
        onAdd={() => { setError(''); setForm(emptyForm); setModal('create') }} addLabel="Nouveau produit"
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={filtreCat} onChange={e => setFiltreCat(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '10px 14px' }}>
              {['Tous', ...CATEGORIES].map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filtreActif} onChange={e => setFiltreActif(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '10px 14px' }}>
              {['Actifs', 'Inactifs', 'Tous'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        }
      />

      {/* Résumé par catégorie */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => {
          const count = produits.filter(p => p.categorie === cat && p.actif).length
          if (!count) return null
          return (
            <span key={cat} onClick={() => setFiltreCat(cat === filtreCat ? 'Tous' : cat)}
              style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                background: CAT_COLORS[cat], color: CAT_TEXT[cat],
                border: `1px solid ${filtreCat === cat ? CAT_TEXT[cat] : 'transparent'}` }}>
              {cat} ({count})
            </span>
          )
        })}
      </div>

      <TableWrap minWidth={780}>
        <thead><tr>
          {['Produit / Service', 'Catégorie', 'Type impression', 'Prix base', 'Unité', 'Statut', ''].map(h => <th key={h} style={th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id} style={{ opacity: p.actif ? 1 : .55 }}>
              <td style={td}>
                <div style={{ fontWeight: 600 }}>{p.nom}</div>
                {p.description && <div style={{ fontSize: 12, color: '#7A736C', marginTop: 2 }}>{p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}</div>}
              </td>
              <td style={td}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: CAT_COLORS[p.categorie], color: CAT_TEXT[p.categorie] }}>
                  {p.categorie}
                </span>
              </td>
              <td style={{ ...td, fontSize: 12, color: '#7A736C' }}>{p.types_impression?.libelle || '—'}</td>
              <td style={{ ...td, fontWeight: 700 }}>{p.prix_base > 0 ? formatFCFA(p.prix_base) : '—'}</td>
              <td style={{ ...td, fontSize: 12, color: '#7A736C' }}>{p.unite}</td>
              <td style={td}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                  background: p.actif ? '#E8F7EE' : '#F0EEEC', color: p.actif ? '#3A9A5C' : '#7A736C' }}>
                  {p.actif ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <BtnIcon onClick={() => toggleActif(p)} title={p.actif ? 'Désactiver' : 'Activer'}>
                  {p.actif ? <ToggleRight size={18} style={{ color: '#3A9A5C' }} /> : <ToggleLeft size={18} />}
                </BtnIcon>
                <BtnIcon onClick={() => { setError(''); setSel(p); setForm({ ...p }); setModal('edit') }}><Pencil size={16} /></BtnIcon>
                <BtnIcon onClick={() => del(p)} danger><Trash2 size={16} /></BtnIcon>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <EmptyRow text="Aucun produit." cols={7} />}
        </tbody>
      </TableWrap>

      {modal === 'create' && <Modal title="Nouveau produit" onClose={() => { setModal(null); setError('') }} wide>{FormContent}</Modal>}
      {modal === 'edit' && sel && <Modal title={`Modifier — ${sel.nom}`} onClose={() => { setModal(null); setSel(null); setError('') }} wide>{FormContent}</Modal>}
    </div>
  )
}
