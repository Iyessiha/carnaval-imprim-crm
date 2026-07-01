'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDateFR, today } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, X, Check } from 'lucide-react'

type Production = {
  id: string; date: string; nature: string; caracteristique: string
  type_impression_id: string|null; papier: string|null
  recto_verso: boolean; nb_pages: number|null; finition: string|null
  format: string|null; quantite: number; statut: string
  date_livraison_prevue: string|null; client_id: string|null
  notes: string|null
  clients: { nom: string }|null
  profiles: { nom: string }|null
}
type Client = { id: string; nom: string }
type TypeImpression = { id: string; libelle: string }
type Profile = { id: string; nom: string }

const STATUTS = ['En attente','En production','Terminé','Livré'] as const
const STATUT_STYLE: Record<string,{bg:string;color:string}> = {
  'En attente':    { bg:'#fef3e2', color:'#F39200' },
  'En production': { bg:'#e5edf8', color:'#2A5FA5' },
  'Terminé':       { bg:'#f0e8f7', color:'#7B2FA5' },
  'Livré':         { bg:'#e8f7ee', color:'#3A9A5C' },
}

const S = {
  input: { width:'100%', padding:'10px 12px', border:'1px solid #E4DDD6', borderRadius:10, fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit' } as React.CSSProperties,
  label: { display:'block', fontSize:11, fontWeight:700, color:'#7A736C', marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'.3px' },
  btnPrimary: { display:'inline-flex', alignItems:'center', gap:7, background:'#C2117A', color:'#fff', border:'none', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  btnGhost: { display:'inline-flex', alignItems:'center', gap:7, background:'#fff', color:'#1B1A1C', border:'1px solid #E4DDD6', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  iconBtn: { background:'transparent', border:'none', cursor:'pointer', color:'#7A736C', padding:6, borderRadius:8, display:'inline-flex', alignItems:'center' } as React.CSSProperties,
}

function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(27,26,28,.45)', zIndex:50, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:16, overflowY:'auto' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:600, marginTop:28, marginBottom:28, boxShadow:'0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #E4DDD6' }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={S.iconBtn}><X size={18}/></button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
      </div>
    </div>
  )
}

type ProdForm = {
  date:string; caracteristique:string; type_impression_id:string
  papier:string; recto_verso:boolean; nb_pages:string; finition:string
  format:string; quantite:number; statut:string; date_livraison_prevue:string
  client_id:string; notes:string
}

const EMPTY: ProdForm = {
  date:today(), caracteristique:'', type_impression_id:'',
  papier:'', recto_verso:false, nb_pages:'', finition:'',
  format:'', quantite:1, statut:'En attente',
  date_livraison_prevue:'', client_id:'', notes:'',
}

function ProdFormModal({ initial, clients, types, onSave, onCancel, loading }: {
  initial: ProdForm; clients: Client[]; types: TypeImpression[]
  onSave:(d:ProdForm)=>void; onCancel:()=>void; loading:boolean
}) {
  const [f, setF] = useState<ProdForm>(initial)
  const set = (k: keyof ProdForm, v: string|boolean|number) => setF(p => ({ ...p, [k]: v }))
  const F = ({ label, children }: { label:string; children:React.ReactNode }) => (
    <div style={{ marginBottom:14 }}><label style={S.label}>{label}</label>{children}</div>
  )
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <F label="Date"><input type="date" style={S.input} value={f.date} onChange={e=>set('date',e.target.value)} /></F>
        <F label="Client">
          <select style={S.input} value={f.client_id} onChange={e=>set('client_id',e.target.value)}>
            <option value="">— Aucun —</option>
            {clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </F>
      </div>
      <F label="Caractéristique *">
        <textarea style={{ ...S.input, minHeight:70, resize:'vertical' }} value={f.caracteristique} onChange={e=>set('caracteristique',e.target.value)} placeholder="Ex: Brochure piqûre à cheval, couv 250g, offset 80g, recto-verso, 50 pages" />
      </F>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <F label="Type d'impression">
          <select style={S.input} value={f.type_impression_id} onChange={e=>set('type_impression_id',e.target.value)}>
            <option value="">— Sélectionner —</option>
            {types.map(t=><option key={t.id} value={t.id}>{t.libelle}</option>)}
          </select>
        </F>
        <F label="Papier / Matière">
          <input style={S.input} value={f.papier} onChange={e=>set('papier',e.target.value)} placeholder="Ex: Couché 250g, autocollant…" />
        </F>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12 }}>
        <F label="Format fini"><input style={S.input} value={f.format} onChange={e=>set('format',e.target.value)} placeholder="21x29,7cm" /></F>
        <F label="Finition"><input style={S.input} value={f.finition} onChange={e=>set('finition',e.target.value)} placeholder="Soft touch…" /></F>
        <F label="Quantité"><input type="number" style={S.input} value={f.quantite} min={1} onChange={e=>set('quantite',Number(e.target.value))} /></F>
        <F label="Nb pages"><input type="number" style={S.input} value={f.nb_pages} min={0} onChange={e=>set('nb_pages',e.target.value)} /></F>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, alignItems:'center' }}>
        <F label="Statut">
          <select style={S.input} value={f.statut} onChange={e=>set('statut',e.target.value)}>
            {STATUTS.map(s=><option key={s}>{s}</option>)}
          </select>
        </F>
        <F label="Livraison prévue"><input type="date" style={S.input} value={f.date_livraison_prevue} onChange={e=>set('date_livraison_prevue',e.target.value)} /></F>
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, marginTop:14 }}>
          <input type="checkbox" checked={f.recto_verso} onChange={e=>set('recto_verso',e.target.checked)} />
          Recto-verso
        </label>
      </div>
      <F label="Notes"><textarea style={{ ...S.input, minHeight:50, resize:'vertical' }} value={f.notes} onChange={e=>set('notes',e.target.value)} /></F>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
        <button onClick={onCancel} style={S.btnGhost}>Annuler</button>
        <button style={{ ...S.btnPrimary, opacity:loading?.7:1 }} disabled={loading||!f.caracteristique.trim()} onClick={()=>onSave(f)}>
          <Check size={16}/> {loading?'Enregistrement…':'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default function ProductionClient({ productions:initial, clients, types, profiles }: {
  productions:Production[]; clients:Client[]; types:TypeImpression[]; profiles:Profile[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [prods, setProds] = useState<Production[]>(initial)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('Tous')
  const [modal, setModal] = useState<'create'|'edit'|null>(null)
  const [selected, setSelected] = useState<Production|null>(null)
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => prods
    .filter(p => (filter === 'Tous' || p.statut === filter))
    .filter(p => [p.caracteristique, p.clients?.nom||'', p.format||'', p.finition||''].join(' ').toLowerCase().includes(q.toLowerCase())),
  [prods, q, filter])

  const toForm = (p: Production): ProdForm => ({
    date: p.date, caracteristique: p.caracteristique,
    type_impression_id: p.type_impression_id||'', papier: p.papier||'',
    recto_verso: p.recto_verso, nb_pages: p.nb_pages?.toString()||'',
    finition: p.finition||'', format: p.format||'', quantite: p.quantite,
    statut: p.statut, date_livraison_prevue: p.date_livraison_prevue||'',
    client_id: p.client_id||'', notes: p.notes||'',
  })

  const toPayload = (f: ProdForm) => ({
    date: f.date, caracteristique: f.caracteristique,
    type_impression_id: f.type_impression_id||null, papier: f.papier||null,
    recto_verso: f.recto_verso, nb_pages: f.nb_pages ? Number(f.nb_pages) : null,
    finition: f.finition||null, format: f.format||null, quantite: f.quantite,
    statut: f.statut, date_livraison_prevue: f.date_livraison_prevue||null,
    client_id: f.client_id||null, notes: f.notes||null,
  })

  const handleCreate = async (f: ProdForm) => {
    setLoading(true)
    const { data } = await supabase.from('productions').insert(toPayload(f)).select('*, clients(nom), profiles!assign_a(nom)').single()
    if (data) setProds(prev => [data, ...prev])
    setModal(null); setLoading(false); router.refresh()
  }

  const handleUpdate = async (f: ProdForm) => {
    if (!selected) return
    setLoading(true)
    await supabase.from('productions').update(toPayload(f)).eq('id', selected.id)
    const { data } = await supabase.from('productions').select('*, clients(nom), profiles!assign_a(nom)').eq('id', selected.id).single()
    if (data) setProds(prev => prev.map(p => p.id === data.id ? data : p))
    setModal(null); setSelected(null); setLoading(false); router.refresh()
  }

  const handleDelete = async (p: Production) => {
    if (!confirm(`Supprimer cette production ?`)) return
    await supabase.from('productions').delete().eq('id', p.id)
    setProds(prev => prev.filter(x => x.id !== p.id)); router.refresh()
  }

  const updateStatut = async (p: Production, statut: string) => {
    await supabase.from('productions').update({ statut }).eq('id', p.id)
    setProds(prev => prev.map(x => x.id === p.id ? { ...x, statut } : x))
  }

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Production</h1>
        <p style={{ color:'#7A736C', fontSize:14, margin:'4px 0 0' }}>{prods.length} ordre{prods.length>1?'s':''} de fabrication</p>
      </div>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={16} style={{ position:'absolute', left:12, top:12, color:'#7A736C' }} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher…" style={{ ...S.input, paddingLeft:36 }} />
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{ ...S.input, width:'auto', padding:'10px 14px' }}>
          <option>Tous</option>
          {STATUTS.map(s=><option key={s}>{s}</option>)}
        </select>
        <button style={S.btnPrimary} onClick={()=>{ setSelected(null); setModal('create') }}>
          <Plus size={16}/> Nouvelle ligne
        </button>
      </div>

      <div style={{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:14, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:860 }}>
            <thead>
              <tr style={{ background:'#F6F4F1' }}>
                {['Date','Caractéristique','Finition','Format','Qté','Statut',''].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'11px 16px', fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.3px', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const st = STATUT_STYLE[p.statut] || { bg:'#F6F4F1', color:'#7A736C' }
                return (
                  <tr key={p.id} style={{ borderTop:'1px solid #E4DDD6' }}>
                    <td style={{ padding:'13px 16px', fontSize:12, whiteSpace:'nowrap', color:'#7A736C' }}>{formatDateFR(p.date)}</td>
                    <td style={{ padding:'13px 16px', maxWidth:320 }}>
                      <div style={{ fontWeight:600, fontSize:13, lineHeight:1.35 }}>{p.caracteristique.slice(0,80)}{p.caracteristique.length>80?'…':''}</div>
                      {p.clients && <div style={{ fontSize:11, color:'#7A736C', marginTop:2 }}>{p.clients.nom}</div>}
                    </td>
                    <td style={{ padding:'13px 16px', fontSize:13, color:'#7A736C' }}>{p.finition||'—'}</td>
                    <td style={{ padding:'13px 16px', fontSize:13, whiteSpace:'nowrap' }}>{p.format||'—'}</td>
                    <td style={{ padding:'13px 16px', fontSize:13, fontWeight:600 }}>{p.quantite.toLocaleString('fr-FR')}</td>
                    <td style={{ padding:'13px 16px' }}>
                      <select
                        value={p.statut}
                        onChange={e=>updateStatut(p, e.target.value)}
                        style={{ border:'none', background:st.bg, color:st.color, fontWeight:600, fontSize:12, padding:'5px 10px', borderRadius:999, cursor:'pointer', fontFamily:'inherit' }}
                      >
                        {STATUTS.map(s=><option key={s} value={s} style={{ color:'#1B1A1C', background:'#fff' }}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:'13px 16px', textAlign:'right', whiteSpace:'nowrap' }}>
                      <button onClick={()=>{ setSelected(p); setModal('edit') }} style={S.iconBtn}><Pencil size={16}/></button>
                      <button onClick={()=>handleDelete(p)} style={{ ...S.iconBtn, color:'#D14343' }}><Trash2 size={16}/></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length===0 && <div style={{ padding:48, textAlign:'center', color:'#7A736C', fontSize:14 }}>{q||filter!=='Tous'?'Aucun résultat':'Aucune production. Créez la première !'}</div>}
      </div>

      {modal==='create' && <Modal title="Nouvelle production" onClose={()=>setModal(null)}><ProdFormModal initial={EMPTY} clients={clients} types={types} onSave={handleCreate} onCancel={()=>setModal(null)} loading={loading} /></Modal>}
      {modal==='edit' && selected && <Modal title="Modifier la production" onClose={()=>{ setModal(null); setSelected(null) }}><ProdFormModal initial={toForm(selected)} clients={clients} types={types} onSave={handleUpdate} onCancel={()=>{ setModal(null); setSelected(null) }} loading={loading} /></Modal>}
    </div>
  )
}
