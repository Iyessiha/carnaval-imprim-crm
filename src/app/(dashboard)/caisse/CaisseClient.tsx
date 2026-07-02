'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/any'
import { formatFCFA, formatDateFR, today } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import { ArrowUpCircle, ArrowDownCircle, Wallet, Printer, Plus, Trash2, Check, Lock, Unlock, RefreshCw } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────
type Operation = {
  id: string; date: string; heure?: string; type: 'entree'|'sortie'
  categorie: string; libelle: string; montant: number
  facture_id?: string; depense_id?: string; reference?: string; notes?: string
  factures?: { numero: string; clients?: { nom: string }|null }|null
  depenses?: { libelle: string }|null
}
type Ouverture = {
  id: string; date: string; solde_debut: number; solde_fin?: number; ferme: boolean; notes?: string
}
type Facture = { id: string; numero: string; clients?: { nom: string }|null }
type Depense = { id: string; libelle: string; date: string }
type Ent = Record<string,string>|null

// ── Catégories ────────────────────────────────────────────────────
const CATS_ENTREE = [
  'Règlement facture','Avance client','Remboursement fournisseur',
  'Apport caisse','Vente comptoir','Autre encaissement'
]
const CATS_SORTIE = [
  'Paiement facture fournisseur','Achat matières premières',
  'Frais de transport','Salaire / avance','Loyer',
  'Électricité / Eau','Téléphone','Remboursement client',
  'Dépense bureau','Autre décaissement'
]

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const MOIS_LONG = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

export default function CaisseClient({ operations: initial, ouvertures: initOuv, factures, depenses, entreprise }: {
  operations: Operation[]; ouvertures: Ouverture[]
  factures: Facture[]; depenses: Depense[]; entreprise: Ent
}) {
  const router = useRouter()
  const annee = new Date().getFullYear()
  const moisActuel = new Date().getMonth()

  const [operations, setOperations] = useState(initial)
  const [ouvertures, setOuvertures] = useState(initOuv)
  const [moisFiltre, setMoisFiltre] = useState(moisActuel)
  const [anneeFiltre, setAnneeFiltre] = useState(annee)
  const [modal, setModal] = useState<'entree'|'sortie'|'ouverture'|null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Formulaire opération
  const emptyOp = {
    date: today(), type: 'entree' as 'entree'|'sortie',
    categorie: 'Règlement facture', libelle: '',
    montant: 0, facture_id: '', depense_id: '', reference: '', notes: '',
  }
  const [form, setForm] = useState(emptyOp)
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  // Formulaire ouverture
  const [formOuv, setFormOuv] = useState({ date: today(), solde_debut: 0, notes: '' })

  // ── Calculs ────────────────────────────────────────────────────
  const opsMois = useMemo(() => operations.filter(op => {
    const d = new Date(op.date)
    return d.getFullYear() === anneeFiltre && d.getMonth() === moisFiltre
  }), [operations, anneeFiltre, moisFiltre])

  const ouverturesMois = useMemo(() => ouvertures.filter(o => {
    const d = new Date(o.date)
    return d.getFullYear() === anneeFiltre && d.getMonth() === moisFiltre
  }), [ouvertures, anneeFiltre, moisFiltre])

  const soldDebutMois = ouverturesMois.length > 0
    ? ouverturesMois[ouverturesMois.length - 1].solde_debut
    : 0

  const totalEntrees = opsMois.filter(op => op.type === 'entree').reduce((s, op) => s + op.montant, 0)
  const totalSorties = opsMois.filter(op => op.type === 'sortie').reduce((s, op) => s + op.montant, 0)
  const soldeFin = soldDebutMois + totalEntrees - totalSorties

  // Solde courant (toutes opérations jusqu'à aujourd'hui)
  const soldeCourant = useMemo(() => {
    const premOuv = [...ouvertures].sort((a, b) => a.date.localeCompare(b.date))
    const base = premOuv[0]?.solde_debut || 0
    const totEntr = operations.filter(op => op.type === 'entree').reduce((s, op) => s + op.montant, 0)
    const totSort = operations.filter(op => op.type === 'sortie').reduce((s, op) => s + op.montant, 0)
    return base + totEntr - totSort
  }, [operations, ouvertures])

  // Données par jour du mois pour le graphique
  const parJour = useMemo(() => {
    const jours: Record<string, { entrees: number; sorties: number }> = {}
    opsMois.forEach(op => {
      if (!jours[op.date]) jours[op.date] = { entrees: 0, sorties: 0 }
      if (op.type === 'entree') jours[op.date].entrees += op.montant
      else jours[op.date].sorties += op.montant
    })
    return Object.entries(jours).sort(([a], [b]) => a.localeCompare(b))
  }, [opsMois])

  // ── Actions ────────────────────────────────────────────────────
  const saveOp = async () => {
    if (!form.libelle.trim()) { setError('Libellé obligatoire.'); return }
    if (!form.montant || form.montant <= 0) { setError('Montant invalide.'); return }
    setLoading(true); setError('')
    const sb = getSupabase()
    const body = {
      date: form.date, type: form.type, categorie: form.categorie,
      libelle: form.libelle, montant: form.montant,
      facture_id: form.facture_id || null,
      depense_id: form.depense_id || null,
      reference: form.reference || null,
      notes: form.notes || null,
    }
    const { data, error: e } = await sb.from('caisse_operations').insert(body).select(`
      *, factures(numero, clients(nom)), depenses(libelle)
    `).single()
    if (e) { setError(e.message); setLoading(false); return }
    setOperations(prev => [data as Operation, ...prev])
    setLoading(false); setModal(null); router.refresh()
  }

  const saveOuverture = async () => {
    setLoading(true); setError('')
    const sb = getSupabase()
    const { data, error: e } = await sb.from('caisse_ouvertures')
      .upsert({ date: formOuv.date, solde_debut: formOuv.solde_debut, notes: formOuv.notes || null, ferme: false }, { onConflict: 'date' })
      .select().single()
    if (e) { setError(e.message); setLoading(false); return }
    setOuvertures(prev => [data as Ouverture, ...prev.filter(o => o.date !== formOuv.date)])
    setLoading(false); setModal(null); router.refresh()
  }

  const fermerCaisse = async (date: string) => {
    if (!confirm(`Fermer la caisse du ${formatDateFR(date)} ?`)) return
    const ouv = ouvertures.find(o => o.date === date)
    if (!ouv) return
    const opsJour = operations.filter(op => op.date === date)
    const entr = opsJour.filter(op => op.type === 'entree').reduce((s, op) => s + op.montant, 0)
    const sort = opsJour.filter(op => op.type === 'sortie').reduce((s, op) => s + op.montant, 0)
    const soldFinJour = ouv.solde_debut + entr - sort
    const sb = getSupabase()
    await sb.from('caisse_ouvertures').update({ ferme: true, solde_fin: soldFinJour }).eq('id', ouv.id)
    setOuvertures(prev => prev.map(o => o.id === ouv.id ? { ...o, ferme: true, solde_fin: soldFinJour } : o))
    router.refresh()
  }

  const delOp = async (op: Operation) => {
    if (!confirm('Supprimer cette opération ?')) return
    const sb = getSupabase()
    await sb.from('caisse_operations').delete().eq('id', op.id)
    setOperations(prev => prev.filter(x => x.id !== op.id)); router.refresh()
  }

  // ── Impression journal ─────────────────────────────────────────
  const imprimer = () => {
    const ent = entreprise
    let soldeRunning = soldDebutMois
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Journal de caisse ${MOIS_LONG[moisFiltre]} ${anneeFiltre}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:12px;color:#1B1A1C;padding:28px}
  .logo{font-size:18px;font-weight:900}.logo span{color:#C2117A}
  h2{color:#C2117A;margin:20px 0 10px;font-size:14px;border-bottom:2px solid #C2117A;padding-bottom:5px}
  table{width:100%;border-collapse:collapse;margin-bottom:12px}
  th{background:#1B1A1C;color:#fff;padding:7px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase}
  td{padding:6px 10px;border-bottom:1px solid #eee;font-size:11px}
  tr:nth-child(even) td{background:#fafafa}
  .entr{color:#3A9A5C;font-weight:700}.sort{color:#D14343;font-weight:700}
  .solde{font-weight:900}.kpi-row{display:flex;gap:12px;margin:12px 0}
  .kpi{background:#F6F4F1;border-radius:6px;padding:10px 14px;flex:1;text-align:center}
  .kpi-val{font-size:16px;font-weight:900;color:#C2117A}
  .kpi-lab{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-top:3px}
  .footer{margin-top:28px;font-size:10px;color:#888;border-top:1px solid #eee;padding-top:10px;text-align:center}
  .sign{display:flex;justify-content:space-between;margin-top:32px}
  .sign-box{text-align:center;width:220px}
  .sign-line{border-bottom:1px solid #000;margin-top:28px;width:100%}
  @media print{body{padding:16px}}
</style></head><body>
<div style="display:flex;justify-content:space-between;margin-bottom:20px">
  <div><div class="logo">CARNAVAL<span>IMPRIM</span></div>
  <div style="font-size:10px;color:#888;margin-top:3px">NCC : ${ent?.ncc||'240220333S'} · ${ent?.siege||''}</div></div>
  <div style="text-align:right;font-size:10px;color:#888">Journal de caisse<br>${MOIS_LONG[moisFiltre]} ${anneeFiltre}</div>
</div>
<div class="kpi-row">
  <div class="kpi"><div class="kpi-val">${formatFCFA(soldDebutMois)}</div><div class="kpi-lab">Solde début</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#3A9A5C">${formatFCFA(totalEntrees)}</div><div class="kpi-lab">Total entrées</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#D14343">${formatFCFA(totalSorties)}</div><div class="kpi-lab">Total sorties</div></div>
  <div class="kpi"><div class="kpi-val" style="color:${soldeFin >= 0 ? '#3A9A5C':'#D14343'}">${formatFCFA(soldeFin)}</div><div class="kpi-lab">Solde fin</div></div>
</div>
<h2>JOURNAL DES OPÉRATIONS</h2>
<table>
  <thead><tr>
    <th>Date</th><th>Heure</th><th>Catégorie</th><th>Libellé</th><th>Réf.</th>
    <th style="text-align:right">Entrée</th><th style="text-align:right">Sortie</th>
    <th style="text-align:right">Solde</th>
  </tr></thead>
  <tbody>
  <tr><td colspan="5" style="background:#E5EDF8;font-weight:700">Report solde début de mois</td>
    <td></td><td></td><td style="text-align:right;font-weight:900">${formatFCFA(soldDebutMois)}</td></tr>
  ${[...opsMois].sort((a,b) => (a.date+a.heure).localeCompare(b.date+b.heure)).map(op => {
    if (op.type === 'entree') soldeRunning += op.montant
    else soldeRunning -= op.montant
    return `<tr>
      <td>${formatDateFR(op.date)}</td>
      <td>${op.heure?.slice(0,5)||'—'}</td>
      <td>${op.categorie}</td>
      <td>${op.libelle}${op.factures ? ` (${op.factures.numero})` : ''}</td>
      <td style="color:#888">${op.reference||'—'}</td>
      <td style="text-align:right" class="${op.type==='entree'?'entr':''}">
        ${op.type==='entree' ? formatFCFA(op.montant) : ''}
      </td>
      <td style="text-align:right" class="${op.type==='sortie'?'sort':''}">
        ${op.type==='sortie' ? formatFCFA(op.montant) : ''}
      </td>
      <td style="text-align:right" class="solde" style="color:${soldeRunning>=0?'#3A9A5C':'#D14343'}">
        ${formatFCFA(soldeRunning)}
      </td>
    </tr>`
  }).join('')}
  <tr style="background:#1B1A1C;color:#fff;font-weight:800">
    <td colspan="5">TOTAL ${MOIS_LONG[moisFiltre]} ${anneeFiltre}</td>
    <td style="text-align:right;color:#80ff9a">${formatFCFA(totalEntrees)}</td>
    <td style="text-align:right;color:#ff8080">${formatFCFA(totalSorties)}</td>
    <td style="text-align:right;color:${soldeFin>=0?'#80ff9a':'#ff8080'}">${formatFCFA(soldeFin)}</td>
  </tr>
  </tbody>
</table>
<div class="sign">
  <div class="sign-box"><div class="sign-line"></div><p style="margin-top:6px;font-size:10px">Caissier(e)</p></div>
  <div class="sign-box"><div class="sign-line"></div><p style="margin-top:6px;font-size:10px">Responsable / Gérant</p></div>
</div>
<div class="footer">
  ${ent?.nom||'CARNAVAL IMPRIM'} — NCC : ${ent?.ncc||'240220333S'} — Journal édité le ${new Date().toLocaleDateString('fr-FR')}
</div>
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400) }
  }

  // ── Formulaire opération ────────────────────────────────────────
  const OpForm = (type: 'entree'|'sortie') => {
    const cats = type === 'entree' ? CATS_ENTREE : CATS_SORTIE
    const color = type === 'entree' ? '#3A9A5C' : '#D14343'
    return (
      <div>
        {error && <div style={{ background:'#fde8e8',color:'#D14343',padding:'10px 14px',borderRadius:10,marginBottom:14,fontSize:13 }}>{error}</div>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Date"><input type="date" style={inputStyle} value={form.date} onChange={e => setF('date', e.target.value)} /></Field>
          <Field label="Catégorie *">
            <select style={inputStyle} value={form.categorie} onChange={e => setF('categorie', e.target.value)}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Libellé *">
          <input style={inputStyle} value={form.libelle} onChange={e => setF('libelle', e.target.value)}
            placeholder={type === 'entree' ? 'Ex: Paiement Wave facture FA-2026-012' : 'Ex: Achat papier couché 250g'} />
        </Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Montant (FCFA) *">
            <input type="number" min="1" style={inputStyle} value={form.montant||''} onChange={e => setF('montant', Number(e.target.value))}
              placeholder="0" />
          </Field>
          <Field label="N° référence / ticket">
            <input style={inputStyle} value={form.reference} onChange={e => setF('reference', e.target.value)} placeholder="Optionnel" />
          </Field>
        </div>
        {type === 'entree' && (
          <Field label="Lier à une facture (optionnel)">
            <select style={inputStyle} value={form.facture_id} onChange={e => {
              setF('facture_id', e.target.value)
              const fac = factures.find(f => f.id === e.target.value)
              if (fac) setF('libelle', `Règlement ${fac.numero} — ${fac.clients?.nom||''}`)
            }}>
              <option value="">— Aucune —</option>
              {factures.map(f => <option key={f.id} value={f.id}>{f.numero} — {f.clients?.nom||'?'}</option>)}
            </select>
          </Field>
        )}
        {type === 'sortie' && (
          <Field label="Lier à une dépense (optionnel)">
            <select style={inputStyle} value={form.depense_id} onChange={e => {
              setF('depense_id', e.target.value)
              const dep = depenses.find(d => d.id === e.target.value)
              if (dep) setF('libelle', dep.libelle)
            }}>
              <option value="">— Aucune —</option>
              {depenses.map(d => <option key={d.id} value={d.id}>{formatDateFR(d.date)} — {d.libelle}</option>)}
            </select>
          </Field>
        )}
        <Field label="Notes"><textarea style={{ ...inputStyle, minHeight:52, resize:'vertical' }} value={form.notes} onChange={e => setF('notes', e.target.value)} /></Field>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
          <BtnGhost onClick={() => { setModal(null); setError('') }}>Annuler</BtnGhost>
          <button onClick={saveOp} disabled={loading} style={{
            display:'inline-flex', alignItems:'center', gap:7,
            background: loading ? '#E4DDD6' : color, color:'#fff',
            border:'none', padding:'10px 16px', borderRadius:10,
            fontSize:13, fontWeight:600, cursor: loading?'not-allowed':'pointer', fontFamily:'inherit'
          }}>
            <Check size={16} />{loading ? '…' : (type === 'entree' ? 'Enregistrer entrée' : 'Enregistrer sortie')}
          </button>
        </div>
      </div>
    )
  }

  // ── Solde par couleur ───────────────────────────────────────────
  const soldeColor = (s: number) => s >= 0 ? '#3A9A5C' : '#D14343'
  const soldeBg   = (s: number) => s >= 0 ? '#E8F7EE' : '#FDE8E8'

  return (
    <div style={{ padding:24 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Caisse</h1>
          <p style={{ color:'#7A736C', fontSize:14, margin:'4px 0 0' }}>
            Journal de caisse — {entreprise?.nom||'Carnaval Imprim'}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={() => { setModal('ouverture'); setFormOuv({ date:today(), solde_debut:soldeFin, notes:'' }) }}
            style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #E4DDD6', padding:'9px 14px', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <Unlock size={14} /> Ouvrir caisse
          </button>
          <button onClick={imprimer}
            style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #E4DDD6', padding:'9px 14px', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <Printer size={14} /> Imprimer
          </button>
          <button onClick={() => { setForm({ ...emptyOp, type:'sortie', categorie:'Achat matières premières' }); setError(''); setModal('sortie') }}
            style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#D14343', color:'#fff', border:'none', padding:'9px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <ArrowDownCircle size={15} /> Sortie
          </button>
          <button onClick={() => { setForm({ ...emptyOp, type:'entree', categorie:'Règlement facture' }); setError(''); setModal('entree') }}
            style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#3A9A5C', color:'#fff', border:'none', padding:'9px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <ArrowUpCircle size={15} /> Entrée
          </button>
        </div>
      </div>

      {/* Filtre mois/année */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
        <select value={moisFiltre} onChange={e => setMoisFiltre(Number(e.target.value))}
          style={{ ...inputStyle, width:'auto', padding:'9px 14px' }}>
          {MOIS_LONG.map((m,i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={anneeFiltre} onChange={e => setAnneeFiltre(Number(e.target.value))}
          style={{ ...inputStyle, width:'auto', padding:'9px 14px' }}>
          {[annee-1,annee,annee+1].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={() => { setMoisFiltre(moisActuel); setAnneeFiltre(annee) }}
          style={{ display:'inline-flex', alignItems:'center', gap:5, background:'transparent', border:'1px solid #E4DDD6', padding:'9px 12px', borderRadius:10, fontSize:12, cursor:'pointer', color:'#7A736C' }}>
          <RefreshCw size={13} /> Aujourd&apos;hui
        </button>
      </div>

      {/* KPIs solde */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
        {[
          { label:'Solde début mois', val:soldDebutMois, icon:Wallet, color:'#2A5FA5', bg:'#E5EDF8' },
          { label:'Total entrées', val:totalEntrees, icon:ArrowUpCircle, color:'#3A9A5C', bg:'#E8F7EE' },
          { label:'Total sorties', val:totalSorties, icon:ArrowDownCircle, color:'#D14343', bg:'#FDE8E8' },
          { label:'Solde fin mois', val:soldeFin, icon:Wallet, color:soldeColor(soldeFin), bg:soldeBg(soldeFin) },
        ].map(k => (
          <div key={k.label} style={{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:14, padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <span style={{ fontSize:10, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.3px' }}>{k.label}</span>
              <div style={{ width:28, height:28, borderRadius:8, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <k.icon size={14} style={{ color:k.color }} />
              </div>
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:k.color }}>{formatFCFA(k.val)}</div>
          </div>
        ))}
        {/* Solde global caisse */}
        <div style={{ background:'linear-gradient(135deg,#1B1A1C,#2d2d2d)', border:'none', borderRadius:14, padding:'14px 16px', gridColumn:'span 1' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.3px', marginBottom:10 }}>Solde actuel caisse</div>
          <div style={{ fontSize:22, fontWeight:900, color: soldeCourant >= 0 ? '#80ff9a' : '#ff8080' }}>{formatFCFA(soldeCourant)}</div>
          <div style={{ fontSize:10, color:'#888', marginTop:4 }}>Toutes périodes confondues</div>
        </div>
      </div>

      {/* Mini graphique barres par jour */}
      {parJour.length > 0 && (
        <div style={{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:14, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Activité caisse — {MOIS_LONG[moisFiltre]} {anneeFiltre}</div>
          <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:60, overflowX:'auto' }}>
            {parJour.map(([date, vals]) => {
              const max = Math.max(...parJour.map(([,v]) => Math.max(v.entrees, v.sorties)), 1)
              const hE = Math.round((vals.entrees / max) * 50)
              const hS = Math.round((vals.sorties / max) * 50)
              return (
                <div key={date} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:28 }}>
                  <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:52 }}>
                    <div title={`Entrée: ${formatFCFA(vals.entrees)}`} style={{ width:10, height:Math.max(hE,1), background:'#3A9A5C', borderRadius:'2px 2px 0 0' }} />
                    <div title={`Sortie: ${formatFCFA(vals.sorties)}`} style={{ width:10, height:Math.max(hS,1), background:'#D14343', borderRadius:'2px 2px 0 0' }} />
                  </div>
                  <span style={{ fontSize:9, color:'#7A736C' }}>{new Date(date).getDate()}</span>
                </div>
              )
            })}
          </div>
          <div style={{ display:'flex', gap:14, marginTop:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11 }}><div style={{ width:10,height:10,background:'#3A9A5C',borderRadius:2 }} /> Entrées</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11 }}><div style={{ width:10,height:10,background:'#D14343',borderRadius:2 }} /> Sorties</div>
          </div>
        </div>
      )}

      {/* Ouvertures / fermetures du mois */}
      {ouverturesMois.length > 0 && (
        <div style={{ background:'#F6F4F1', borderRadius:12, padding:'12px 16px', marginBottom:14, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:12, fontWeight:700, color:'#7A736C' }}>Caisses du mois :</span>
          {ouverturesMois.map(o => (
            <div key={o.id} style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', borderRadius:8, padding:'6px 12px', border:'1px solid #E4DDD6' }}>
              <span style={{ fontSize:12, fontWeight:600 }}>{formatDateFR(o.date)}</span>
              <span style={{ fontSize:11, color:'#7A736C' }}>Ouv: {formatFCFA(o.solde_debut)}</span>
              {o.ferme && o.solde_fin !== undefined && <span style={{ fontSize:11, color:'#3A9A5C', fontWeight:700 }}>→ {formatFCFA(o.solde_fin)}</span>}
              {o.ferme
                ? <span style={{ fontSize:10, fontWeight:700, color:'#3A9A5C', background:'#E8F7EE', padding:'2px 8px', borderRadius:999 }}>✓ Fermée</span>
                : <button onClick={() => fermerCaisse(o.date)} style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#1B1A1C', color:'#fff', border:'none', padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:700, cursor:'pointer' }}>
                    <Lock size={11} /> Fermer
                  </button>
              }
            </div>
          ))}
        </div>
      )}

      {/* Journal opérations */}
      <TableWrap minWidth={860}>
        <thead><tr>
          {['Date','Heure','Catégorie','Libellé','Réf.','Entrée (+)','Sortie (−)','Solde',''].map(h => <th key={h} style={th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {/* Ligne solde début */}
          {opsMois.length > 0 && (
            <tr style={{ background:'#E5EDF8' }}>
              <td colSpan={5} style={{ ...td, fontWeight:700, color:'#2A5FA5' }}>
                Report solde début {MOIS_LONG[moisFiltre]}
              </td>
              <td style={td} />
              <td style={td} />
              <td style={{ ...td, fontWeight:800, color:'#2A5FA5', textAlign:'right' }}>{formatFCFA(soldDebutMois)}</td>
              <td style={td} />
            </tr>
          )}
          {(() => {
            let soldeRun = soldDebutMois
            const sorted = [...opsMois].sort((a,b) => (a.date+a.heure).localeCompare(b.date+b.heure))
            return sorted.map(op => {
              if (op.type === 'entree') soldeRun += op.montant
              else soldeRun -= op.montant
              const s = soldeRun
              return (
                <tr key={op.id}>
                  <td style={{ ...td, fontSize:12, whiteSpace:'nowrap' }}>{formatDateFR(op.date)}</td>
                  <td style={{ ...td, fontSize:11, color:'#7A736C' }}>{op.heure?.slice(0,5)||'—'}</td>
                  <td style={td}>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999, background: op.type==='entree'?'#E8F7EE':'#FDE8E8', color: op.type==='entree'?'#3A9A5C':'#D14343' }}>
                      {op.categorie}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{op.libelle}</div>
                    {op.factures && <div style={{ fontSize:11, color:'#7A736C' }}>Facture {op.factures.numero} — {op.factures.clients?.nom}</div>}
                    {op.notes && <div style={{ fontSize:11, color:'#7A736C' }}>{op.notes}</div>}
                  </td>
                  <td style={{ ...td, fontSize:11, color:'#7A736C' }}>{op.reference||'—'}</td>
                  <td style={{ ...td, color:'#3A9A5C', fontWeight:700, textAlign:'right' }}>
                    {op.type==='entree' ? formatFCFA(op.montant) : ''}
                  </td>
                  <td style={{ ...td, color:'#D14343', fontWeight:700, textAlign:'right' }}>
                    {op.type==='sortie' ? formatFCFA(op.montant) : ''}
                  </td>
                  <td style={{ ...td, fontWeight:800, color:soldeColor(s), textAlign:'right', fontSize:13 }}>
                    {formatFCFA(s)}
                  </td>
                  <td style={{ ...td, textAlign:'right' }}>
                    <BtnIcon onClick={() => delOp(op)} danger title="Supprimer"><Trash2 size={14} /></BtnIcon>
                  </td>
                </tr>
              )
            })
          })()}

          {/* Totaux */}
          {opsMois.length > 0 && (
            <tr style={{ background:'#1B1A1C', color:'#fff', fontWeight:800 }}>
              <td colSpan={5} style={{ ...td, color:'#fff' }}>TOTAL {MOIS_LONG[moisFiltre]} {anneeFiltre}</td>
              <td style={{ ...td, color:'#80ff9a', textAlign:'right' }}>{formatFCFA(totalEntrees)}</td>
              <td style={{ ...td, color:'#ff8080', textAlign:'right' }}>{formatFCFA(totalSorties)}</td>
              <td style={{ ...td, color:soldeFin>=0?'#80ff9a':'#ff8080', textAlign:'right' }}>{formatFCFA(soldeFin)}</td>
              <td style={td} />
            </tr>
          )}
          {opsMois.length === 0 && <EmptyRow text="Aucune opération ce mois. Cliquez Entrée ou Sortie pour commencer." cols={9} />}
        </tbody>
      </TableWrap>

      {/* Modals */}
      {modal === 'entree' && (
        <Modal title="💚 Entrée en caisse" onClose={() => { setModal(null); setError('') }} wide>
          {OpForm('entree')}
        </Modal>
      )}
      {modal === 'sortie' && (
        <Modal title="🔴 Sortie de caisse" onClose={() => { setModal(null); setError('') }} wide>
          {OpForm('sortie')}
        </Modal>
      )}
      {modal === 'ouverture' && (
        <Modal title="Ouvrir la caisse" onClose={() => { setModal(null); setError('') }}>
          <div>
            {error && <div style={{ background:'#fde8e8',color:'#D14343',padding:'10px 14px',borderRadius:10,marginBottom:14,fontSize:13 }}>{error}</div>}
            <Field label="Date d'ouverture"><input type="date" style={inputStyle} value={formOuv.date} onChange={e => setFormOuv(p => ({ ...p, date:e.target.value }))} /></Field>
            <Field label="Solde en caisse à l'ouverture (FCFA)">
              <input type="number" min="0" style={inputStyle} value={formOuv.solde_debut}
                onChange={e => setFormOuv(p => ({ ...p, solde_debut:Number(e.target.value) }))} />
            </Field>
            <Field label="Notes"><textarea style={{ ...inputStyle, minHeight:52, resize:'vertical' }} value={formOuv.notes} onChange={e => setFormOuv(p => ({ ...p, notes:e.target.value }))} /></Field>
            <div style={{ background:'#FEF3E2', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13 }}>
              💡 Le solde début correspond aux espèces physiquement présentes dans la caisse à l&apos;ouverture.
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <BtnGhost onClick={() => setModal(null)}>Annuler</BtnGhost>
              <BtnPrimary onClick={saveOuverture} disabled={loading}>
                <Unlock size={16} />{loading ? '…' : 'Ouvrir la caisse'}
              </BtnPrimary>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
