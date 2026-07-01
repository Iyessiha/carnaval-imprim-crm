'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDateFR } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, X, Check, Phone, Mail } from 'lucide-react'

type Fournisseur = { id:string; nom:string; contact:string|null; telephone:string|null; email:string|null; adresse:string|null; produits_fournis:string|null; notes:string|null; created_at:string }
const S = {
  input:{ width:'100%', padding:'10px 12px', border:'1px solid #E4DDD6', borderRadius:10, fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit' } as React.CSSProperties,
  label:{ display:'block', fontSize:11, fontWeight:700, color:'#7A736C', marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'.3px' },
  btnPrimary:{ display:'inline-flex', alignItems:'center', gap:7, background:'#C2117A', color:'#fff', border:'none', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  btnGhost:{ display:'inline-flex', alignItems:'center', gap:7, background:'#fff', color:'#1B1A1C', border:'1px solid #E4DDD6', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  iconBtn:{ background:'transparent', border:'none', cursor:'pointer', color:'#7A736C', padding:6, borderRadius:8, display:'inline-flex', alignItems:'center' } as React.CSSProperties,
}
const EMPTY = { nom:'', contact:'', telephone:'', email:'', adresse:'', produits_fournis:'', notes:'' }
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
export default function FournisseursClient({ fournisseurs:initial }:{ fournisseurs:Fournisseur[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [fournisseurs, setFournisseurs] = useState(initial)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'create'|'edit'|null>(null)
  const [selected, setSelected] = useState<Fournisseur|null>(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const filtered = useMemo(()=>fournisseurs.filter(f=>[f.nom,f.contact||'',f.produits_fournis||''].join(' ').toLowerCase().includes(q.toLowerCase())),[fournisseurs,q])
  const F = ({ label, children }:{ label:string; children:React.ReactNode }) => <div style={{ marginBottom:14 }}><label style={S.label}>{label}</label>{children}</div>
  const handleSave = async () => {
    setLoading(true)
    const payload = { nom:form.nom, contact:form.contact||null, telephone:form.telephone||null, email:form.email||null, adresse:form.adresse||null, produits_fournis:form.produits_fournis||null, notes:form.notes||null }
    if (selected) {
      const { data } = await supabase.from('fournisseurs').update(payload).eq('id', selected.id).select().single()
      if (data) setFournisseurs(prev=>prev.map(f=>f.id===data.id?data:f))
    } else {
      const { data } = await supabase.from('fournisseurs').insert(payload).select().single()
      if (data) setFournisseurs(prev=>[data,...prev])
    }
    setModal(null); setLoading(false); router.refresh()
  }
  const handleDelete = async (f: Fournisseur) => {
    if (!confirm(`Supprimer "${f.nom}" ?`)) return
    await supabase.from('fournisseurs').delete().eq('id', f.id)
    setFournisseurs(prev=>prev.filter(x=>x.id!==f.id)); router.refresh()
  }
  const openEdit = (f: Fournisseur) => { setForm({ nom:f.nom, contact:f.contact||'', telephone:f.telephone||'', email:f.email||'', adresse:f.adresse||'', produits_fournis:f.produits_fournis||'', notes:f.notes||'' }); setSelected(f); setModal('edit') }
  const openCreate = () => { setForm(EMPTY); setSelected(null); setModal('create') }
  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}><h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Fournisseurs</h1><p style={{ color:'#7A736C', fontSize:14, margin:'4px 0 0' }}>{fournisseurs.length} fournisseur{fournisseurs.length>1?'s':''}</p></div>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={16} style={{ position:'absolute', left:12, top:12, color:'#7A736C' }} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher un fournisseur…" style={{ ...S.input, paddingLeft:36 }} />
        </div>
        <button style={S.btnPrimary} onClick={openCreate}><Plus size={16}/> Nouveau fournisseur</button>
      </div>
      <div style={{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:14, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:640 }}>
            <thead><tr style={{ background:'#F6F4F1' }}>
              {['Fournisseur','Contact','Téléphone','Produits fournis','Ajouté le',''].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'11px 16px', fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.3px', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(f=>(
                <tr key={f.id} style={{ borderTop:'1px solid #E4DDD6' }}>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{f.nom}</div>
                    {f.email && <div style={{ fontSize:12, color:'#7A736C', display:'flex', alignItems:'center', gap:4, marginTop:2 }}><Mail size={11}/>{f.email}</div>}
                  </td>
                  <td style={{ padding:'13px 16px', fontSize:13 }}>{f.contact||'—'}</td>
                  <td style={{ padding:'13px 16px', fontSize:13 }}>
                    {f.telephone ? <div style={{ display:'flex', alignItems:'center', gap:5 }}><Phone size={13} style={{ color:'#7A736C' }}/>{f.telephone}</div> : '—'}
                  </td>
                  <td style={{ padding:'13px 16px', fontSize:13, color:'#7A736C', maxWidth:240 }}>{f.produits_fournis||'—'}</td>
                  <td style={{ padding:'13px 16px', fontSize:12, color:'#7A736C', whiteSpace:'nowrap' }}>{formatDateFR(f.created_at.slice(0,10))}</td>
                  <td style={{ padding:'13px 16px', textAlign:'right', whiteSpace:'nowrap' }}>
                    <button onClick={()=>openEdit(f)} style={S.iconBtn}><Pencil size={16}/></button>
                    <button onClick={()=>handleDelete(f)} style={{ ...S.iconBtn, color:'#D14343' }}><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length===0 && <div style={{ padding:48, textAlign:'center', color:'#7A736C', fontSize:14 }}>{q?`Aucun résultat pour "${q}"`:'Aucun fournisseur. Ajoutez le premier !'}</div>}
      </div>
      {(modal==='create'||modal==='edit') && (
        <Modal title={modal==='create'?'Nouveau fournisseur':`Modifier — ${selected?.nom}`} onClose={()=>setModal(null)}>
          <F label="Nom *"><input style={S.input} value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} /></F>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <F label="Contact"><input style={S.input} value={form.contact} onChange={e=>setForm(p=>({...p,contact:e.target.value}))} /></F>
            <F label="Téléphone"><input style={S.input} value={form.telephone} onChange={e=>setForm(p=>({...p,telephone:e.target.value}))} /></F>
            <F label="E-mail"><input style={S.input} type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></F>
            <F label="Adresse"><input style={S.input} value={form.adresse} onChange={e=>setForm(p=>({...p,adresse:e.target.value}))} /></F>
          </div>
          <F label="Produits fournis"><input style={S.input} value={form.produits_fournis} onChange={e=>setForm(p=>({...p,produits_fournis:e.target.value}))} placeholder="Papier couché, encres, T-shirts vierges…" /></F>
          <F label="Notes"><textarea style={{ ...S.input, minHeight:56, resize:'vertical' }} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} /></F>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button onClick={()=>setModal(null)} style={S.btnGhost}>Annuler</button>
            <button style={{ ...S.btnPrimary, opacity:loading?.7:1 }} disabled={loading||!form.nom.trim()} onClick={handleSave}><Check size={16}/> {loading?'Enregistrement…':'Enregistrer'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
