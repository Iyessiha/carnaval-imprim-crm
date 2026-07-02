'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/any'
import { formatFCFA, formatDateFR, calculerTotaux, today } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import { Check, Pencil, Trash2, Plus, Printer, TrendingUp, TrendingDown, Scale, Receipt, CreditCard, FileText } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────
type Depense = {
  id: string; date: string; categorie: string; libelle: string
  montant: number; tva_deductible: number; mode_paiement: string
  fournisseur_id?: string; reference?: string; notes?: string
  fournisseurs?: { nom: string } | null
}
type FL = { qte: number; pu: number }
type Pmt = { montant: number; date: string; mode: string; reference?: string }
type Facture = {
  id: string; numero: string; date: string; tva_applicable: boolean
  remise: number; fne_certifiee: boolean; client_id: string
  factures_lignes: FL[]; paiements: Pmt[]
  clients: { nom: string } | null
}
type PaiementRow = {
  id: string; facture_id: string; date: string; montant: number; mode: string; reference?: string
  factures?: { numero: string; clients?: { nom: string } | null } | null
}
type Fournisseur = { id: string; nom: string }
type Ent = Record<string,string|number> | null

// ── Constantes ───────────────────────────────────────────────────
const CATEGORIES_DEP = [
  'Matières premières','Sous-traitance','Loyer','Salaires','Transport',
  'Électricité / Eau','Téléphone / Internet','Fournitures bureau',
  'Maintenance matériel','Publicité','Taxes & impôts','Frais bancaires','Autre'
]
const MODES = ['cash','mobile-money','wave','cheque','virement','carte']
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const MOIS_COURT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

// ── Comptes OHADA simplifiés ─────────────────────────────────────
const COMPTES_OHADA: Record<string, string> = {
  '701': 'Ventes de produits finis',
  '706': 'Prestations de services',
  '44571': 'TVA collectée',
  '411': 'Clients',
  '512': 'Banque',
  '571': 'Caisse',
  '601': 'Achats matières premières',
  '604': 'Achats études & prestations',
  '621': 'Loyer',
  '661': 'Rémunérations du personnel',
  '681': 'Charges de transport',
  '622': 'Charges sociales',
  '625': 'Déplacements',
  '631': 'Frais bancaires',
  '445': 'TVA déductible',
  '401': 'Fournisseurs',
  '641': 'Impôts & taxes',
}

export default function ComptaClient({ depenses: initialDep, factures, paiements, fournisseurs, entreprise }: {
  depenses: Depense[]; factures: Facture[]; paiements: PaiementRow[]
  fournisseurs: Fournisseur[]; entreprise: Ent
}) {
  const router = useRouter()
  const tva = Number(entreprise?.taux_tva) || 18
  const annee = new Date().getFullYear()

  const [depenses, setDepenses] = useState(initialDep)
  const [tab, setTab] = useState<'dashboard'|'recettes'|'depenses'|'tva'|'journal'|'bilan'>('dashboard')
  const [moisFiltre, setMoisFiltre] = useState(new Date().getMonth())
  const [anneeFiltre, setAnneeFiltre] = useState(annee)
  const [modal, setModal] = useState<'depense'|'edit'|null>(null)
  const [selDep, setSelDep] = useState<Depense | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const emptyDep = {
    date: today(), categorie: 'Matières premières', libelle: '',
    montant: 0, tva_deductible: 0, mode_paiement: 'cash',
    fournisseur_id: '', reference: '', notes: '',
  }
  const [formDep, setFormDep] = useState(emptyDep)
  const setFD = (k: string, v: unknown) => setFormDep(p => ({ ...p, [k]: v }))

  // ── Calculs ─────────────────────────────────────────────────────
  const facParMois = useMemo(() =>
    factures.filter(f => {
      const d = new Date(f.date)
      return d.getFullYear() === anneeFiltre && d.getMonth() === moisFiltre
    }), [factures, anneeFiltre, moisFiltre])

  const depParMois = useMemo(() =>
    depenses.filter(d => {
      const dt = new Date(d.date)
      return dt.getFullYear() === anneeFiltre && dt.getMonth() === moisFiltre
    }), [depenses, anneeFiltre, moisFiltre])

  const caHTMois = useMemo(() =>
    facParMois.reduce((s, f) => {
      const t = calculerTotaux(f.factures_lignes, f.remise, tva, f.tva_applicable)
      return s + t.baseHT
    }, 0), [facParMois, tva])

  const tvaMois = useMemo(() =>
    facParMois.reduce((s, f) => {
      const t = calculerTotaux(f.factures_lignes, f.remise, tva, f.tva_applicable)
      return s + t.tva
    }, 0), [facParMois, tva])

  const caTTCMois = caHTMois + tvaMois

  const encMois = useMemo(() =>
    paiements.filter(p => {
      const d = new Date(p.date)
      return d.getFullYear() === anneeFiltre && d.getMonth() === moisFiltre
    }).reduce((s, p) => s + p.montant, 0), [paiements, anneeFiltre, moisFiltre])

  const totalDepMois = depParMois.reduce((s, d) => s + d.montant, 0)
  const tvaDedMois = depParMois.reduce((s, d) => s + d.tva_deductible, 0)
  const tvaAPayerMois = Math.max(0, tvaMois - tvaDedMois)
  const resultatMois = caHTMois - totalDepMois

  // Par mois sur l'année
  const dataAnnee = useMemo(() => {
    return Array(12).fill(0).map((_, m) => {
      const fMois = factures.filter(f => new Date(f.date).getFullYear() === anneeFiltre && new Date(f.date).getMonth() === m)
      const dMois = depenses.filter(d => new Date(d.date).getFullYear() === anneeFiltre && new Date(d.date).getMonth() === m)
      const caHT = fMois.reduce((s, f) => s + calculerTotaux(f.factures_lignes, f.remise, tva, f.tva_applicable).baseHT, 0)
      const dep = dMois.reduce((s, d) => s + d.montant, 0)
      return { mois: MOIS_COURT[m], caHT, dep, resultat: caHT - dep }
    })
  }, [factures, depenses, anneeFiltre, tva])

  const totAnnee = dataAnnee.reduce((s, m) => ({
    caHT: s.caHT + m.caHT, dep: s.dep + m.dep, res: s.res + m.resultat
  }), { caHT: 0, dep: 0, res: 0 })

  // Dépenses par catégorie
  const depParCat = useMemo(() => {
    const map: Record<string, number> = {}
    depParMois.forEach(d => { map[d.categorie] = (map[d.categorie] || 0) + d.montant })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [depParMois])

  // ── Sauvegarder dépense ──────────────────────────────────────────
  const saveDep = async () => {
    if (!formDep.libelle.trim()) { setError('Le libellé est obligatoire.'); return }
    if (!formDep.montant || formDep.montant <= 0) { setError('Montant invalide.'); return }
    setLoading(true); setError('')
    const sb = getSupabase()
    const body = {
      date: formDep.date, categorie: formDep.categorie, libelle: formDep.libelle,
      montant: formDep.montant, tva_deductible: formDep.tva_deductible || 0,
      mode_paiement: formDep.mode_paiement,
      fournisseur_id: formDep.fournisseur_id || null,
      reference: formDep.reference || null, notes: formDep.notes || null,
    }
    if (selDep?.id) {
      const { error: e } = await sb.from('depenses').update(body).eq('id', selDep.id)
      if (e) { setError(e.message); setLoading(false); return }
      const fNom = fournisseurs.find(f => f.id === formDep.fournisseur_id)?.nom
      setDepenses(prev => prev.map(d => d.id === selDep.id ? { ...d, ...body, fournisseurs: fNom ? { nom: fNom } : null } : d))
    } else {
      const { data, error: e } = await sb.from('depenses').insert(body).select().single()
      if (e) { setError(e.message); setLoading(false); return }
      const fNom = fournisseurs.find(f => f.id === formDep.fournisseur_id)?.nom
      setDepenses(prev => [{ ...data, fournisseurs: fNom ? { nom: fNom } : null }, ...prev])
    }
    setLoading(false); setModal(null); setSelDep(null); router.refresh()
  }

  const delDep = async (d: Depense) => {
    if (!confirm(`Supprimer "${d.libelle}" ?`)) return
    const sb = getSupabase()
    await sb.from('depenses').delete().eq('id', d.id)
    setDepenses(prev => prev.filter(x => x.id !== d.id)); router.refresh()
  }

  // ── Impression rapports ──────────────────────────────────────────
  const imprimerBilan = () => {
    const ent = entreprise
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Bilan mensuel ${MOIS[moisFiltre]} ${anneeFiltre}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1B1A1C; padding: 32px; }
  .logo { font-size: 20px; font-weight: 900; } .logo span { color: #C2117A; }
  h2 { color: #C2117A; margin: 24px 0 12px; font-size: 16px; border-bottom: 2px solid #C2117A; padding-bottom: 6px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin: 16px 0; }
  .kpi { background: #F6F4F1; border-radius: 8px; padding: 14px; }
  .kpi-val { font-size: 20px; font-weight: 900; color: #C2117A; }
  .kpi-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: .5px; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
  th { background: #1B1A1C; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  .pos { color: #3A9A5C; font-weight: 700; }
  .neg { color: #D14343; font-weight: 700; }
  .footer { margin-top: 32px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
  @media print { body { padding: 16px; } }
</style></head><body>
<div style="display:flex;justify-content:space-between;margin-bottom:24px">
  <div><div class="logo">CARNAVAL<span>IMPRIM</span></div>
  <div style="font-size:11px;color:#888;margin-top:4px">NCC : ${ent?.ncc||'240220333S'} — RC : ${ent?.rc||''}</div></div>
  <div style="text-align:right;font-size:11px;color:#888">Régime : ${ent?.regime||'Réel simplifié'}<br>Centre : ${ent?.centre_impots||'Cocody'}</div>
</div>

<h1 style="font-size:22px;font-weight:900;color:#1B1A1C">Bilan mensuel — ${MOIS[moisFiltre]} ${anneeFiltre}</h1>

<div class="kpi-grid">
  <div class="kpi"><div class="kpi-val">${formatFCFA(caHTMois)}</div><div class="kpi-label">CA HT facturé</div></div>
  <div class="kpi"><div class="kpi-val">${formatFCFA(totalDepMois)}</div><div class="kpi-label">Total dépenses</div></div>
  <div class="kpi"><div class="kpi-val" style="color:${resultatMois >= 0 ? '#3A9A5C' : '#D14343'}">${formatFCFA(resultatMois)}</div><div class="kpi-label">Résultat net</div></div>
  <div class="kpi"><div class="kpi-val">${formatFCFA(encMois)}</div><div class="kpi-label">Trésorerie encaissée</div></div>
  <div class="kpi"><div class="kpi-val">${formatFCFA(tvaMois)}</div><div class="kpi-label">TVA collectée</div></div>
  <div class="kpi"><div class="kpi-val">${formatFCFA(tvaAPayerMois)}</div><div class="kpi-label">TVA nette à payer</div></div>
</div>

<h2>RECETTES — Factures émises</h2>
<table>
  <thead><tr><th>Facture</th><th>Client</th><th>Date</th><th>HT</th><th>TVA</th><th>TTC</th><th>Encaissé</th></tr></thead>
  <tbody>
  ${facParMois.map(f => {
    const t = calculerTotaux(f.factures_lignes, f.remise, tva, f.tva_applicable)
    const enc = f.paiements.reduce((s,p) => s+p.montant, 0)
    return `<tr><td>${f.numero}</td><td>${f.clients?.nom||'—'}</td><td>${formatDateFR(f.date)}</td>
    <td>${formatFCFA(t.baseHT)}</td><td>${formatFCFA(t.tva)}</td><td style="font-weight:700">${formatFCFA(t.ttc)}</td>
    <td class="${enc >= t.ttc ? 'pos' : 'neg'}">${formatFCFA(enc)}</td></tr>`
  }).join('')}
  <tr style="background:#F6F4F1;font-weight:700"><td colspan="3">TOTAL</td>
    <td>${formatFCFA(caHTMois)}</td><td>${formatFCFA(tvaMois)}</td><td>${formatFCFA(caTTCMois)}</td><td>${formatFCFA(encMois)}</td></tr>
  </tbody>
</table>

<h2>DÉPENSES</h2>
<table>
  <thead><tr><th>Date</th><th>Catégorie</th><th>Libellé</th><th>Fournisseur</th><th>Mode</th><th>HT</th><th>TVA déd.</th></tr></thead>
  <tbody>
  ${depParMois.map(d => `<tr><td>${formatDateFR(d.date)}</td><td>${d.categorie}</td><td>${d.libelle}</td>
    <td>${d.fournisseurs?.nom||'—'}</td><td>${d.mode_paiement}</td><td>${formatFCFA(d.montant)}</td>
    <td>${d.tva_deductible > 0 ? formatFCFA(d.tva_deductible) : '—'}</td></tr>`).join('')}
  <tr style="background:#F6F4F1;font-weight:700"><td colspan="5">TOTAL</td>
    <td>${formatFCFA(totalDepMois)}</td><td>${formatFCFA(tvaDedMois)}</td></tr>
  </tbody>
</table>

<h2>DÉCLARATION TVA</h2>
<table>
  <tr><td>TVA collectée (CA HT × ${tva}%)</td><td style="text-align:right;font-weight:700">${formatFCFA(tvaMois)}</td></tr>
  <tr><td>TVA déductible (sur achats)</td><td style="text-align:right;color:#3A9A5C">- ${formatFCFA(tvaDedMois)}</td></tr>
  <tr style="background:#FDE8E8"><td><strong>TVA nette à reverser à la DGI</strong></td><td style="text-align:right;font-weight:900;font-size:16px;color:#D14343">${formatFCFA(tvaAPayerMois)}</td></tr>
</table>

<div class="footer">
  ${ent?.nom||'CARNAVAL IMPRIM'} — ${ent?.siege||''} — NCC : ${ent?.ncc||'240220333S'}<br>
  Document généré le ${new Date().toLocaleDateString('fr-FR')} — Régime ${ent?.regime||'Réel simplifié'} — Centre ${ent?.centre_impots||'Cocody'}
</div>
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400) }
  }

  // ── UI Helpers ───────────────────────────────────────────────────
  const TABS = [
    { key: 'dashboard', label: 'Vue d\'ensemble', icon: Scale },
    { key: 'recettes',  label: 'Recettes',        icon: TrendingUp },
    { key: 'depenses',  label: 'Dépenses',         icon: TrendingDown },
    { key: 'tva',       label: 'TVA',              icon: Receipt },
    { key: 'journal',   label: 'Journal',          icon: FileText },
    { key: 'bilan',     label: 'Bilan annuel',     icon: CreditCard },
  ] as const

  const KPI = ({ label, value, sub, color = '#C2117A', bg = '#FDE8E8', icon: Icon }: {
    label: string; value: string; sub?: string; color?: string; bg?: string; icon?: React.ElementType
  }) => (
    <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: '16px 18px', flex: 1, minWidth: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase', letterSpacing: '.3px' }}>{label}</span>
        {Icon && <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} style={{ color }} /></div>}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#7A736C', marginTop: 4 }}>{sub}</div>}
    </div>
  )

  const DepenseForm = (
    <div>
      {error && <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Date"><input type="date" style={inputStyle} value={formDep.date} onChange={e => setFD('date', e.target.value)} /></Field>
        <Field label="Catégorie *">
          <select style={inputStyle} value={formDep.categorie} onChange={e => setFD('categorie', e.target.value)}>
            {CATEGORIES_DEP.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Libellé *">
        <input style={inputStyle} value={formDep.libelle} onChange={e => setFD('libelle', e.target.value)} placeholder="Ex: Achat papier offset 250g, 500 feuilles" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Montant HT (FCFA) *">
          <input type="number" min="0" style={inputStyle} value={formDep.montant} onChange={e => {
            const ht = Number(e.target.value)
            setFD('montant', ht)
            setFD('tva_deductible', Math.round(ht * tva / 100))
          }} />
        </Field>
        <Field label={`TVA déductible (${tva}%)`}>
          <input type="number" min="0" style={inputStyle} value={formDep.tva_deductible} onChange={e => setFD('tva_deductible', Number(e.target.value))} />
        </Field>
        <Field label="Mode paiement">
          <select style={inputStyle} value={formDep.mode_paiement} onChange={e => setFD('mode_paiement', e.target.value)}>
            {MODES.map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Fournisseur">
          <select style={inputStyle} value={formDep.fournisseur_id} onChange={e => setFD('fournisseur_id', e.target.value)}>
            <option value="">— Aucun —</option>
            {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        </Field>
        <Field label="N° pièce / référence">
          <input style={inputStyle} value={formDep.reference} onChange={e => setFD('reference', e.target.value)} placeholder="Ex: BL-2026-042" />
        </Field>
      </div>
      <Field label="Notes">
        <textarea style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} value={formDep.notes} onChange={e => setFD('notes', e.target.value)} />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <BtnGhost onClick={() => { setModal(null); setSelDep(null); setError('') }}>Annuler</BtnGhost>
        <BtnPrimary onClick={saveDep} disabled={loading}><Check size={16} />{loading ? '…' : 'Enregistrer'}</BtnPrimary>
      </div>
    </div>
  )

  const Filtres = (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <select value={moisFiltre} onChange={e => setMoisFiltre(Number(e.target.value))}
        style={{ ...inputStyle, width: 'auto', padding: '9px 14px' }}>
        {MOIS.map((m, i) => <option key={i} value={i}>{m}</option>)}
      </select>
      <select value={anneeFiltre} onChange={e => setAnneeFiltre(Number(e.target.value))}
        style={{ ...inputStyle, width: 'auto', padding: '9px 14px' }}>
        {[annee-1, annee, annee+1].map(a => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Comptabilité</h1>
          <p style={{ color: '#7A736C', fontSize: 14, margin: '4px 0 0' }}>
            {entreprise?.nom as string || 'Carnaval Imprim'} · NCC {entreprise?.ncc as string || '240220333S'} · Régime {entreprise?.regime as string || 'Réel simplifié'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={imprimerBilan} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #E4DDD6', padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Printer size={15} /> Bilan {MOIS[moisFiltre]}
          </button>
          <button onClick={() => { setSelDep(null); setFormDep(emptyDep); setError(''); setModal('depense') }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#C2117A', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={15} /> Saisir une dépense
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#F6F4F1', borderRadius: 12, padding: 4, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
            border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            background: tab === t.key ? '#fff' : 'transparent',
            color: tab === t.key ? '#C2117A' : '#7A736C',
            boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            whiteSpace: 'nowrap',
          }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ───────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div>
          {Filtres}
          {/* KPIs */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <KPI label="CA HT facturé" value={formatFCFA(caHTMois)} sub={`+ ${formatFCFA(tvaMois)} TVA`} color="#2A5FA5" bg="#E5EDF8" icon={TrendingUp} />
            <KPI label="Trésorerie encaissée" value={formatFCFA(encMois)} sub={`sur ${formatFCFA(caTTCMois)} TTC`} color="#3A9A5C" bg="#E8F7EE" icon={CreditCard} />
            <KPI label="Total dépenses" value={formatFCFA(totalDepMois)} sub={`${depParMois.length} opérations`} color="#D14343" bg="#FDE8E8" icon={TrendingDown} />
            <KPI label={resultatMois >= 0 ? 'Bénéfice' : 'Déficit'}
              value={formatFCFA(Math.abs(resultatMois))}
              sub={resultatMois >= 0 ? '✅ Positif' : '⚠️ Négatif'}
              color={resultatMois >= 0 ? '#3A9A5C' : '#D14343'}
              bg={resultatMois >= 0 ? '#E8F7EE' : '#FDE8E8'}
              icon={Scale} />
            <KPI label="TVA à reverser DGI" value={formatFCFA(tvaAPayerMois)} sub={`Collectée: ${formatFCFA(tvaMois)}`} color="#F39200" bg="#FEF3E2" icon={Receipt} />
          </div>

          {/* Graphique barres */}
          <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Évolution mensuelle {anneeFiltre}</h2>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, minWidth: 600 }}>
                {dataAnnee.map((m, i) => {
                  const maxVal = Math.max(...dataAnnee.map(x => Math.max(x.caHT, x.dep)), 1)
                  const hCA = Math.round((m.caHT / maxVal) * 120)
                  const hDep = Math.round((m.dep / maxVal) * 120)
                  const actif = i === moisFiltre && anneeFiltre === annee
                  return (
                    <div key={i} onClick={() => setMoisFiltre(i)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: actif ? 1 : .7 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, width: '100%', justifyContent: 'center' }}>
                        <div title={`CA HT: ${formatFCFA(m.caHT)}`} style={{ width: '40%', height: Math.max(hCA, m.caHT > 0 ? 3 : 0), background: '#2A5FA5', borderRadius: '3px 3px 0 0' }} />
                        <div title={`Dépenses: ${formatFCFA(m.dep)}`} style={{ width: '40%', height: Math.max(hDep, m.dep > 0 ? 3 : 0), background: '#D14343', borderRadius: '3px 3px 0 0' }} />
                      </div>
                      <div style={{ fontSize: 9, color: actif ? '#C2117A' : '#7A736C', fontWeight: actif ? 800 : 400, marginTop: 4 }}>{m.mois}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><div style={{ width: 12, height: 12, background: '#2A5FA5', borderRadius: 3 }} /> CA HT</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><div style={{ width: 12, height: 12, background: '#D14343', borderRadius: 3 }} /> Dépenses</div>
            </div>
          </div>

          {/* Dépenses par catégorie */}
          {depParCat.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>Dépenses par catégorie — {MOIS[moisFiltre]}</h2>
              {depParCat.map(([cat, montant]) => {
                const pct = totalDepMois > 0 ? Math.round(montant / totalDepMois * 100) : 0
                return (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{cat}</span>
                      <span style={{ color: '#D14343', fontWeight: 700 }}>{formatFCFA(montant)} <span style={{ color: '#7A736C', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ background: '#F0EEEC', borderRadius: 999, height: 6 }}>
                      <div style={{ background: '#D14343', borderRadius: 999, height: 6, width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RECETTES ─────────────────────────────────────────────── */}
      {tab === 'recettes' && (
        <div>
          {Filtres}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <KPI label="CA HT" value={formatFCFA(caHTMois)} color="#2A5FA5" bg="#E5EDF8" icon={TrendingUp} />
            <KPI label="TVA collectée" value={formatFCFA(tvaMois)} color="#F39200" bg="#FEF3E2" icon={Receipt} />
            <KPI label="CA TTC" value={formatFCFA(caTTCMois)} color="#C2117A" bg="#FDE8E8" icon={TrendingUp} />
            <KPI label="Encaissé" value={formatFCFA(encMois)} color="#3A9A5C" bg="#E8F7EE" icon={CreditCard} />
          </div>
          <TableWrap minWidth={820}>
            <thead><tr>{['Facture','Client','Date','Base HT','TVA','TTC','Encaissé','Reste','FNE'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {facParMois.map(f => {
                const t = calculerTotaux(f.factures_lignes, f.remise, tva, f.tva_applicable)
                const enc = f.paiements.reduce((s, p) => s + p.montant, 0)
                const reste = Math.max(0, t.ttc - enc)
                return (
                  <tr key={f.id}>
                    <td style={{ ...td, fontWeight: 700, color: '#C2117A' }}>{f.numero}</td>
                    <td style={td}>{f.clients?.nom || '—'}</td>
                    <td style={{ ...td, fontSize: 12 }}>{formatDateFR(f.date)}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{formatFCFA(t.baseHT)}</td>
                    <td style={{ ...td, color: '#F39200' }}>{formatFCFA(t.tva)}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{formatFCFA(t.ttc)}</td>
                    <td style={{ ...td, color: '#3A9A5C', fontWeight: 600 }}>{formatFCFA(enc)}</td>
                    <td style={{ ...td, color: reste > 0 ? '#D14343' : '#3A9A5C', fontWeight: 600 }}>{formatFCFA(reste)}</td>
                    <td style={td}>{f.fne_certifiee ? <span style={{ fontSize: 11, color: '#3A9A5C', fontWeight: 700 }}>✓ FNE</span> : <span style={{ fontSize: 11, color: '#7A736C' }}>—</span>}</td>
                  </tr>
                )
              })}
              {facParMois.length === 0 && <EmptyRow text="Aucune facture ce mois." cols={9} />}
              {facParMois.length > 0 && (
                <tr style={{ background: '#F6F4F1', fontWeight: 800 }}>
                  <td style={td} colSpan={3}>TOTAL {MOIS[moisFiltre]}</td>
                  <td style={td}>{formatFCFA(caHTMois)}</td>
                  <td style={{ ...td, color: '#F39200' }}>{formatFCFA(tvaMois)}</td>
                  <td style={td}>{formatFCFA(caTTCMois)}</td>
                  <td style={{ ...td, color: '#3A9A5C' }}>{formatFCFA(encMois)}</td>
                  <td style={{ ...td, color: '#D14343' }}>{formatFCFA(Math.max(0, caTTCMois - encMois))}</td>
                  <td style={td}>{facParMois.filter(f => f.fne_certifiee).length} certif.</td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </div>
      )}

      {/* ── DÉPENSES ─────────────────────────────────────────────── */}
      {tab === 'depenses' && (
        <div>
          {Filtres}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <KPI label="Total dépenses" value={formatFCFA(totalDepMois)} color="#D14343" bg="#FDE8E8" icon={TrendingDown} />
            <KPI label="TVA déductible" value={formatFCFA(tvaDedMois)} color="#3A9A5C" bg="#E8F7EE" icon={Receipt} />
            <KPI label="Nombre d'opérations" value={String(depParMois.length)} color="#7B2FA5" bg="#F0E8F8" icon={FileText} />
          </div>
          <TableWrap minWidth={880}>
            <thead><tr>{['Date','Catégorie','Libellé','Fournisseur','Mode','Montant HT','TVA déduc.','Réf.',''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {depParMois.map(d => (
                <tr key={d.id}>
                  <td style={{ ...td, whiteSpace: 'nowrap', fontSize: 12 }}>{formatDateFR(d.date)}</td>
                  <td style={td}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#FDE8E8', color: '#D14343' }}>{d.categorie}</span>
                  </td>
                  <td style={{ ...td, fontWeight: 600 }}>{d.libelle}</td>
                  <td style={{ ...td, fontSize: 12, color: '#7A736C' }}>{d.fournisseurs?.nom || '—'}</td>
                  <td style={{ ...td, fontSize: 12 }}>{d.mode_paiement}</td>
                  <td style={{ ...td, fontWeight: 700, color: '#D14343' }}>{formatFCFA(d.montant)}</td>
                  <td style={{ ...td, color: '#3A9A5C' }}>{d.tva_deductible > 0 ? formatFCFA(d.tva_deductible) : '—'}</td>
                  <td style={{ ...td, fontSize: 11, color: '#7A736C' }}>{d.reference || '—'}</td>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <BtnIcon onClick={() => { setSelDep(d); setFormDep({ date:d.date, categorie:d.categorie, libelle:d.libelle, montant:d.montant, tva_deductible:d.tva_deductible, mode_paiement:d.mode_paiement, fournisseur_id:d.fournisseur_id||'', reference:d.reference||'', notes:d.notes||'' }); setError(''); setModal('edit') }}><Pencil size={15} /></BtnIcon>
                    <BtnIcon onClick={() => delDep(d)} danger><Trash2 size={15} /></BtnIcon>
                  </td>
                </tr>
              ))}
              {depParMois.length === 0 && <EmptyRow text="Aucune dépense ce mois." cols={9} />}
              {depParMois.length > 0 && (
                <tr style={{ background: '#F6F4F1', fontWeight: 800 }}>
                  <td colSpan={5} style={td}>TOTAL {MOIS[moisFiltre]}</td>
                  <td style={{ ...td, color: '#D14343' }}>{formatFCFA(totalDepMois)}</td>
                  <td style={{ ...td, color: '#3A9A5C' }}>{formatFCFA(tvaDedMois)}</td>
                  <td colSpan={2} style={td} />
                </tr>
              )}
            </tbody>
          </TableWrap>
        </div>
      )}

      {/* ── TVA ─────────────────────────────────────────────────── */}
      {tab === 'tva' && (
        <div>
          {Filtres}
          <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 24, maxWidth: 560 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Déclaration TVA — {MOIS[moisFiltre]} {anneeFiltre}</h2>
            {[
              { label: 'CA HT facturé', value: caHTMois, color: '#2A5FA5' },
              { label: `TVA collectée (${tva}%)`, value: tvaMois, color: '#F39200' },
              { label: 'TVA déductible (sur achats)', value: -tvaDedMois, color: '#3A9A5C' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F0EEEC', fontSize: 14 }}>
                <span style={{ color: '#7A736C' }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: r.color }}>{r.value < 0 ? `- ${formatFCFA(-r.value)}` : formatFCFA(r.value)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', fontSize: 18, fontWeight: 900 }}>
              <span>TVA nette à reverser DGI</span>
              <span style={{ color: tvaAPayerMois > 0 ? '#D14343' : '#3A9A5C' }}>{formatFCFA(tvaAPayerMois)}</span>
            </div>
            {tvaAPayerMois > 0 && (
              <div style={{ background: '#FDE8E8', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginTop: 8 }}>
                ⚠️ À reverser à la <strong>DGI Côte d&apos;Ivoire</strong> avant le 15 du mois suivant.<br />
                Centre des impôts : <strong>{entreprise?.centre_impots as string || 'Cocody'}</strong>
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <button onClick={imprimerBilan} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#1B1A1C', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Printer size={15} /> Imprimer déclaration TVA
              </button>
            </div>
          </div>

          {/* Détail TVA par facture */}
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Détail TVA collectée</h3>
            <TableWrap minWidth={600}>
              <thead><tr>{['Facture','Client','Base HT','Taux TVA','TVA collectée'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {facParMois.map(f => {
                  const t = calculerTotaux(f.factures_lignes, f.remise, tva, f.tva_applicable)
                  return (
                    <tr key={f.id}>
                      <td style={{ ...td, fontWeight: 700, color: '#C2117A' }}>{f.numero}</td>
                      <td style={td}>{f.clients?.nom || '—'}</td>
                      <td style={td}>{formatFCFA(t.baseHT)}</td>
                      <td style={td}>{f.tva_applicable ? `${tva}%` : 'Exonéré'}</td>
                      <td style={{ ...td, fontWeight: 700, color: '#F39200' }}>{formatFCFA(t.tva)}</td>
                    </tr>
                  )
                })}
                {facParMois.length === 0 && <EmptyRow text="Aucune facture ce mois." cols={5} />}
              </tbody>
            </TableWrap>
          </div>
        </div>
      )}

      {/* ── JOURNAL ─────────────────────────────────────────────── */}
      {tab === 'journal' && (
        <div>
          {Filtres}
          <TableWrap minWidth={800}>
            <thead><tr>{['Date','Pièce','Libellé','Compte','Débit','Crédit'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {/* Recettes du mois */}
              {facParMois.map(f => {
                const t = calculerTotaux(f.factures_lignes, f.remise, tva, f.tva_applicable)
                return [
                  <tr key={`${f.id}-411`}>
                    <td style={{ ...td, fontSize: 12 }}>{formatDateFR(f.date)}</td>
                    <td style={{ ...td, fontWeight: 700, color: '#C2117A', fontSize: 12 }}>{f.numero}</td>
                    <td style={td}>{f.clients?.nom} — Facture vente</td>
                    <td style={{ ...td, fontSize: 12 }}><span style={{ fontWeight: 700 }}>411</span> — {COMPTES_OHADA['411']}</td>
                    <td style={{ ...td, color: '#3A9A5C', fontWeight: 600 }}>{formatFCFA(t.ttc)}</td>
                    <td style={td}>—</td>
                  </tr>,
                  <tr key={`${f.id}-701`}>
                    <td style={{ ...td, fontSize: 12 }}>{formatDateFR(f.date)}</td>
                    <td style={{ ...td, fontSize: 12 }}></td>
                    <td style={{ ...td, color: '#7A736C', paddingLeft: 24 }}>Ventes (contrepartie)</td>
                    <td style={{ ...td, fontSize: 12 }}><span style={{ fontWeight: 700 }}>706</span> — {COMPTES_OHADA['706']}</td>
                    <td style={td}>—</td>
                    <td style={{ ...td, color: '#D14343', fontWeight: 600 }}>{formatFCFA(t.baseHT)}</td>
                  </tr>,
                  f.tva_applicable && t.tva > 0 ? (
                    <tr key={`${f.id}-tva`}>
                      <td style={{ ...td, fontSize: 12 }}>{formatDateFR(f.date)}</td>
                      <td style={{ ...td, fontSize: 12 }}></td>
                      <td style={{ ...td, color: '#7A736C', paddingLeft: 24 }}>TVA collectée</td>
                      <td style={{ ...td, fontSize: 12 }}><span style={{ fontWeight: 700 }}>44571</span> — TVA collectée</td>
                      <td style={td}>—</td>
                      <td style={{ ...td, color: '#D14343', fontWeight: 600 }}>{formatFCFA(t.tva)}</td>
                    </tr>
                  ) : null,
                ]
              })}
              {/* Dépenses du mois */}
              {depParMois.map(d => (
                <tr key={`dep-${d.id}`}>
                  <td style={{ ...td, fontSize: 12 }}>{formatDateFR(d.date)}</td>
                  <td style={{ ...td, fontSize: 12 }}>{d.reference || '—'}</td>
                  <td style={td}>{d.libelle}</td>
                  <td style={{ ...td, fontSize: 12 }}><span style={{ fontWeight: 700 }}>601</span> — {d.categorie}</td>
                  <td style={{ ...td, color: '#D14343', fontWeight: 600 }}>{formatFCFA(d.montant)}</td>
                  <td style={td}>—</td>
                </tr>
              ))}
              {facParMois.length === 0 && depParMois.length === 0 && <EmptyRow text="Aucune écriture ce mois." cols={6} />}
            </tbody>
          </TableWrap>
        </div>
      )}

      {/* ── BILAN ANNUEL ─────────────────────────────────────────── */}
      {tab === 'bilan' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <select value={anneeFiltre} onChange={e => setAnneeFiltre(Number(e.target.value))}
              style={{ ...inputStyle, width: 'auto', padding: '9px 14px' }}>
              {[annee-1, annee, annee+1].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <div style={{ fontSize: 14, color: '#7A736C', marginLeft: 8 }}>
              CA HT : <strong style={{ color: '#2A5FA5' }}>{formatFCFA(totAnnee.caHT)}</strong> &nbsp;|&nbsp;
              Dépenses : <strong style={{ color: '#D14343' }}>{formatFCFA(totAnnee.dep)}</strong> &nbsp;|&nbsp;
              Résultat : <strong style={{ color: totAnnee.res >= 0 ? '#3A9A5C' : '#D14343' }}>{formatFCFA(totAnnee.res)}</strong>
            </div>
          </div>
          <TableWrap minWidth={760}>
            <thead><tr>
              <th style={th}>Mois</th>
              <th style={{ ...th, textAlign: 'right' }}>CA HT</th>
              <th style={{ ...th, textAlign: 'right' }}>TVA coll.</th>
              <th style={{ ...th, textAlign: 'right' }}>CA TTC</th>
              <th style={{ ...th, textAlign: 'right' }}>Dépenses</th>
              <th style={{ ...th, textAlign: 'right' }}>Résultat</th>
              <th style={{ ...th, textAlign: 'right' }}>Marge %</th>
            </tr></thead>
            <tbody>
              {dataAnnee.map((m, i) => {
                const tvaM = factures.filter(f => new Date(f.date).getFullYear() === anneeFiltre && new Date(f.date).getMonth() === i)
                  .reduce((s, f) => s + calculerTotaux(f.factures_lignes, f.remise, tva, f.tva_applicable).tva, 0)
                const marge = m.caHT > 0 ? Math.round(m.resultat / m.caHT * 100) : 0
                return (
                  <tr key={i} onClick={() => { setMoisFiltre(i); setTab('dashboard') }}
                    style={{ cursor: 'pointer', background: i === moisFiltre ? '#FEF3E2' : undefined }}>
                    <td style={{ ...td, fontWeight: 600 }}>{MOIS[i]}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: '#2A5FA5' }}>{m.caHT > 0 ? formatFCFA(m.caHT) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#F39200' }}>{tvaM > 0 ? formatFCFA(tvaM) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{m.caHT > 0 ? formatFCFA(m.caHT + tvaM) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#D14343' }}>{m.dep > 0 ? formatFCFA(m.dep) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: m.resultat >= 0 ? '#3A9A5C' : '#D14343' }}>
                      {m.caHT > 0 || m.dep > 0 ? formatFCFA(m.resultat) : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: marge >= 0 ? '#3A9A5C' : '#D14343', fontSize: 12 }}>
                      {m.caHT > 0 ? `${marge}%` : '—'}
                    </td>
                  </tr>
                )
              })}
              <tr style={{ background: '#1B1A1C', color: '#fff', fontWeight: 800 }}>
                <td style={{ ...td, color: '#fff' }}>TOTAL {anneeFiltre}</td>
                <td style={{ ...td, textAlign: 'right', color: '#6bb5f5' }}>{formatFCFA(totAnnee.caHT)}</td>
                <td style={{ ...td, textAlign: 'right', color: '#ffc16b' }}>
                  {formatFCFA(factures.filter(f => new Date(f.date).getFullYear() === anneeFiltre).reduce((s, f) => s + calculerTotaux(f.factures_lignes, f.remise, tva, f.tva_applicable).tva, 0))}
                </td>
                <td style={{ ...td, textAlign: 'right', color: '#fff' }}>{formatFCFA(totAnnee.caHT)}</td>
                <td style={{ ...td, textAlign: 'right', color: '#ff8080' }}>{formatFCFA(totAnnee.dep)}</td>
                <td style={{ ...td, textAlign: 'right', color: totAnnee.res >= 0 ? '#80ff9a' : '#ff8080' }}>{formatFCFA(totAnnee.res)}</td>
                <td style={{ ...td, textAlign: 'right', color: '#fff' }}>{totAnnee.caHT > 0 ? `${Math.round(totAnnee.res / totAnnee.caHT * 100)}%` : '—'}</td>
              </tr>
            </tbody>
          </TableWrap>
        </div>
      )}

      {/* ── MODALS ─────────────────────────────────────────────── */}
      {(modal === 'depense' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? `Modifier — ${selDep?.libelle}` : 'Saisir une dépense'} onClose={() => { setModal(null); setSelDep(null); setError('') }} wide>
          {DepenseForm}
        </Modal>
      )}
    </div>
  )
}
