'use client'
import { useState, useMemo } from 'react'
import { formatFCFA, formatDateFR } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { inputStyle } from '@/components/ui/index'
import { Printer, TrendingUp, TrendingDown } from 'lucide-react'

type Operation = {
  id: string; date: string; heure?: string; type: 'entree'|'sortie'
  categorie: string; libelle: string; montant: number; reference?: string
  factures?: { numero: string; clients?: { nom: string }|null }|null
}
type Ent = Record<string,string>|null

export default function BonsCaisseClient({ operations, entreprise }: {
  operations: Operation[]; entreprise: Ent
}) {
  const [q, setQ] = useState('')
  const [typeFiltre, setTypeFiltre] = useState('Tous')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [selIds, setSelIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => operations
    .filter(op => typeFiltre === 'Tous' || op.type === typeFiltre)
    .filter(op => !dateDebut || op.date >= dateDebut)
    .filter(op => !dateFin || op.date <= dateFin)
    .filter(op => (op.libelle + op.categorie + (op.factures?.numero||'')).toLowerCase().includes(q.toLowerCase())),
    [operations, typeFiltre, dateDebut, dateFin, q])

  const toggleSel = (id: string) => setSelIds(prev => {
    const s = new Set(prev)
    if (s.has(id)) s.delete(id); else s.add(id)
    return s
  })
  const toggleAll = () => {
    if (selIds.size === filtered.length) setSelIds(new Set())
    else setSelIds(new Set(filtered.map(op => op.id)))
  }

  const imprimerBon = (ops: Operation[], titre = 'BON DE CAISSE') => {
    const ent = entreprise
    const totalEntrees = ops.filter(op => op.type==='entree').reduce((s,op) => s+op.montant, 0)
    const totalSorties = ops.filter(op => op.type==='sortie').reduce((s,op) => s+op.montant, 0)
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>${titre}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:12px;color:#1B1A1C;padding:28px}
  .logo-text{font-size:20px;font-weight:900}.logo-text span{color:#C2117A}
  .doc-badge{background:#C2117A;color:#fff;padding:7px 18px;border-radius:8px;font-size:16px;font-weight:700}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
  .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}
  .kpi{background:#F6F4F1;border-radius:8px;padding:12px;text-align:center}
  .kpi-val{font-size:18px;font-weight:900;margin-bottom:4px}
  .kpi-label{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#7A736C}
  table{width:100%;border-collapse:collapse;margin:16px 0;font-size:11px}
  th{background:#1B1A1C;color:#fff;padding:7px 10px;text-align:left;font-weight:700;text-transform:uppercase;font-size:10px}
  td{padding:6px 10px;border-bottom:1px solid #eee}
  tr:nth-child(even) td{background:#fafafa}
  .entr{color:#3A9A5C;font-weight:700}.sort{color:#D14343;font-weight:700}
  .total-row td{background:#1B1A1C!important;color:#fff;font-weight:700}
  .sign{display:flex;justify-content:space-between;margin-top:36px}
  .sign-box{text-align:center;width:200px}
  .sign-line{border-bottom:1.5px solid #1B1A1C;margin-top:36px}
  .sign-label{font-size:10px;color:#7A736C;margin-top:5px}
  .footer{margin-top:28px;font-size:10px;color:#888;text-align:center;border-top:1px solid #eee;padding-top:10px}
  @media print{body{padding:16px}}
</style></head><body>
<div class="header">
  <div>
    <div class="logo-text">CARNAVAL<span>IMPRIM</span></div>
    <div style="font-size:10px;color:#888;margin-top:3px">${ent?.siege||''} · ${ent?.tel||''}</div>
  </div>
  <div style="text-align:right">
    <div class="doc-badge">${titre}</div>
    <div style="font-size:11px;color:#888;margin-top:6px">Édité le ${new Date().toLocaleDateString('fr-FR')}</div>
    ${dateDebut||dateFin ? `<div style="font-size:11px;color:#888">Période : ${dateDebut?dateDebut.split('-').reverse().join('/'):'début'} → ${dateFin?dateFin.split('-').reverse().join('/'):'fin'}</div>` : ''}
  </div>
</div>

<div class="kpis">
  <div class="kpi">
    <div class="kpi-val" style="color:#3A9A5C">${formatFCFA(totalEntrees)}</div>
    <div class="kpi-label">Total entrées</div>
  </div>
  <div class="kpi">
    <div class="kpi-val" style="color:#D14343">${formatFCFA(totalSorties)}</div>
    <div class="kpi-label">Total sorties</div>
  </div>
  <div class="kpi">
    <div class="kpi-val" style="color:${totalEntrees-totalSorties>=0?'#3A9A5C':'#D14343'}">${formatFCFA(totalEntrees-totalSorties)}</div>
    <div class="kpi-label">Solde net</div>
  </div>
</div>

<table>
  <thead><tr>
    <th>Date</th><th>Heure</th><th>Catégorie</th><th>Libellé</th><th>Réf.</th>
    <th style="text-align:right">Entrée (+)</th>
    <th style="text-align:right">Sortie (−)</th>
  </tr></thead>
  <tbody>
    ${ops.map(op => `
    <tr>
      <td>${formatDateFR(op.date)}</td>
      <td>${op.heure?.slice(0,5)||'—'}</td>
      <td>${op.categorie}</td>
      <td>${op.libelle}${op.factures?` (${op.factures.numero})`:''}</td>
      <td style="color:#888">${op.reference||'—'}</td>
      <td style="text-align:right" class="${op.type==='entree'?'entr':''}">${op.type==='entree'?formatFCFA(op.montant):''}</td>
      <td style="text-align:right" class="${op.type==='sortie'?'sort':''}">${op.type==='sortie'?formatFCFA(op.montant):''}</td>
    </tr>`).join('')}
    <tr class="total-row">
      <td colspan="5">TOTAL (${ops.length} opération${ops.length>1?'s':''})</td>
      <td style="text-align:right;color:#80ff9a">${formatFCFA(totalEntrees)}</td>
      <td style="text-align:right;color:#ff8080">${formatFCFA(totalSorties)}</td>
    </tr>
  </tbody>
</table>

<div class="sign">
  <div class="sign-box"><div class="sign-line"></div><div class="sign-label">Caissier(e)</div></div>
  <div class="sign-box"><div class="sign-line"></div><div class="sign-label">Responsable / Gérant</div></div>
</div>
<div class="footer">
  ${ent?.nom||'CARNAVAL IMPRIM'} · RC : ${ent?.rc||''} · NCC : ${ent?.ncc||'240220333S'} · Document édité le ${new Date().toLocaleDateString('fr-FR')}
</div>
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400) }
  }

  const opsSelectionnees = filtered.filter(op => selIds.has(op.id))
  const totalEntreesFiltrees = filtered.filter(op=>op.type==='entree').reduce((s,op)=>s+op.montant,0)
  const totalSortiesFiltrees = filtered.filter(op=>op.type==='sortie').reduce((s,op)=>s+op.montant,0)

  return (
    <div style={{ padding:24 }}>
      <PageHeader
        title="Bons de caisse"
        subtitle={`${operations.length} opérations`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher…"
        extra={
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <select value={typeFiltre} onChange={e=>setTypeFiltre(e.target.value)}
              style={{ ...inputStyle, width:'auto', padding:'9px 14px' }}>
              {['Tous','entree','sortie'].map(t=><option key={t} value={t}>{t==='Tous'?'Tous types':t==='entree'?'Entrées':'Sorties'}</option>)}
            </select>
            <input type="date" value={dateDebut} onChange={e=>setDateDebut(e.target.value)}
              style={{ ...inputStyle, width:150, padding:'9px 12px' }} placeholder="Date début" />
            <input type="date" value={dateFin} onChange={e=>setDateFin(e.target.value)}
              style={{ ...inputStyle, width:150, padding:'9px 12px' }} placeholder="Date fin" />
          </div>
        }
      />

      {/* KPIs + boutons impression */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ background:'#E8F7EE', borderRadius:10, padding:'10px 18px', fontSize:13 }}>
          <strong style={{ color:'#3A9A5C' }}>{formatFCFA(totalEntreesFiltrees)}</strong> <span style={{ color:'#7A736C' }}>entrées</span>
        </div>
        <div style={{ background:'#FDE8E8', borderRadius:10, padding:'10px 18px', fontSize:13 }}>
          <strong style={{ color:'#D14343' }}>{formatFCFA(totalSortiesFiltrees)}</strong> <span style={{ color:'#7A736C' }}>sorties</span>
        </div>
        <div style={{ background: totalEntreesFiltrees-totalSortiesFiltrees>=0?'#E8F7EE':'#FDE8E8', borderRadius:10, padding:'10px 18px', fontSize:13 }}>
          <strong style={{ color: totalEntreesFiltrees-totalSortiesFiltrees>=0?'#3A9A5C':'#D14343' }}>
            {formatFCFA(totalEntreesFiltrees-totalSortiesFiltrees)}
          </strong> <span style={{ color:'#7A736C' }}>solde</span>
        </div>
        <div style={{ flex:1 }} />
        {selIds.size > 0 && (
          <button onClick={()=>imprimerBon(opsSelectionnees, 'BON DE CAISSE — SÉLECTION')}
            style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#2A5FA5', color:'#fff', border:'none', padding:'9px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <Printer size={14} /> Imprimer sélection ({selIds.size})
          </button>
        )}
        <button onClick={()=>imprimerBon(filtered)}
          style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#C2117A', color:'#fff', border:'none', padding:'9px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          <Printer size={14} /> Imprimer tout ({filtered.length})
        </button>
      </div>

      <TableWrap minWidth={880}>
        <thead><tr>
          <th style={{ ...th, width:36 }}>
            <input type="checkbox" checked={selIds.size===filtered.length && filtered.length>0}
              onChange={toggleAll} style={{ cursor:'pointer' }} />
          </th>
          {['Date','Heure','Type','Catégorie','Libellé','Réf.','Entrée','Sortie',''].map(h=><th key={h} style={th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map(op => (
            <tr key={op.id} style={{ background: selIds.has(op.id)?'#FEF3E2':undefined }}>
              <td style={td}>
                <input type="checkbox" checked={selIds.has(op.id)} onChange={()=>toggleSel(op.id)} style={{ cursor:'pointer' }} />
              </td>
              <td style={{ ...td, fontSize:12, whiteSpace:'nowrap' }}>{formatDateFR(op.date)}</td>
              <td style={{ ...td, fontSize:11, color:'#7A736C' }}>{op.heure?.slice(0,5)||'—'}</td>
              <td style={td}>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999,
                  background: op.type==='entree'?'#E8F7EE':'#FDE8E8',
                  color: op.type==='entree'?'#3A9A5C':'#D14343' }}>
                  {op.type==='entree'?<>▲ Entrée</>:<>▼ Sortie</>}
                </span>
              </td>
              <td style={{ ...td, fontSize:12 }}>{op.categorie}</td>
              <td style={td}>
                <div style={{ fontWeight:600, fontSize:13 }}>{op.libelle}</div>
                {op.factures && <div style={{ fontSize:11, color:'#7A736C' }}>{op.factures.numero} — {op.factures.clients?.nom}</div>}
              </td>
              <td style={{ ...td, fontSize:11, color:'#7A736C' }}>{op.reference||'—'}</td>
              <td style={{ ...td, color:'#3A9A5C', fontWeight:700, textAlign:'right' }}>
                {op.type==='entree'?formatFCFA(op.montant):''}
              </td>
              <td style={{ ...td, color:'#D14343', fontWeight:700, textAlign:'right' }}>
                {op.type==='sortie'?formatFCFA(op.montant):''}
              </td>
              <td style={{ ...td, textAlign:'right' }}>
                <button onClick={()=>imprimerBon([op], `BON DE CAISSE N° ${op.reference||op.id.slice(0,8).toUpperCase()}`)}
                  style={{ background:'transparent', border:'1px solid #E4DDD6', padding:'4px 10px', borderRadius:8, fontSize:11, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4 }}>
                  <Printer size={12} />
                </button>
              </td>
            </tr>
          ))}
          {filtered.length===0 && <EmptyRow text="Aucune opération." cols={10} />}
        </tbody>
      </TableWrap>
    </div>
  )
}
