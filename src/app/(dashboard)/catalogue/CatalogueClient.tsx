'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatFCFA } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, X, Check } from 'lucide-react'

type Produit = { id:string; nom:string; categorie:string; prix_base:number; unite:string; description:string|null; actif:boolean; type_impression_id:string|null; types_impression:{libelle:string}|null }
type TypeImpression = { id:string; libelle:string }
const CATEGORIES = ['Supports imprimés','Grand format','Textile','Objets pub','Service'] as const
const S = {
  input:{ width:'100%', padding:'10px 12px', border:'1px solid #E4DDD6', borderRadius:10, fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit' } as React.CSSProperties,
  label:{ display:'block', fontSize:11, fontWeight:700, color:'#7A736C', marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'.3px' },
  btnPrimary:{ display:'inline-flex', alignItems:'center', gap:7, background:'#C2117A', color:'#fff', border:'none', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  btnGhost:{ display:'inline-flex', alignItems:'center', gap:7, background:'#fff', color:'#1B1A1C', border:'1px solid #E4DDD6', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  iconBtn:{ background:'transparent', border:'none', cursor:'pointer', color:'#7A736C', padding:6, borderRadius:8, display:'inline-flex', alignItems:'center' } as React.CSSProperties,
}
function Modal({ title, onClose, children }:{ title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(27,26,28,.45)', zIndex:50, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:16, overflowY:'auto' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, marginTop:28, marginBottom:28, boxShadow:'0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #E4DDD6' }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={S.iconBtn}><X size={18}/></button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
      </div>
    </div>
  )
}
export default function CatalogueClient({ produits:initial, types }:{ produits:Produit[]; types:TypeImpression[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [produits, setProduits] = useState(initial)
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('Toutes')
  const [modal, setModal] = useState<'create'|'edit'|null>(null)
  const [selected, setSelected] = useState<Produit|null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nom:'', categorie:'Supports imprimés', prix_base:0, unite:'unité', description:'', actif:true, type_impression_id:'' })

  const filtered = useMemo(() => produits.filter(p =>
    (catFilter==='Toutes'||p.categorie===catFilter) &&
    [p.nom, p.categorie, p.description||''].join(' ').toLowerCase().includes(q.toLowerCase())
  ), [produits, q, catFilter])

  const grouped = useMemo(() => {
    const g: Record<string, Produit[]> = {}
    filtered.forEach(p => { if (!g[p.categorie]) g[p.categorie]=[]; g[p.categorie].push(p) })
    return g
  }, [filtered])

  const openCreate = () => { setForm({ nom:'', categorie:'Supports imprimés', prix_base:0, unite:'unité', description:'', actif:true, type_impression_id:'' }); setSelected(null); setModal('create') }
  const openEdit = (p: Produit) => { setForm({ nom:p.nom, categorie:p.categorie, prix_base:p.prix_base, unite:p.unite, description:p.description||'', actif:p.actif, type_impression_id:p.type_impression_id||'' }); setSelected(p); setModal('edit') }

  const handleSave = async () => {
    setLoading(true)
    const payload = { ...form, prix_base:Number(form.prix_base), type_impression_id:form.type_impression_id||null, description:form.description||null }
    if (selected) {
      const { data } = await supabase.from('produits').update(payload).eq('id', selected.id).select('*, types_impression(libelle)').single()
      if (data) setProduits(prev => prev.map(p => p.id===data.id ? data : p))
    } else {
      const { data } = await supabase.from('produits').insert(payload).select('*, types_impression(libelle)').single()
      if (data) setProduits(prev => [data, ...prev])
    }
    setModal(null); setLoading(false); router.refresh()
  }

  const handleDelete = async (p: Produit) => {
    if (!confirm(`Supprimer "${p.nom}" ?`)) return
    await supabase.from('produits').delete().eq('id', p.id)
    setProduits(prev => prev.filter(x => x.id!==p.id)); router.refresh()
  }

  const F = ({ label, children }:{ label:string; children:React.ReactNode }) => (
    <div style={{ marginBottom:14 }}><label style={S.label}>{label}</label>{children}</div>
  )

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}><h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Catalogue</h1><p style={{ color:'#7A736C', fontSize:14, margin:'4px 0 0' }}>{produits.length} articles</p></div>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={16} style={{ position:'absolute', left:12, top:12, color:'#7A736C' }} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher un article…" style={{ ...S.input, paddingLeft:36 }} />
        </div>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{ ...S.input, width:'auto', padding:'10px 14px' }}>
          <option>Toutes</option>
          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </select>
        <button style={S.btnPrimary} onClick={openCreate}><Plus size={16}/> Nouvel article</button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom:24 }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.5px', margin:'0 0 12px' }}>{cat}</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
            {items.map(p => (
              <div key={p.id} style={{ background:'#fff', border:`1px solid ${p.actif?'#E4DDD6':'#f0e8dd'}`, borderRadius:14, padding:14, opacity:p.actif?1:.7 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ fontWeight:600, fontSize:14, lineHeight:1.3, flex:1 }}>{p.nom}</div>
                  <div style={{ whiteSpace:'nowrap' }}>
                    <button onClick={()=>openEdit(p)} style={{ ...S.iconBtn, padding:3 }}><Pencil size={14}/></button>
                    <button onClick={()=>handleDelete(p)} style={{ ...S.iconBtn, padding:3, color:'#D14343' }}><Trash2 size={14}/></button>
                  </div>
                </div>
                {p.types_impression && <div style={{ fontSize:11, background:'#e5edf8', color:'#2A5FA5', padding:'2px 8px', borderRadius:6, display:'inline-block', marginBottom:8, fontWeight:600 }}>{p.types_impression.libelle}</div>}
                <div style={{ fontSize:18, fontWeight:800, color:'#C2117A' }}>{formatFCFA(p.prix_base)}</div>
                <div style={{ fontSize:12, color:'#7A736C' }}>/ {p.unite}</div>
                {!p.actif && <div style={{ fontSize:11, color:'#F39200', marginTop:4 }}>● Désactivé</div>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length===0 && <div style={{ padding:48, textAlign:'center', color:'#7A736C', fontSize:14 }}>Aucun article trouvé.</div>}

      {(modal==='create'||modal==='edit') && (
        <Modal title={modal==='create'?'Nouvel article':`Modifier — ${selected?.nom}`} onClose={()=>setModal(null)}>
          <F label="Nom *"><input style={S.input} value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} /></F>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <F label="Catégorie"><select style={S.input} value={form.categorie} onChange={e=>setForm(p=>({...p,categorie:e.target.value}))}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></F>
            <F label="Type d'impression"><select style={S.input} value={form.type_impression_id} onChange={e=>setForm(p=>({...p,type_impression_id:e.target.value}))}><option value="">—</option>{types.map(t=><option key={t.id} value={t.id}>{t.libelle}</option>)}</select></F>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <F label="Prix de base (FCFA)"><input type="number" style={S.input} value={form.prix_base} min={0} onChange={e=>setForm(p=>({...p,prix_base:Number(e.target.value)}))} /></F>
            <F label="Unité"><input style={S.input} value={form.unite} onChange={e=>setForm(p=>({...p,unite:e.target.value}))} placeholder="unité, m², 1000 ex…" /></F>
          </div>
          <F label="Description"><textarea style={{ ...S.input, minHeight:56, resize:'vertical' }} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} /></F>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, marginBottom:16 }}>
            <input type="checkbox" checked={form.actif} onChange={e=>setForm(p=>({...p,actif:e.target.checked}))} /> Article actif (visible dans les devis/factures)
          </label>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button onClick={()=>setModal(null)} style={S.btnGhost}>Annuler</button>
            <button style={{ ...S.btnPrimary, opacity:loading?.7:1 }} disabled={loading||!form.nom.trim()} onClick={handleSave}><Check size={16}/> {loading?'Enregistrement…':'Enregistrer'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
