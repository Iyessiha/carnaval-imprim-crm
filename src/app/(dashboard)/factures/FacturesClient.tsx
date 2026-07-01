'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatFCFA, formatDateFR, calculerTotaux, today } from '@/lib/utils'
import { certifierFacture, mapFactureToFnePayload } from '@/lib/fne/api'
import {
  Plus, Search, Pencil, Trash2, X, Check,
  Eye, Printer, Wallet, CheckCircle2, AlertCircle
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
type Client = { id:string; nom:string; ncc:string|null; telephone:string|null; email:string|null; adresse:string|null; template_fne_defaut:string }
type Produit = { id:string; nom:string; prix_base:number; unite:string }
type Ligne = { designation:string; qte:number; pu:number; remise_ligne:number; taxes:string[]; measurement_unit:string; produit_id?:string }
type Paiement = { id:string; date:string; montant:number; mode:string; reference:string|null }
type Facture = {
  id:string; numero:string; client_id:string; devis_id:string|null
  date:string; echeance:string|null; remise:number; tva_applicable:boolean
  notes:string|null; is_avoir:boolean; template_fne:string; payment_method_fne:string
  fne_certifiee:boolean; fne_reference:string|null; qr_code_url:string|null
  clients:{ nom:string; ncc:string|null; telephone:string|null; email:string|null; adresse:string|null; template_fne_defaut:string }|null
  factures_lignes:{ designation:string; qte:number; pu:number; remise_ligne:number; taxes:string[]; measurement_unit:string|null }[]
  paiements:Paiement[]
}
type Entreprise = { id:string; nom:string; forme:string; siege:string; tel:string; email:string; rc:string; ncc:string; regime:string; centre_impots:string; taux_tva:number; fne_point_of_sale:string|null; fne_establishment:string|null }
type FneConfig = { mode:string; actif:boolean; balance_stickers:number }

const TEMPLATES_FNE = ['B2B','B2G','B2C','B2F'] as const
const MODES_PAIEMENT = ['cash','mobile-money','wave','cheque','virement','carte'] as const

// ── Styles ─────────────────────────────────────────────────────
const S = {
  input:{ width:'100%', padding:'10px 12px', border:'1px solid #E4DDD6', borderRadius:10, fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit' } as React.CSSProperties,
  label:{ display:'block', fontSize:11, fontWeight:700, color:'#7A736C', marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'.3px' },
  btnPrimary:{ display:'inline-flex', alignItems:'center', gap:7, background:'#C2117A', color:'#fff', border:'none', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  btnGhost:{ display:'inline-flex', alignItems:'center', gap:7, background:'#fff', color:'#1B1A1C', border:'1px solid #E4DDD6', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  btnBlue:{ display:'inline-flex', alignItems:'center', gap:7, background:'#2A5FA5', color:'#fff', border:'none', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  iconBtn:{ background:'transparent', border:'none', cursor:'pointer', color:'#7A736C', padding:6, borderRadius:8, display:'inline-flex', alignItems:'center' } as React.CSSProperties,
}

const STATUT_PAY: Record<string,{bg:string;color:string;label:string}> = {
  'Payée':   { bg:'#e8f7ee', color:'#3A9A5C', label:'Payée' },
  'Partiel': { bg:'#fef3e2', color:'#F39200', label:'Partiel' },
  'Impayée': { bg:'#fde8e8', color:'#D14343', label:'Impayée' },
}

// ── Helpers ────────────────────────────────────────────────────
const statutPaiement = (ttc:number, paye:number) => paye >= ttc ? 'Payée' : paye > 0 ? 'Partiel' : 'Impayée'
const montantPaye = (f:Facture) => (f.paiements||[]).reduce((s,p)=>s+p.montant,0)

// ── Modal ──────────────────────────────────────────────────────
function Modal({ title, onClose, wide, children }:{ title:string; onClose:()=>void; wide?:boolean; children:React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(27,26,28,.45)', zIndex:50, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:16, overflowY:'auto' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:wide?760:520, marginTop:28, marginBottom:28, boxShadow:'0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #E4DDD6' }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={S.iconBtn}><X size={18}/></button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
      </div>
    </div>
  )
}

// ── Éditeur lignes ─────────────────────────────────────────────
function LignesEditor({ lignes, setLignes, produits }:{ lignes:Ligne[]; setLignes:(l:Ligne[])=>void; produits:Produit[] }) {
  const set = (i:number, k:keyof Ligne, v: string|number|string[]) => setLignes(lignes.map((l,j)=>j===i?{...l,[k]:v}:l))
  return (
    <div>
      <label style={S.label}>Lignes</label>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 60px 120px 30px', gap:6, marginBottom:6 }}>
        {['Désignation','Qté','P.U. HT',''].map(h=><div key={h} style={{ fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.3px' }}>{h}</div>)}
      </div>
      {lignes.map((l,i)=>(
        <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 60px 120px 30px', gap:6, marginBottom:8, alignItems:'center' }}>
          <input list="prods-fac" style={{ ...S.input, padding:'8px 10px' }} value={l.designation} placeholder="Désignation"
            onChange={e=>{ const p=produits.find(p=>p.nom===e.target.value); set(i,'designation',e.target.value); if(p) set(i,'pu',p.prix_base) }} />
          <input type="number" style={{ ...S.input, padding:'8px 10px' }} value={l.qte} min={1} onChange={e=>set(i,'qte',Number(e.target.value))} />
          <input type="number" style={{ ...S.input, padding:'8px 10px' }} value={l.pu} min={0} onChange={e=>set(i,'pu',Number(e.target.value))} />
          <button onClick={()=>setLignes(lignes.filter((_,j)=>j!==i))} style={{ ...S.iconBtn, color:'#D14343' }}><X size={15}/></button>
        </div>
      ))}
      <datalist id="prods-fac">{produits.map(p=><option key={p.id} value={p.nom}/>)}</datalist>
      <button onClick={()=>setLignes([...lignes,{ designation:'', qte:1, pu:0, remise_ligne:0, taxes:['TVA'], measurement_unit:'pcs' }])}
        style={{ ...S.btnGhost, padding:'7px 12px', fontSize:12, marginTop:4 }}>
        <Plus size={13}/> Ajouter
      </button>
    </div>
  )
}

// ── Totaux ─────────────────────────────────────────────────────
function TotauxBox({ lignes, remise, tva, tauxTva, paye }:{ lignes:Ligne[]; remise:number; tva:boolean; tauxTva:number; paye?:number }) {
  const t = calculerTotaux(lignes, remise, tauxTva, tva)
  const R = ({ l, v, b, accent }:{ l:string; v:string; b?:boolean; accent?:boolean }) => (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:b?15:13, fontWeight:b?800:500 }}>
      <span style={{ color:b?'#1B1A1C':'#7A736C' }}>{l}</span>
      <span style={{ color:accent?'#D14343':b?'#C2117A':'#1B1A1C' }}>{v}</span>
    </div>
  )
  return (
    <div style={{ background:'#F6F4F1', borderRadius:12, padding:14, marginTop:14 }}>
      <R l="Sous-total" v={formatFCFA(t.sousTotal)} />
      {remise>0 && <R l="Remise" v={`- ${formatFCFA(remise)}`} />}
      {tva && <R l={`TVA (${tauxTva}%)`} v={formatFCFA(t.tva)} />}
      <div style={{ borderTop:'1px solid #E4DDD6', marginTop:6, paddingTop:6 }}><R l="Total TTC" v={formatFCFA(t.ttc)} b /></div>
      {paye !== undefined && <>
        <R l="Réglé" v={formatFCFA(paye)} />
        <R l="Reste dû" v={formatFCFA(Math.max(0,t.ttc-paye))} accent={t.ttc-paye>0} />
      </>}
    </div>
  )
}

// ── Aperçu imprimable ──────────────────────────────────────────
function FacturePreview({ f, entreprise, tauxTva, onCertifier, certifying }:{
  f:Facture; entreprise:Entreprise|null; tauxTva:number; onCertifier:()=>void; certifying:boolean
}) {
  const printRef = useRef<HTMLDivElement>(null)
  const t = calculerTotaux(f.factures_lignes||[], f.remise, tauxTva, f.tva_applicable)
  const paye = montantPaye(f)

  const handlePrint = () => {
    const content = printRef.current?.innerHTML
    if (!content) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>Facture ${f.numero}</title>
    <style>body{font-family:Arial,sans-serif;font-size:13px;color:#1B1A1C;padding:32px}
    table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;text-align:left}
    th{background:#F6F4F1;font-size:11px;text-transform:uppercase;color:#7A736C}
    td{border-top:1px solid #E4DDD6}.ttl{font-weight:800;font-size:16px;color:#C2117A}
    .qr{text-align:center;margin-top:20px}</style></head><body>${content}</body></html>`)
    w.document.close()
    w.print()
  }

  return (
    <div>
      {/* Boutons */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', justifyContent:'flex-end' }}>
        {!f.fne_certifiee && (
          <button onClick={onCertifier} style={{ ...S.btnBlue, opacity:certifying?.7:1 }} disabled={certifying}>
            {certifying ? '⏳ Certification…' : '🏛️ Certifier FNE / DGI'}
          </button>
        )}
        <button onClick={handlePrint} style={S.btnPrimary}><Printer size={15}/> Imprimer / PDF</button>
      </div>

      {/* Badge FNE */}
      {f.fne_certifiee && (
        <div style={{ background:'#e8f7ee', border:'1px solid #b8e6c8', borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <CheckCircle2 size={18} color="#3A9A5C"/>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:'#3A9A5C' }}>Facture certifiée FNE ✓</div>
            <div style={{ fontSize:12, color:'#7A736C' }}>Réf. DGI : {f.fne_reference}</div>
          </div>
        </div>
      )}

      {/* Contenu imprimable */}
      <div ref={printRef}>
        {/* En-tête */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:24 }}>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:'#1B1A1C' }}>{entreprise?.nom || 'CARNAVAL IMPRIM'}</div>
            <div style={{ fontSize:12, color:'#7A736C', marginTop:4, lineHeight:1.6 }}>
              {entreprise?.forme}<br/>
              {entreprise?.siege}<br/>
              Tél : {entreprise?.tel}<br/>
              NCC : {entreprise?.ncc}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:28, fontWeight:800, color:'#C2117A' }}>FACTURE</div>
            <div style={{ fontWeight:700, fontSize:15, marginTop:4 }}>{f.numero}</div>
            <div style={{ fontSize:13, color:'#7A736C' }}>Date : {formatDateFR(f.date)}</div>
            {f.echeance && <div style={{ fontSize:13, color:'#7A736C' }}>Échéance : {formatDateFR(f.echeance)}</div>}
            <div style={{ marginTop:6 }}>
              <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:'#e5edf8', color:'#2A5FA5' }}>{f.template_fne}</span>
            </div>
          </div>
        </div>

        {/* Client */}
        <div style={{ background:'#F6F4F1', borderRadius:12, padding:14, marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', marginBottom:6 }}>Facturé à</div>
          <div style={{ fontWeight:700, fontSize:15 }}>{f.clients?.nom}</div>
          <div style={{ fontSize:13, color:'#7A736C', marginTop:4, lineHeight:1.6 }}>
            {f.clients?.telephone && <span>{f.clients.telephone}<br/></span>}
            {f.clients?.email && <span>{f.clients.email}<br/></span>}
            {f.clients?.adresse && <span>{f.clients.adresse}<br/></span>}
            {f.clients?.ncc && <span>NCC : {f.clients.ncc}</span>}
          </div>
        </div>

        {/* Lignes */}
        <table>
          <thead>
            <tr>
              <th style={{ fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', padding:'10px 12px', background:'#F6F4F1', textAlign:'left' }}>Désignation</th>
              <th style={{ fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', padding:'10px 12px', background:'#F6F4F1', textAlign:'right' }}>Qté</th>
              <th style={{ fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', padding:'10px 12px', background:'#F6F4F1', textAlign:'right' }}>P.U.</th>
              <th style={{ fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', padding:'10px 12px', background:'#F6F4F1', textAlign:'right' }}>Montant</th>
            </tr>
          </thead>
          <tbody>
            {f.factures_lignes.map((l,i)=>(
              <tr key={i}>
                <td style={{ padding:'10px 12px', borderTop:'1px solid #E4DDD6' }}>{l.designation}</td>
                <td style={{ padding:'10px 12px', borderTop:'1px solid #E4DDD6', textAlign:'right' }}>{l.qte}</td>
                <td style={{ padding:'10px 12px', borderTop:'1px solid #E4DDD6', textAlign:'right' }}>{formatFCFA(l.pu)}</td>
                <td style={{ padding:'10px 12px', borderTop:'1px solid #E4DDD6', textAlign:'right', fontWeight:600 }}>{formatFCFA(l.qte*l.pu)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
          <div style={{ width:300 }}>
            {[
              ['Sous-total', formatFCFA(t.sousTotal), false],
              ...(f.remise>0 ? [['Remise', `- ${formatFCFA(f.remise)}`, false]] : []),
              ...(f.tva_applicable ? [[`TVA (${tauxTva}%)`, formatFCFA(t.tva), false]] : [['TVA', 'Exonéré', false]]),
              ['TOTAL TTC', formatFCFA(t.ttc), true],
              ['Réglé', formatFCFA(paye), false],
              ['Reste dû', formatFCFA(Math.max(0,t.ttc-paye)), false],
            ].map(([l,v,b],i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderTop: b ? '2px solid #1B1A1C' : 'none', marginTop: b ? 6 : 0, paddingTop: b ? 8 : 4, fontSize: b ? 16 : 13, fontWeight: b ? 800 : 500 }}>
                <span style={{ color: b ? '#1B1A1C' : '#7A736C' }}>{String(l)}</span>
                <span style={{ color: b ? '#C2117A' : '#1B1A1C' }}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code FNE */}
        {f.fne_certifiee && f.qr_code_url && (
          <div style={{ textAlign:'center', marginTop:24, padding:16, border:'1px solid #E4DDD6', borderRadius:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#7A736C', marginBottom:8 }}>FACTURE NORMALISÉE ÉLECTRONIQUE — DGI CI</div>
            <img src={f.qr_code_url} alt="QR Code FNE" style={{ width:120, height:120 }} />
            <div style={{ fontSize:11, color:'#7A736C', marginTop:6 }}>Réf. : {f.fne_reference}</div>
          </div>
        )}

        {/* Pied de page */}
        <div style={{ marginTop:32, paddingTop:16, borderTop:'1px solid #E4DDD6', fontSize:11, color:'#7A736C', textAlign:'center', lineHeight:1.6 }}>
          {entreprise?.nom} — {entreprise?.forme} · {entreprise?.siege}<br/>
          RC N° : {entreprise?.rc} · NCC : {entreprise?.ncc} · Régime : {entreprise?.regime} · Centre des impôts : {entreprise?.centre_impots}
        </div>
      </div>
    </div>
  )
}

// ── Formulaire encaissement ────────────────────────────────────
function PaiementForm({ f, tauxTva, onSave, onCancel }:{ f:Facture; tauxTva:number; onSave:(p:{date:string;montant:number;mode:string;reference:string})=>void; onCancel:()=>void }) {
  const ttc = calculerTotaux(f.factures_lignes||[], f.remise, tauxTva, f.tva_applicable).ttc
  const paye = montantPaye(f)
  const reste = Math.max(0, ttc - paye)
  const [form, setForm] = useState({ date:today(), montant:reste, mode:'cash', reference:'' })
  return (
    <div>
      <div style={{ background:'#F6F4F1', borderRadius:10, padding:'12px 14px', marginBottom:16, fontSize:13 }}>
        Reste dû : <strong style={{ color:'#C2117A', fontSize:16 }}>{formatFCFA(reste)}</strong>
      </div>
      <div style={{ marginBottom:14 }}><label style={S.label}>Date</label><input type="date" style={S.input} value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} /></div>
      <div style={{ marginBottom:14 }}><label style={S.label}>Montant (FCFA)</label><input type="number" style={S.input} value={form.montant} min={1} max={reste} onChange={e=>setForm(p=>({...p,montant:Number(e.target.value)}))} /></div>
      <div style={{ marginBottom:14 }}><label style={S.label}>Mode de paiement</label>
        <select style={S.input} value={form.mode} onChange={e=>setForm(p=>({...p,mode:e.target.value}))}>
          {MODES_PAIEMENT.map(m=><option key={m} value={m}>{m === 'cash' ? 'Espèces' : m === 'mobile-money' ? 'Mobile Money' : m === 'wave' ? 'Wave' : m === 'cheque' ? 'Chèque' : m === 'virement' ? 'Virement' : 'Carte'}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:16 }}><label style={S.label}>Référence (optionnel)</label><input style={S.input} value={form.reference} onChange={e=>setForm(p=>({...p,reference:e.target.value}))} placeholder="N° transaction Wave / Mobile Money…" /></div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
        <button onClick={onCancel} style={S.btnGhost}>Annuler</button>
        <button onClick={()=>onSave(form)} style={S.btnPrimary}><Check size={16}/> Enregistrer le paiement</button>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────
export default function FacturesClient({ factures:initial, clients, produits, entreprise, fneConfig }:{
  factures:Facture[]; clients:Client[]; produits:Produit[]
  entreprise:Entreprise|null; fneConfig:FneConfig|null
}) {
  const router = useRouter()
  const supabase = createClient()
  const [factures, setFactures] = useState<Facture[]>(initial)
  const [q, setQ] = useState('')
  const [filterPay, setFilterPay] = useState('Tous')
  const [modal, setModal] = useState<'create'|'edit'|'view'|'pay'|null>(null)
  const [selected, setSelected] = useState<Facture|null>(null)
  const [loading, setLoading] = useState(false)
  const [certifying, setCertifying] = useState(false)

  // Formulaire création/édition
  const [fForm, setFForm] = useState({
    clientId: clients[0]?.id||'', date:today(), echeance:'',
    remise:0, tvaApplicable:true, notes:'',
    templateFne:'B2B' as string, paymentMethod:'cash' as string,
    lignes:[] as Ligne[],
  })

  const filtered = useMemo(()=>{
    let list = factures
    if (filterPay !== 'Tous') list = list.filter(f => {
      const ttc = calculerTotaux(f.factures_lignes||[], f.remise, entreprise?.taux_tva||18, f.tva_applicable).ttc
      return statutPaiement(ttc, montantPaye(f)) === filterPay
    })
    return list.filter(f=>[f.numero, f.clients?.nom||''].join(' ').toLowerCase().includes(q.toLowerCase()))
  }, [factures, q, filterPay, entreprise])

  const getTtc = (f:Facture) => calculerTotaux(f.factures_lignes||[], f.remise, entreprise?.taux_tva||18, f.tva_applicable).ttc

  // Créer facture
  const handleCreate = async () => {
    setLoading(true)
    const year = new Date().getFullYear()
    const { data: numData } = await supabase.rpc('next_numero', { p_type:'FA', p_annee:year })
    const { data: created, error } = await supabase.from('factures').insert({
      numero:numData, client_id:fForm.clientId, date:fForm.date,
      echeance:fForm.echeance||null, remise:fForm.remise,
      tva_applicable:fForm.tvaApplicable, notes:fForm.notes||null,
      template_fne:fForm.templateFne, payment_method_fne:fForm.paymentMethod,
    }).select().single()
    if (!error && created && fForm.lignes.length) {
      await supabase.from('factures_lignes').insert(
        fForm.lignes.map((l,i)=>({ ...l, facture_id:created.id, ordre:i }))
      )
    }
    const { data: full } = await supabase.from('factures').select('*, clients(nom,ncc,telephone,email,adresse,template_fne_defaut), factures_lignes(*), paiements(*)').eq('id', created?.id||'').single()
    if (full) setFactures(prev=>[full,...prev])
    setModal(null); setLoading(false); router.refresh()
  }

  // Encaisser paiement
  const handlePaiement = async (p:{date:string;montant:number;mode:string;reference:string}) => {
    if (!selected) return
    const { data } = await supabase.from('paiements').insert({ facture_id:selected.id, ...p }).select().single()
    if (data) {
      setFactures(prev=>prev.map(f=>f.id===selected.id ? { ...f, paiements:[...f.paiements, data] } : f))
      setSelected(prev=>prev ? { ...prev, paiements:[...prev.paiements, data] } : prev)
    }
    setModal(null); router.refresh()
  }

  // Certifier FNE
  const handleCertifier = async () => {
    if (!selected || !entreprise) return
    setCertifying(true)
    try {
      const payload = mapFactureToFnePayload(
        { template_fne: selected.template_fne as 'B2B'|'B2G'|'B2C'|'B2F', payment_method_fne: selected.payment_method_fne as 'cash'|'mobile-money'|'wave'|'cheque'|'virement'|'carte', is_avoir:selected.is_avoir, lignes:selected.factures_lignes.map(l=>({ ...l, taxes:l.taxes||['TVA'], measurement_unit:l.measurement_unit||'pcs' })), remise:selected.remise },
        { nom:selected.clients?.nom||'', telephone:selected.clients?.telephone||'', email:selected.clients?.email||undefined, ncc:selected.clients?.ncc||undefined },
        { fne_point_of_sale:entreprise.fne_point_of_sale||entreprise.nom, fne_establishment:entreprise.fne_establishment||entreprise.nom, ncc:entreprise.ncc }
      )
      const result = await certifierFacture(payload)
      await supabase.from('factures').update({ fne_certifiee:true, fne_reference:result.reference, qr_code_url:result.qrCodeUrl }).eq('id', selected.id)
      await supabase.from('fne_transmissions').insert({ facture_id:selected.id, statut:'certifié', invoice_type:'sale', template:selected.template_fne, payment_method:selected.payment_method_fne, fne_reference:result.reference, fne_token:result.token, qr_code_url:result.qrCodeUrl, balance_stickers:result.balanceStickers, transmitted_at:new Date().toISOString() })
      const updated = { ...selected, fne_certifiee:true, fne_reference:result.reference, qr_code_url:result.qrCodeUrl }
      setFactures(prev=>prev.map(f=>f.id===selected.id ? updated : f))
      setSelected(updated)
      alert(`✅ Facture certifiée ! Réf. DGI : ${result.reference}`)
    } catch (err) {
      alert(`❌ Erreur FNE : ${err instanceof Error ? err.message : String(err)}`)
    }
    setCertifying(false); router.refresh()
  }

  const openView = (f:Facture) => { setSelected(f); setModal('view') }
  const openPay  = (f:Facture) => { setSelected(f); setModal('pay') }
  const openCreate = () => {
    setFForm({ clientId:clients[0]?.id||'', date:today(), echeance:'', remise:0, tvaApplicable:true, notes:'', templateFne:'B2B', paymentMethod:'cash', lignes:[{designation:'',qte:1,pu:0,remise_ligne:0,taxes:['TVA'],measurement_unit:'pcs'}] })
    setModal('create')
  }

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Factures</h1>
        <p style={{ color:'#7A736C', fontSize:14, margin:'4px 0 0' }}>{factures.length} facture{factures.length>1?'s':''}</p>
      </div>

      {/* Bannière FNE */}
      {fneConfig && (
        <div style={{ background:'linear-gradient(135deg,#1B3A5C,#2A5FA5)', borderRadius:14, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:22 }}>🏛️</span>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:'#fff' }}>FNE / DGI Côte d&apos;Ivoire — {fneConfig.mode === 'test' ? '⚠️ Mode Test' : '✅ Production'}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.7)' }}>Certification électronique obligatoire · services.fne.dgi.gouv.ci</div>
            </div>
          </div>
          <div style={{ color:'#fff', fontSize:13, fontWeight:600 }}>
            {fneConfig.balance_stickers} sticker{fneConfig.balance_stickers>1?'s':''} restant{fneConfig.balance_stickers>1?'s':''}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={16} style={{ position:'absolute', left:12, top:12, color:'#7A736C' }} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher une facture…" style={{ ...S.input, paddingLeft:36 }} />
        </div>
        <select value={filterPay} onChange={e=>setFilterPay(e.target.value)} style={{ ...S.input, width:'auto', padding:'10px 14px' }}>
          <option>Tous</option>
          <option>Impayée</option>
          <option>Partiel</option>
          <option>Payée</option>
        </select>
        <button style={S.btnPrimary} onClick={openCreate}><Plus size={16}/> Nouvelle facture</button>
      </div>

      {/* Tableau */}
      <div style={{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:14, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:820 }}>
            <thead>
              <tr style={{ background:'#F6F4F1' }}>
                {['N°','Client','Date','TTC','Reste dû','FNE','Statut',''].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'11px 16px', fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.3px', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f=>{
                const ttc = getTtc(f)
                const paye = montantPaye(f)
                const reste = Math.max(0, ttc-paye)
                const sp = STATUT_PAY[statutPaiement(ttc,paye)]
                return (
                  <tr key={f.id} style={{ borderTop:'1px solid #E4DDD6' }}>
                    <td style={{ padding:'13px 16px', fontWeight:700, fontSize:14 }}>{f.numero}</td>
                    <td style={{ padding:'13px 16px', fontSize:13 }}>{f.clients?.nom||'—'}</td>
                    <td style={{ padding:'13px 16px', fontSize:13, whiteSpace:'nowrap' }}>{formatDateFR(f.date)}</td>
                    <td style={{ padding:'13px 16px', fontWeight:600 }}>{formatFCFA(ttc)}</td>
                    <td style={{ padding:'13px 16px', fontWeight:600, color:reste>0?'#D14343':'#3A9A5C' }}>{formatFCFA(reste)}</td>
                    <td style={{ padding:'13px 16px' }}>
                      {f.fne_certifiee
                        ? <span style={{ fontSize:11, fontWeight:700, color:'#3A9A5C', background:'#e8f7ee', padding:'3px 8px', borderRadius:6 }}>Certifiée ✓</span>
                        : <span style={{ fontSize:11, fontWeight:700, color:'#7A736C', background:'#F6F4F1', padding:'3px 8px', borderRadius:6 }}>En attente</span>}
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:999, background:sp.bg, color:sp.color }}>● {sp.label}</span>
                    </td>
                    <td style={{ padding:'13px 16px', textAlign:'right', whiteSpace:'nowrap' }}>
                      <button onClick={()=>openPay(f)} style={{ ...S.iconBtn, color:'#3A9A5C' }} title="Encaisser"><Wallet size={16}/></button>
                      <button onClick={()=>openView(f)} style={S.iconBtn} title="Aperçu"><Eye size={16}/></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length===0 && <div style={{ padding:48, textAlign:'center', color:'#7A736C', fontSize:14 }}>{q||filterPay!=='Tous'?'Aucun résultat':'Aucune facture. Créez la première !'}</div>}
      </div>

      {/* Modal Créer */}
      {modal==='create' && (
        <Modal title="Nouvelle facture" onClose={()=>setModal(null)} wide>
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div><label style={S.label}>Client *</label>
                <select style={S.input} value={fForm.clientId} onChange={e=>{ const c=clients.find(x=>x.id===e.target.value); setFForm(p=>({...p,clientId:e.target.value,templateFne:c?.template_fne_defaut||'B2B'})) }}>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div><label style={S.label}>Date</label><input type="date" style={S.input} value={fForm.date} onChange={e=>setFForm(p=>({...p,date:e.target.value}))} /></div>
              <div><label style={S.label}>Échéance</label><input type="date" style={S.input} value={fForm.echeance} onChange={e=>setFForm(p=>({...p,echeance:e.target.value}))} /></div>
              <div><label style={S.label}>Template FNE</label>
                <select style={S.input} value={fForm.templateFne} onChange={e=>setFForm(p=>({...p,templateFne:e.target.value}))}>
                  {TEMPLATES_FNE.map(t=><option key={t} value={t}>{t} {t==='B2B'?'(Entreprise)':t==='B2G'?'(État)':t==='B2C'?'(Particulier)':'(International)'}</option>)}
                </select>
              </div>
              <div><label style={S.label}>Mode de paiement</label>
                <select style={S.input} value={fForm.paymentMethod} onChange={e=>setFForm(p=>({...p,paymentMethod:e.target.value}))}>
                  {MODES_PAIEMENT.map(m=><option key={m} value={m}>{m==='cash'?'Espèces':m==='mobile-money'?'Mobile Money':m==='wave'?'Wave':m==='cheque'?'Chèque':m==='virement'?'Virement':'Carte'}</option>)}
                </select>
              </div>
              <div><label style={S.label}>Remise (FCFA)</label><input type="number" style={S.input} value={fForm.remise} min={0} onChange={e=>setFForm(p=>({...p,remise:Number(e.target.value)}))} /></div>
            </div>
            <LignesEditor lignes={fForm.lignes} setLignes={l=>setFForm(p=>({...p,lignes:l}))} produits={produits} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14, alignItems:'center' }}>
              <div><label style={S.label}>Notes</label><textarea style={{ ...S.input, minHeight:52, resize:'vertical' }} value={fForm.notes} onChange={e=>setFForm(p=>({...p,notes:e.target.value}))} /></div>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14 }}>
                <input type="checkbox" checked={fForm.tvaApplicable} onChange={e=>setFForm(p=>({...p,tvaApplicable:e.target.checked}))} /> TVA ({entreprise?.taux_tva||18}%)
              </label>
            </div>
            <TotauxBox lignes={fForm.lignes} remise={fForm.remise} tva={fForm.tvaApplicable} tauxTva={entreprise?.taux_tva||18} />
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:16 }}>
              <button onClick={()=>setModal(null)} style={S.btnGhost}>Annuler</button>
              <button style={{ ...S.btnPrimary, opacity:loading?.7:1 }} disabled={loading||!fForm.clientId||!fForm.lignes.length} onClick={handleCreate}>
                <Check size={16}/> {loading?'Création…':'Créer la facture'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Aperçu */}
      {modal==='view' && selected && (
        <Modal title={`Facture ${selected.numero}`} onClose={()=>{ setModal(null); setSelected(null) }} wide>
          <FacturePreview f={selected} entreprise={entreprise} tauxTva={entreprise?.taux_tva||18} onCertifier={handleCertifier} certifying={certifying} />
        </Modal>
      )}

      {/* Modal Paiement */}
      {modal==='pay' && selected && (
        <Modal title={`Encaisser — ${selected.numero}`} onClose={()=>{ setModal(null); setSelected(null) }}>
          <PaiementForm f={selected} tauxTva={entreprise?.taux_tva||18} onSave={handlePaiement} onCancel={()=>{ setModal(null); setSelected(null) }} />
        </Modal>
      )}
    </div>
  )
}
