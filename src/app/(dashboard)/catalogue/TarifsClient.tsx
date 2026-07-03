'use client'
import { useState, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase/any'
import { formatFCFA } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import Modal from '@/components/ui/Modal'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

type Tarif = {
  id: string; categorie: string; designation: string
  format?: string; grammage?: string; finition?: string
  prix_unitaire: number; unite: string; actif: boolean; ordre: number
}

const CATEGORIES = [
  'Carte de visite','Flyer','Affiche','Brochure','Dépliant',
  'Grand format','Autocollant','Textile','Agenda / Calendrier','Autre'
]
const FORMATS = ['A6','A5','A4','A3','A2','A1','A0','8,5×5,5 cm','10×21 cm','21×21 cm','15×21 cm','Personnalisé']
const FINITIONS = ['Sans pelliculage','Soft touch','Pelliculage brillant','Vernis sélectif','Avec œillets','Avec structure','Plastifié']
const UNITES = ['ex','100 ex','250 ex','500 ex','1000 ex','m²','ml','unité']

const empty = (): Omit<Tarif,'id'|'actif'|'ordre'> => ({
  categorie: 'Flyer', designation: '', format: '', grammage: '', finition: '', prix_unitaire: 0, unite: '500 ex'
})

export default function TarifsClient({ tarifs: init }: { tarifs: Tarif[] }) {
  const [tarifs, setTarifs] = useState<Tarif[]>(init)
  const [q, setQ] = useState('')
  const [catFiltre, setCatFiltre] = useState('Toutes')
  const [modal, setModal] = useState<'add'|'edit'|null>(null)
  const [sel, setSel] = useState<Tarif|null>(null)
  const [form, setForm] = useState(empty())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const categories = useMemo(() => ['Toutes', ...Array.from(new Set(tarifs.map(t => t.categorie)))], [tarifs])

  const filtered = useMemo(() => tarifs
    .filter(t => catFiltre === 'Toutes' || t.categorie === catFiltre)
    .filter(t => (t.designation + t.categorie + (t.format||'')).toLowerCase().includes(q.toLowerCase())),
    [tarifs, catFiltre, q])

  const f = (k: keyof typeof form, v: string|number) => setForm(p => ({ ...p, [k]: v }))

  const openAdd = () => { setForm(empty()); setError(''); setModal('add') }
  const openEdit = (t: Tarif) => {
    setSel(t)
    setForm({ categorie: t.categorie, designation: t.designation, format: t.format||'', grammage: t.grammage||'', finition: t.finition||'', prix_unitaire: t.prix_unitaire, unite: t.unite })
    setError(''); setModal('edit')
  }
  const close = () => { setModal(null); setSel(null); setError('') }

  const save = async () => {
    if (!form.designation.trim()) { setError('La désignation est obligatoire.'); return }
    if (!form.prix_unitaire) { setError('Le prix doit être supérieur à 0.'); return }
    setSaving(true); setError('')
    const sb = getSupabase()
    const body = { ...form, prix_unitaire: Number(form.prix_unitaire) }

    if (modal === 'edit' && sel) {
      const { error: e } = await sb.from('tarifs_impression').update(body).eq('id', sel.id)
      if (e) { setError(e.message); setSaving(false); return }
      setTarifs(prev => prev.map(t => t.id === sel.id ? { ...t, ...body } : t))
    } else {
      const { data, error: e } = await sb.from('tarifs_impression')
        .insert({ ...body, actif: true, ordre: tarifs.length })
        .select().single()
      if (e) { setError(e.message); setSaving(false); return }
      setTarifs(prev => [...prev, data as Tarif])
    }
    setSaving(false); close()
  }

  const toggle = async (t: Tarif) => {
    const sb = getSupabase()
    await sb.from('tarifs_impression').update({ actif: !t.actif }).eq('id', t.id)
    setTarifs(prev => prev.map(x => x.id === t.id ? { ...x, actif: !x.actif } : x))
  }

  const del = async (t: Tarif) => {
    if (!confirm(`Supprimer « ${t.designation} » ?`)) return
    const sb = getSupabase()
    await sb.from('tarifs_impression').delete().eq('id', t.id)
    setTarifs(prev => prev.filter(x => x.id !== t.id))
  }

  const FormBody = () => (
    <div>
      {error && <div style={{ background:'#FDE8E8',color:'#D14343',padding:'10px 14px',borderRadius:10,marginBottom:14,fontSize:13 }}>{error}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Catégorie *">
          <select style={inputStyle} value={form.categorie} onChange={e => f('categorie', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Désignation *">
          <input style={inputStyle} value={form.designation} onChange={e => f('designation', e.target.value)} placeholder="Ex: Flyer A5 recto-verso" autoFocus />
        </Field>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Format">
          <input list="formats-list" style={inputStyle} value={form.format} onChange={e => f('format', e.target.value)} placeholder="Ex: A5" />
          <datalist id="formats-list">{FORMATS.map(f => <option key={f} value={f} />)}</datalist>
        </Field>
        <Field label="Grammage / Matière">
          <input style={inputStyle} value={form.grammage} onChange={e => f('grammage', e.target.value)} placeholder="Ex: 135g, Couv 250g" />
        </Field>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Finition">
          <input list="finitions-list" style={inputStyle} value={form.finition} onChange={e => f('finition', e.target.value)} placeholder="Ex: Soft touch" />
          <datalist id="finitions-list">{FINITIONS.map(fn => <option key={fn} value={fn} />)}</datalist>
        </Field>
        <Field label="Unité">
          <select style={inputStyle} value={form.unite} onChange={e => f('unite', e.target.value)}>
            {UNITES.map(u => <option key={u}>{u}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Prix unitaire HT (FCFA) *">
        <input type="number" min="0" step="500" style={inputStyle} value={form.prix_unitaire||''} onChange={e => f('prix_unitaire', parseFloat(e.target.value)||0)} placeholder="Ex: 35000" />
      </Field>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:8 }}>
        <BtnGhost onClick={close}>Annuler</BtnGhost>
        <BtnPrimary onClick={save} disabled={saving}>
          <Plus size={15} /> {saving ? '…' : modal==='edit' ? 'Sauvegarder' : 'Ajouter le tarif'}
        </BtnPrimary>
      </div>
    </div>
  )

  return (
    <div style={{ padding:24 }}>
      <PageHeader
        title="Tarifs d'impression"
        subtitle={`${tarifs.filter(t=>t.actif).length} tarifs actifs · utilisables dans devis et factures`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher un tarif…"
        onAdd={openAdd} addLabel="Nouveau tarif"
        extra={
          <select value={catFiltre} onChange={e => setCatFiltre(e.target.value)}
            style={{ ...inputStyle, width:'auto', padding:'9px 14px' }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        }
      />

      {/* Info */}
      <div style={{ background:'#E5EDF8', borderRadius:12, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', gap:10, alignItems:'center' }}>
        <span style={{ fontSize:18 }}>💡</span>
        <span>Ces tarifs apparaissent dans la liste de suggestions quand vous saisissez une ligne sur un <strong>devis</strong> ou une <strong>facture</strong>.</span>
      </div>

      <TableWrap minWidth={800}>
        <thead><tr>
          {['Catégorie','Désignation','Format','Grammage','Finition','Prix HT','Unité','Statut',''].map(h => <th key={h} style={th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map(t => (
            <tr key={t.id} style={{ opacity: t.actif ? 1 : .5 }}>
              <td style={td}>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:999, background:'#F6F4F1', color:'#7A736C' }}>{t.categorie}</span>
              </td>
              <td style={{ ...td, fontWeight:600 }}>{t.designation}</td>
              <td style={{ ...td, fontSize:12 }}>{t.format||'—'}</td>
              <td style={{ ...td, fontSize:12, color:'#7A736C' }}>{t.grammage||'—'}</td>
              <td style={{ ...td, fontSize:12, color:'#7A736C' }}>{t.finition||'—'}</td>
              <td style={{ ...td, fontWeight:700, color:'#C2117A' }}>{formatFCFA(t.prix_unitaire)}</td>
              <td style={{ ...td, fontSize:12 }}>{t.unite}</td>
              <td style={td}>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:999,
                  background: t.actif?'#E8F7EE':'#F0EEEC', color: t.actif?'#2D7A4E':'#7A736C' }}>
                  {t.actif ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td style={{ ...td, textAlign:'right' }}>
                <div style={{ display:'flex', gap:2, justifyContent:'flex-end' }}>
                  <BtnIcon onClick={() => openEdit(t)} title="Modifier"><Pencil size={14} /></BtnIcon>
                  <BtnIcon onClick={() => toggle(t)} title={t.actif?'Désactiver':'Activer'}>
                    {t.actif ? <ToggleRight size={18} style={{ color:'#2D7A4E' }} /> : <ToggleLeft size={18} />}
                  </BtnIcon>
                  <BtnIcon onClick={() => del(t)} danger title="Supprimer"><Trash2 size={14} /></BtnIcon>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <EmptyRow text="Aucun tarif." cols={9} />}
        </tbody>
      </TableWrap>

      {modal && (
        <Modal title={modal==='edit' ? `Modifier — ${sel?.designation}` : 'Nouveau tarif'} onClose={close}>
          <FormBody />
        </Modal>
      )}
    </div>
  )
}
