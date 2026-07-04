'use client'
import { useState, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase/any'
import { formatDateFR, today } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import { Check, Pencil, Trash2, Eye, Plus, Printer, PackageCheck, Link2 } from 'lucide-react'

const STATUTS = ['En attente', 'En production', 'Terminé', 'Livré'] as const
const NATURES = ['PRODUCTION', 'SOUS-TRAITANCE', 'ECHANTILLON'] as const
const FORMATS = ['A6','A5','A4','A3','A2','A1','A0','8,5×5,5 cm','10×21 cm','21×21 cm','15×21 cm','Personnalisé']
const FINITIONS = ['Sans pelliculage','Soft touch','Pelliculage brillant','Vernis sélectif','Avec œillets','Avec structure']
const MOTIFS_SOUS_TRAITANCE = ['Vernis sélectif', 'Surplus de quantité', 'Impression offset', 'Autre'] as const

const STATUT_STYLE: Record<string,{bg:string;color:string}> = {
  'En attente':    { bg:'#FEF3E2', color:'#D4780A' },
  'En production': { bg:'#E5EDF8', color:'#2A5FA5' },
  'Terminé':       { bg:'#F0E8F8', color:'#7B2FA5' },
  'Livré':         { bg:'#E8F7EE', color:'#2D7A4E' },
}

type DevisRef = { id: string; numero: string; statut: string; clients: {nom:string}|null; devis_lignes: {designation:string;qte:number}[] }
type TypeImp = { id: string; libelle: string }
type Client = { id: string; nom: string; telephone?: string; adresse?: string }
type Fournisseur = { id: string; nom: string }
type Production = {
  id: string; date: string; nature: string; caracteristique: string
  type_impression_id: string|null; format: string|null; quantite: number
  statut: string; date_livraison_prevue: string|null; date_livraison_reelle: string|null
  client_id: string|null; devis_id: string|null; numero_bl: string|null
  notes: string|null; created_at: string; recto_verso: boolean
  finition: string|null; nb_pages: number|null; papier: string|null
  stock_verifie: boolean; bat_valide_client: boolean
  sous_traitant_id: string|null; motif_sous_traitance: string|null
  clients: {nom:string}|null; types_impression: {libelle:string}|null; devis?: {numero:string}|null
  fournisseurs?: {nom:string}|null
}

type F = {
  nature: string; caracteristique: string; type_impression_id: string
  format: string; quantite: number; statut: string; recto_verso: boolean
  finition: string; nb_pages: string; papier: string
  date: string; date_livraison_prevue: string
  client_id: string; devis_id: string; notes: string
  stock_verifie: boolean; bat_valide_client: boolean
  sous_traitant_id: string; motif_sous_traitance: string
}

const emptyF = (): F => ({
  nature: 'PRODUCTION', caracteristique: '', type_impression_id: '',
  format: 'A4', quantite: 100, statut: 'En attente', recto_verso: false,
  finition: 'Sans pelliculage', nb_pages: '', papier: '',
  date: today(), date_livraison_prevue: '',
  client_id: '', devis_id: '', notes: '',
  stock_verifie: false, bat_valide_client: false,
  sous_traitant_id: '', motif_sous_traitance: '',
})

export default function ProductionClient({
  productions: init, clients, devis, types, entreprise, fournisseurs
}: {
  productions: Production[]; clients: Client[]; devis: DevisRef[]
  types: TypeImp[]; entreprise: Record<string,string>|null; fournisseurs: Fournisseur[]
}) {
  const [prods, setProds] = useState<Production[]>(init)
  const [q, setQ] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('Tous')
  const [modal, setModal] = useState<'create'|'edit'|'view'|'bl'|null>(null)
  const [sel, setSel] = useState<Production|null>(null)
  const [form, setForm] = useState<F>(emptyF())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [blNum, setBlNum] = useState('')

  const f = (k: keyof F, v: string|number|boolean) => setForm(p => ({ ...p, [k]: v }))

  const filtered = useMemo(() => prods
    .filter(p => filtreStatut === 'Tous' || p.statut === filtreStatut)
    .filter(p => (p.caracteristique + (p.clients?.nom||'')).toLowerCase().includes(q.toLowerCase())),
    [prods, filtreStatut, q])

  const openCreate = () => { setForm(emptyF()); setError(''); setModal('create') }
  const openEdit = (p: Production) => {
    setSel(p)
    setForm({
      nature: p.nature, caracteristique: p.caracteristique,
      type_impression_id: p.type_impression_id||'',
      format: p.format||'A4', quantite: p.quantite, statut: p.statut,
      recto_verso: p.recto_verso, finition: p.finition||'Sans pelliculage',
      nb_pages: String(p.nb_pages||''), papier: p.papier||'',
      date: p.date, date_livraison_prevue: p.date_livraison_prevue||'',
      client_id: p.client_id||'', devis_id: p.devis_id||'', notes: p.notes||'',
      stock_verifie: p.stock_verifie||false, bat_valide_client: p.bat_valide_client||false,
      sous_traitant_id: p.sous_traitant_id||'', motif_sous_traitance: p.motif_sous_traitance||'',
    })
    setError(''); setModal('edit')
  }
  const close = () => { setModal(null); setSel(null); setError('') }

  // Pré-remplir depuis un devis
  const importDevis = (devisId: string) => {
    const d = devis.find(dv => dv.id === devisId)
    if (!d) return
    const caract = (d.devis_lignes || []).map((l: {designation:string;qte:number}) => `${l.designation} ×${l.qte}`).join(' / ')
    f('devis_id', devisId)
    f('client_id', '') // sera sélectionné via le devis
    if (caract) f('caracteristique', caract.slice(0, 200))
  }

  const save = async () => {
    if (!form.caracteristique.trim()) { setError('La caractéristique est obligatoire.'); return }
    if (!form.quantite) { setError('La quantité est obligatoire.'); return }
    setSaving(true); setError('')
    const sb = getSupabase()
    const body = {
      nature: form.nature,
      caracteristique: form.caracteristique,
      type_impression_id: form.type_impression_id || null,
      format: form.format || null,
      quantite: Number(form.quantite),
      statut: form.statut,
      recto_verso: form.recto_verso,
      finition: form.finition || null,
      nb_pages: form.nb_pages ? Number(form.nb_pages) : null,
      papier: form.papier || null,
      date: form.date || today(),
      date_livraison_prevue: form.date_livraison_prevue || null,
      client_id: form.client_id || null,
      devis_id: form.devis_id || null,
      notes: form.notes || null,
      stock_verifie: form.stock_verifie,
      bat_valide_client: form.bat_valide_client,
      sous_traitant_id: form.nature === 'SOUS-TRAITANCE' ? (form.sous_traitant_id || null) : null,
      motif_sous_traitance: form.nature === 'SOUS-TRAITANCE' ? (form.motif_sous_traitance || null) : null,
    }

    if (modal === 'edit' && sel) {
      const { error: e } = await sb.from('productions').update(body).eq('id', sel.id)
      if (e) { setError(e.message); setSaving(false); return }
      const cli = clients.find(c => c.id === form.client_id)
      const typ = types.find(t => t.id === form.type_impression_id)
      const four = fournisseurs.find(fr => fr.id === form.sous_traitant_id)
      setProds(prev => prev.map(p => p.id === sel.id ? { ...p, ...body, clients: cli ? {nom:cli.nom} : p.clients, types_impression: typ ? {libelle:typ.libelle} : p.types_impression, fournisseurs: four ? {nom:four.nom} : p.fournisseurs } : p))
    } else {
      const { data, error: e } = await sb.from('productions').insert(body).select('*, clients(nom), types_impression(libelle), fournisseurs(nom)').single()
      if (e) { setError(e.message); setSaving(false); return }
      setProds(prev => [data as Production, ...prev])
    }
    setSaving(false); close()
  }

  const del = async (p: Production) => {
    if (!confirm(`Supprimer la production « ${p.caracteristique.slice(0,40)} » ?`)) return
    const sb = getSupabase()
    await sb.from('productions').delete().eq('id', p.id)
    setProds(prev => prev.filter(x => x.id !== p.id))
  }

  const changeStatut = async (p: Production, statut: string) => {
    const sb = getSupabase()
    await sb.from('productions').update({ statut }).eq('id', p.id)
    setProds(prev => prev.map(x => x.id === p.id ? { ...x, statut } : x))
  }

  const saveBL = async () => {
    if (!sel) return
    const sb = getSupabase()
    const num = blNum || `BL-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`
    await sb.from('productions').update({
      numero_bl: num,
      statut: 'Livré',
      date_livraison_reelle: today(),
    }).eq('id', sel.id)
    setProds(prev => prev.map(p => p.id === sel.id
      ? { ...p, numero_bl: num, statut: 'Livré', date_livraison_reelle: today() }
      : p))
    imprimerBL({ ...sel, numero_bl: num })
    close()
  }

  const imprimerBL = (p: Production) => {
    const ent = entreprise
    const num = p.numero_bl || `BL-${new Date().getFullYear()}-XXXX`
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>BL ${num}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#1B1A1C;padding:30px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
  .logo{font-size:22px;font-weight:900}.logo span{color:#C2117A}
  .badge{background:#C2117A;color:#fff;padding:8px 18px;border-radius:8px;font-size:18px;font-weight:700}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
  .box{background:#F6F4F1;border-radius:8px;padding:14px;border-left:4px solid #C2117A}
  .box-t{font-size:9px;font-weight:800;text-transform:uppercase;color:#7A736C;margin-bottom:6px}
  .box-v{font-size:13px;font-weight:700}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  th{background:#1B1A1C;color:#fff;padding:8px 12px;text-align:left;font-size:11px}
  td{padding:10px 12px;border-bottom:1px solid #eee;font-size:12px}
  .sign{display:flex;justify-content:space-between;margin-top:40px;padding-top:16px;border-top:1px solid #E4DDD6}
  .sign-box{text-align:center;width:200px}
  .sign-line{border-bottom:1.5px solid #1B1A1C;margin-top:48px}
  .sign-label{font-size:10px;color:#7A736C;margin-top:5px}
  .footer{margin-top:24px;font-size:9px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:10px}
  @media print{body{padding:16px}}
</style></head><body>
<div class="header">
  <div><div class="logo">CARNAVAL<span>IMPRIM</span></div>
  <div style="font-size:10px;color:#888;margin-top:4px">${ent?.siege||'Cocody-Blockhauss, Abidjan'}</div>
  <div style="font-size:10px;color:#888">Tél : ${ent?.tel||'07 19 14 13 13'}</div></div>
  <div style="text-align:right"><div class="badge">BON DE LIVRAISON</div>
  <div style="font-size:15px;font-weight:900;margin-top:6px">N° ${num}</div>
  <div style="font-size:11px;color:#888;margin-top:3px">Date : ${new Date().toLocaleDateString('fr-FR')}</div>
  ${p.devis ? `<div style="font-size:11px;color:#888">Réf. devis : ${(p.devis as {numero:string}).numero}</div>` : ''}
  </div>
</div>
<div class="grid2">
  <div class="box"><div class="box-t">Client</div>
  <div class="box-v">${p.clients?.nom||'—'}</div></div>
  <div class="box"><div class="box-t">Commande</div>
  <div class="box-v">${p.caracteristique.slice(0,60)}</div></div>
</div>
<table><thead><tr>
  <th>Désignation</th><th>Format</th><th>Qté commandée</th><th>Qté livrée</th><th>Observation</th>
</tr></thead><tbody><tr>
  <td>${p.caracteristique}</td>
  <td>${p.format||'—'}</td>
  <td style="text-align:center;font-weight:700">${p.quantite?.toLocaleString('fr-FR')}</td>
  <td style="text-align:center;font-weight:700;color:#3A9A5C">${p.quantite?.toLocaleString('fr-FR')}</td>
  <td style="color:#3A9A5C">✓ Conforme</td>
</tr></tbody></table>
<div style="background:#E8F7EE;border-radius:8px;padding:10px 16px;font-size:12px">
  ✅ Marchandise livrée en bon état. Toute réclamation dans les <strong>48h</strong>.
</div>
<div class="sign">
  <div class="sign-box"><div class="sign-line"></div><div class="sign-label">Livreur / Carnaval Imprim</div></div>
  <div class="sign-box"><div class="sign-line"></div><div class="sign-label">Client — Signature & Cachet</div></div>
</div>
<div class="footer">${ent?.nom||'CARNAVAL IMPRIM'} SARL · ${ent?.siege||''} · RC : ${ent?.rc||''} · NCC : ${ent?.ncc||'240220333S'}</div>
</body></html>`
    const w = window.open('','_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(()=>w.print(),400) }
  }

  const FormBody = () => (
    <div>
      {error && <div style={{background:'#FDE8E8',color:'#D14343',padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13}}>{error}</div>}

      {/* Import depuis devis accepté */}
      <div style={{background:'#E5EDF8',borderRadius:10,padding:'10px 14px',marginBottom:14}}>
        <label style={{fontSize:11,fontWeight:800,color:'#2A5FA5',textTransform:'uppercase' as const,letterSpacing:'.5px',display:'block',marginBottom:6}}>
          📋 Importer depuis un devis accepté
        </label>
        <select style={inputStyle} value={form.devis_id}
          onChange={e => { f('devis_id', e.target.value); importDevis(e.target.value) }}>
          <option value="">— Saisie manuelle —</option>
          {devis.map(d => (
            <option key={d.id} value={d.id}>{d.numero} · {d.clients?.nom} · {d.devis_lignes[0]?.designation?.slice(0,40)}</option>
          ))}
        </select>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Field label="Client"><select style={inputStyle} value={form.client_id} onChange={e=>f('client_id',e.target.value)}>
          <option value="">— Sélectionner —</option>
          {clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
        </select></Field>
        <Field label="Nature"><select style={inputStyle} value={form.nature} onChange={e=>f('nature',e.target.value)}>
          {NATURES.map(n=><option key={n}>{n}</option>)}
        </select></Field>
      </div>

      <Field label="Caractéristique / Description *">
        <textarea style={{...inputStyle,height:80,resize:'vertical' as const}} value={form.caracteristique}
          onChange={e=>f('caracteristique',e.target.value)} placeholder="Ex: Brochures piqûre à cheval 50p, couv 250g, intérieur 90g, quadri recto-verso" />
      </Field>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
        <Field label="Type d'impression">
          <select style={inputStyle} value={form.type_impression_id} onChange={e=>f('type_impression_id',e.target.value)}>
            <option value="">— Choisir —</option>
            {types.map(t=><option key={t.id} value={t.id}>{t.libelle}</option>)}
          </select>
        </Field>
        <Field label="Format">
          <input list="formats-prod" style={inputStyle} value={form.format} onChange={e=>f('format',e.target.value)} />
          <datalist id="formats-prod">{FORMATS.map(f=><option key={f} value={f}/>)}</datalist>
        </Field>
        <Field label="Quantité *">
          <input type="number" min="1" style={inputStyle} value={form.quantite} onChange={e=>f('quantite',parseInt(e.target.value)||0)} />
        </Field>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
        <Field label="Recto / Verso">
          <select style={inputStyle} value={form.recto_verso?'oui':'non'} onChange={e=>f('recto_verso',e.target.value==='oui')}>
            <option value="non">Recto seul</option>
            <option value="oui">Recto-verso</option>
          </select>
        </Field>
        <Field label="Finition">
          <input list="finitions-prod" style={inputStyle} value={form.finition} onChange={e=>f('finition',e.target.value)} />
          <datalist id="finitions-prod">{FINITIONS.map(f=><option key={f} value={f}/>)}</datalist>
        </Field>
        <Field label="Nb. pages">
          <input type="number" min="1" style={inputStyle} value={form.nb_pages} onChange={e=>f('nb_pages',e.target.value)} placeholder="50" />
        </Field>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
        <Field label="Support / Papier">
          <input style={inputStyle} value={form.papier} onChange={e=>f('papier',e.target.value)} placeholder="Ex: Couché 250g" />
        </Field>
        <Field label="Date commande">
          <input type="date" style={inputStyle} value={form.date} onChange={e=>f('date',e.target.value)} />
        </Field>
        <Field label="Livraison prévue">
          <input type="date" style={inputStyle} value={form.date_livraison_prevue} onChange={e=>f('date_livraison_prevue',e.target.value)} />
        </Field>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Field label="Statut">
          <select style={inputStyle} value={form.statut} onChange={e=>f('statut',e.target.value)}>
            {STATUTS.map(s=><option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Notes internes">
          <input style={inputStyle} value={form.notes} onChange={e=>f('notes',e.target.value)} />
        </Field>
      </div>

      {/* Vérification stock/machine avant de lancer le BAT */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,background:'#F6F4F1',borderRadius:10,padding:'10px 14px',marginTop:4}}>
        <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
          <input type="checkbox" checked={form.stock_verifie} onChange={e=>f('stock_verifie',e.target.checked)} />
          📦 Stock papier/encre & machine vérifiés
        </label>
        <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
          <input type="checkbox" checked={form.bat_valide_client} onChange={e=>f('bat_valide_client',e.target.checked)} />
          ✅ BAT validé par le client
        </label>
      </div>
      {!form.stock_verifie && (
        <div style={{fontSize:11.5,color:'#D4780A',marginTop:4}}>
          ⚠️ Stock/machine pas encore vérifiés — si papier, encre ou pièces manquent, fais un bon de commande fournisseur avant de lancer le BAT.
        </div>
      )}

      {/* Sous-traitance : uniquement si nature = SOUS-TRAITANCE */}
      {form.nature === 'SOUS-TRAITANCE' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:10}}>
          <Field label="Sous-traitant">
            <select style={inputStyle} value={form.sous_traitant_id} onChange={e=>f('sous_traitant_id',e.target.value)}>
              <option value="">— Sélectionner —</option>
              {fournisseurs.map(fr=><option key={fr.id} value={fr.id}>{fr.nom}</option>)}
            </select>
          </Field>
          <Field label="Motif de la sous-traitance">
            <select style={inputStyle} value={form.motif_sous_traitance} onChange={e=>f('motif_sous_traitance',e.target.value)}>
              <option value="">— Sélectionner —</option>
              {MOTIFS_SOUS_TRAITANCE.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        </div>
      )}

      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:8}}>
        <BtnGhost onClick={close}>Annuler</BtnGhost>
        <BtnPrimary onClick={save} disabled={saving}>
          <Check size={15}/> {saving?'…':modal==='edit'?'Sauvegarder':'Créer l\'ordre'}
        </BtnPrimary>
      </div>
    </div>
  )

  // Stats rapides
  const stats = {
    total: prods.length,
    enCours: prods.filter(p=>p.statut==='En production').length,
    retard: prods.filter(p=>p.date_livraison_prevue && p.date_livraison_prevue < today() && p.statut !== 'Livré').length,
    livre: prods.filter(p=>p.statut==='Livré').length,
  }

  return (
    <div style={{padding:24}}>
      <PageHeader title="Production" subtitle={`${stats.total} ordres · ${stats.enCours} en cours · ${stats.retard} en retard`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher…"
        onAdd={openCreate} addLabel="Nouvel ordre"
        extra={
          <select value={filtreStatut} onChange={e=>setFiltreStatut(e.target.value)} style={{...inputStyle,width:'auto',padding:'9px 14px'}}>
            {['Tous',...STATUTS].map(s=><option key={s}>{s}</option>)}
          </select>
        }
      />

      {/* KPIs */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        {[
          {l:'En attente', v:prods.filter(p=>p.statut==='En attente').length, bg:'#FEF3E2', c:'#D4780A'},
          {l:'En production', v:stats.enCours, bg:'#E5EDF8', c:'#2A5FA5'},
          {l:'Terminé', v:prods.filter(p=>p.statut==='Terminé').length, bg:'#F0E8F8', c:'#7B2FA5'},
          {l:'Livré', v:stats.livre, bg:'#E8F7EE', c:'#2D7A4E'},
          {l:'En retard ⚠️', v:stats.retard, bg:'#FDE8E8', c:'#D14343'},
        ].map(k=>(
          <div key={k.l} style={{background:k.bg,borderRadius:12,padding:'10px 18px',textAlign:'center' as const,minWidth:90}}>
            <div style={{fontSize:24,fontWeight:900,color:k.c,lineHeight:1}}>{k.v}</div>
            <div style={{fontSize:11,fontWeight:700,color:k.c,marginTop:3}}>{k.l}</div>
          </div>
        ))}
      </div>

      <TableWrap minWidth={1000}>
        <thead><tr>
          {['Date','Client','Caractéristique','Type','Format','Qté','Statut','Livraison','Actions'].map(h=><th key={h} style={th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map(p => {
            const enRetard = p.date_livraison_prevue && p.date_livraison_prevue < today() && p.statut !== 'Livré'
            const sc = STATUT_STYLE[p.statut] || {bg:'#F0EEEC',color:'#7A736C'}
            return (
              <tr key={p.id} style={{background: enRetard ? '#FFF5F5' : undefined}}>
                <td style={{...td,fontSize:12,whiteSpace:'nowrap' as const}}>{formatDateFR(p.date)}</td>
                <td style={{...td,fontWeight:600,fontSize:13}}>
                  {p.clients?.nom||'—'}
                  {p.devis && (p.devis as {numero?:string})?.numero && <div style={{fontSize:10,color:'#2A5FA5'}}>📋 {(p.devis as {numero:string}).numero}</div>}
                </td>
                <td style={{...td,maxWidth:200}}>
                  <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>
                    {p.caracteristique.slice(0,50)}{p.caracteristique.length>50?'…':''}
                  </div>
                  {p.numero_bl && <div style={{fontSize:10,color:'#2D7A4E',marginTop:2}}>✅ {p.numero_bl}</div>}
                  {p.nature === 'SOUS-TRAITANCE' && (
                    <div style={{fontSize:10,color:'#7B2FA5',marginTop:2}}>
                      🤝 {p.fournisseurs?.nom||'Sous-traitant non défini'}{p.motif_sous_traitance?` · ${p.motif_sous_traitance}`:''}
                    </div>
                  )}
                  <div style={{fontSize:10,marginTop:2,display:'flex',gap:6}}>
                    <span style={{color:p.stock_verifie?'#2D7A4E':'#B0A89F'}} title="Stock/machine vérifiés">📦 {p.stock_verifie?'OK':'à vérifier'}</span>
                    <span style={{color:p.bat_valide_client?'#2D7A4E':'#B0A89F'}} title="BAT validé par le client">✅ {p.bat_valide_client?'BAT validé':'BAT en attente'}</span>
                  </div>
                </td>
                <td style={{...td,fontSize:11,color:'#7A736C'}}>{p.types_impression?.libelle||'—'}</td>
                <td style={{...td,fontSize:12}}>{p.format||'—'}</td>
                <td style={{...td,fontWeight:700}}>{p.quantite?.toLocaleString('fr-FR')}</td>
                <td style={td}>
                  <select value={p.statut} onChange={e=>changeStatut(p,e.target.value)}
                    style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:999,border:'none',cursor:'pointer',background:sc.bg,color:sc.color,fontFamily:'inherit'}}>
                    {STATUTS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{...td,fontSize:12}}>
                  {enRetard ? <span style={{color:'#D14343',fontWeight:700}}>⚠️ {formatDateFR(p.date_livraison_prevue)}</span>
                    : formatDateFR(p.date_livraison_prevue||null)}
                </td>
                <td style={{...td,textAlign:'right' as const}}>
                  <div style={{display:'flex',gap:2,justifyContent:'flex-end'}}>
                    <BtnIcon onClick={()=>openEdit(p)} title="Modifier"><Pencil size={14}/></BtnIcon>
                    <BtnIcon title="Bon de livraison" onClick={()=>{setSel(p);setBlNum(p.numero_bl||'');setModal('bl')}}>
                      <PackageCheck size={14} style={{color:'#2D7A4E'}}/>
                    </BtnIcon>
                    <BtnIcon onClick={()=>del(p)} danger title="Supprimer"><Trash2 size={14}/></BtnIcon>
                  </div>
                </td>
              </tr>
            )
          })}
          {filtered.length===0 && <EmptyRow text="Aucun ordre de production." cols={9}/>}
        </tbody>
      </TableWrap>

      {(modal==='create'||modal==='edit') && (
        <Modal title={modal==='edit'?`Modifier — ${sel?.caracteristique.slice(0,30)}…`:'Nouvel ordre de production'} onClose={close} wide>
          <FormBody/>
        </Modal>
      )}

      {modal==='bl' && sel && (
        <Modal title={`Bon de livraison — ${sel.clients?.nom||'—'}`} onClose={close}>
          <div style={{background:'#E8F7EE',borderRadius:10,padding:'12px 16px',marginBottom:16,fontSize:13}}>
            <div style={{fontWeight:700,marginBottom:4}}>{sel.caracteristique.slice(0,80)}</div>
            <div style={{color:'#7A736C'}}>Qté : {sel.quantite?.toLocaleString('fr-FR')} · Format : {sel.format||'—'}</div>
            {sel.devis && <div style={{color:'#2A5FA5',marginTop:4}}>📋 Réf. devis : {(sel.devis as {numero:string}).numero}</div>}
          </div>
          <Field label="Numéro de BL (auto si vide)">
            <input style={inputStyle} value={blNum} onChange={e=>setBlNum(e.target.value)}
              placeholder={`BL-${new Date().getFullYear()}-001`} />
          </Field>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:8}}>
            <BtnGhost onClick={close}>Annuler</BtnGhost>
            <BtnPrimary onClick={saveBL}>
              <Printer size={15}/> Générer & Imprimer le BL
            </BtnPrimary>
          </div>
        </Modal>
      )}
    </div>
  )
}
