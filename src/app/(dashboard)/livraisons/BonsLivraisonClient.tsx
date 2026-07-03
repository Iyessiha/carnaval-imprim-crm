'use client'
import { useState, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase/any'
import { formatDateFR, today } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { inputStyle } from '@/components/ui/index'
import { Printer, CheckCircle } from 'lucide-react'

type Production = {
  id: string; caracteristique: string; format: string|null; quantite: number
  date: string; statut: string; numero_bl: string|null
  date_livraison_prevue: string|null; date_livraison_reelle: string|null
  client_id: string|null; devis_id: string|null
  clients: { nom: string; adresse?: string; telephone?: string }|null
  devis: { numero: string }|null
}
type Ent = Record<string,string>|null

export default function BonsLivraisonClient({ productions, entreprise }: {
  productions: Production[]; entreprise: Ent
}) {
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState('Tous')
  const [numBL, setNumBL] = useState<Record<string,string>>({})
  const [saving, setSaving] = useState<string|null>(null)

  const filtered = useMemo(() => productions
    .filter(p => filtre === 'Tous' || p.statut === filtre)
    .filter(p => (p.caracteristique+(p.clients?.nom||'')+(p.numero_bl||'')).toLowerCase().includes(q.toLowerCase())),
    [productions, q, filtre])

  const marquerLivre = async (p: Production) => {
    const num = numBL[p.id] || `BL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
    setSaving(p.id)
    const sb = getSupabase()
    await sb.from('productions').update({ numero_bl: num, statut: 'Livré', date_livraison_reelle: today() }).eq('id', p.id)
    setSaving(null)
    imprimerBL(p, num)
  }

  const imprimerBL = (p: Production, numero: string) => {
    const ent = entreprise
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>BL ${numero}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#1B1A1C;padding:30px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
  .logo{font-size:22px;font-weight:900}.logo span{color:#C2117A}
  .badge{background:#C2117A;color:#fff;padding:8px 18px;border-radius:8px;font-size:18px;font-weight:700;text-align:center}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
  .box{background:#F6F4F1;border-radius:8px;padding:14px;border-left:4px solid #C2117A}
  .box-t{font-size:9px;font-weight:800;text-transform:uppercase;color:#7A736C;margin-bottom:6px}
  .box-v{font-size:13px;font-weight:700;line-height:1.6}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  th{background:#1B1A1C;color:#fff;padding:8px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase}
  td{padding:10px 12px;border-bottom:1px solid #eee;font-size:12px}
  .sign{display:flex;justify-content:space-between;margin-top:40px;padding-top:16px;border-top:1px solid #E4DDD6}
  .sign-box{text-align:center;width:200px}
  .sign-line{border-bottom:1.5px solid #1B1A1C;margin-top:48px}
  .sign-label{font-size:10px;color:#7A736C;margin-top:5px}
  .footer{margin-top:24px;font-size:9px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:10px;line-height:1.8}
  @media print{body{padding:16px}}
</style></head><body>
<div class="header">
  <div>
    <div class="logo">CARNAVAL<span>IMPRIM</span></div>
    <div style="font-size:10px;color:#888;margin-top:4px">${ent?.siege||'Cocody-Blockhauss, Abidjan'}</div>
    <div style="font-size:10px;color:#888">Tél : ${ent?.tel||'07 19 14 13 13'}</div>
    <div style="font-size:10px;color:#888">RC : ${ent?.rc||''} · NCC : ${ent?.ncc||'240220333S'}</div>
  </div>
  <div style="text-align:right">
    <div class="badge">BON DE LIVRAISON</div>
    <div style="font-size:16px;font-weight:900;margin-top:8px">N° ${numero}</div>
    <div style="font-size:11px;color:#888;margin-top:3px">Date : ${new Date().toLocaleDateString('fr-FR')}</div>
    ${p.devis ? `<div style="font-size:11px;color:#2A5FA5;margin-top:3px">📋 Réf. devis : ${p.devis.numero}</div>` : ''}
  </div>
</div>
<div class="grid2">
  <div class="box">
    <div class="box-t">Livré à</div>
    <div class="box-v">${p.clients?.nom||'—'}</div>
    ${p.clients?.adresse ? `<div style="font-size:11px;color:#7A736C;margin-top:3px">${p.clients.adresse}</div>` : ''}
    ${p.clients?.telephone ? `<div style="font-size:11px;color:#7A736C">📞 ${p.clients.telephone}</div>` : ''}
  </div>
  <div class="box">
    <div class="box-t">Référence commande</div>
    <div class="box-v">${p.caracteristique.slice(0,60)}</div>
    ${p.date_livraison_prevue ? `<div style="font-size:11px;color:#7A736C;margin-top:3px">Date prévue : ${formatDateFR(p.date_livraison_prevue)}</div>` : ''}
  </div>
</div>
<table>
  <thead><tr>
    <th>Désignation / Caractéristique</th>
    <th style="text-align:center">Format</th>
    <th style="text-align:center">Qté commandée</th>
    <th style="text-align:center">Qté livrée</th>
    <th>Observations</th>
  </tr></thead>
  <tbody><tr>
    <td style="font-weight:600">${p.caracteristique}</td>
    <td style="text-align:center">${p.format||'—'}</td>
    <td style="text-align:center;font-weight:700">${p.quantite?.toLocaleString('fr-FR')}</td>
    <td style="text-align:center;font-weight:700;color:#3A9A5C">${p.quantite?.toLocaleString('fr-FR')}</td>
    <td style="color:#3A9A5C">✓ Conforme</td>
  </tr></tbody>
</table>
<div style="background:#E8F7EE;border-radius:8px;padding:12px 16px;font-size:12px;margin:8px 0">
  ✅ <strong>Marchandise livrée en bon état</strong> et conforme à la commande.<br/>
  Toute réclamation doit être formulée dans les <strong>48 heures</strong> suivant la réception.
</div>
<div class="sign">
  <div class="sign-box"><div class="sign-line"></div><div class="sign-label">Livreur / Carnaval Imprim</div></div>
  <div class="sign-box"><div class="sign-line"></div><div class="sign-label">Client — Signature & Cachet</div></div>
</div>
<div class="footer">
  ${ent?.nom||'CARNAVAL IMPRIM'} SARL · Siège : ${ent?.siege||''}<br/>
  RC : ${ent?.rc||''} · NCC : ${ent?.ncc||'240220333S'}
</div>
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400) }
  }

  return (
    <div style={{ padding:24 }}>
      <PageHeader
        title="Bons de livraison"
        subtitle={`${productions.length} commandes · ${productions.filter(p=>p.statut==='Livré').length} livrées`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher…"
        extra={
          <select value={filtre} onChange={e=>setFiltre(e.target.value)}
            style={{ ...inputStyle, width:'auto', padding:'9px 14px' }}>
            {['Tous','En attente','En production','Terminé','Livré'].map(s=><option key={s}>{s}</option>)}
          </select>
        }
      />

      <div style={{ background:'#E5EDF8', borderRadius:12, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', gap:10, alignItems:'center' }}>
        <span style={{fontSize:18}}>💡</span>
        <span>Saisissez un N° de BL (facultatif) puis cliquez sur <strong>Livrer & Imprimer</strong> pour marquer comme livré et générer le bon signable.</span>
      </div>

      <TableWrap minWidth={980}>
        <thead><tr>
          {['Date','Client','Réf. devis','Caractéristique','Format','Qté','Statut','N° BL','Actions'].map(h=><th key={h} style={th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id} style={{ background: p.statut==='Livré' ? '#FAFFFE' : undefined }}>
              <td style={{ ...td, fontSize:12, whiteSpace:'nowrap' as const }}>{formatDateFR(p.date)}</td>
              <td style={{ ...td, fontWeight:600 }}>{p.clients?.nom||'—'}</td>
              <td style={{ ...td, fontSize:12 }}>
                {p.devis ? <span style={{ color:'#2A5FA5', fontWeight:600 }}>📋 {p.devis.numero}</span> : <span style={{ color:'#B0A89F' }}>—</span>}
              </td>
              <td style={{ ...td, maxWidth:200 }}>
                <div style={{ fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>
                  {p.caracteristique.slice(0,45)}{p.caracteristique.length>45?'…':''}
                </div>
              </td>
              <td style={{ ...td, fontSize:12 }}>{p.format||'—'}</td>
              <td style={{ ...td, fontWeight:700 }}>{p.quantite?.toLocaleString('fr-FR')}</td>
              <td style={td}>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:999,
                  background: p.statut==='Livré'?'#E8F7EE':p.statut==='Terminé'?'#F0E8F8':'#FEF3E2',
                  color: p.statut==='Livré'?'#2D7A4E':p.statut==='Terminé'?'#7B2FA5':'#D4780A' }}>
                  {p.statut==='Livré' ? '✅ Livré' : p.statut}
                </span>
              </td>
              <td style={td}>
                {p.numero_bl
                  ? <span style={{ color:'#2D7A4E', fontWeight:700, fontSize:12 }}>{p.numero_bl}</span>
                  : <input value={numBL[p.id]||''} onChange={e=>setNumBL(prev=>({...prev,[p.id]:e.target.value}))}
                      placeholder="BL-2026-001" style={{ ...inputStyle, padding:'5px 8px', width:120, fontSize:11 }} />
                }
              </td>
              <td style={{ ...td, textAlign:'right' as const }}>
                {p.statut !== 'Livré'
                  ? <button onClick={()=>marquerLivre(p)} disabled={saving===p.id}
                      style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#C2117A', color:'#fff', border:'none', padding:'7px 12px', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      <Printer size={13}/> {saving===p.id?'…':'Livrer & BL'}
                    </button>
                  : <button onClick={()=>imprimerBL(p, p.numero_bl||'')}
                      style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#F6F4F1', color:'#2D7A4E', border:'1px solid #E4DDD6', padding:'7px 12px', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      <Printer size={13}/> Réimprimer
                    </button>
                }
              </td>
            </tr>
          ))}
          {filtered.length===0 && <EmptyRow text="Aucun ordre de production." cols={9}/>}
        </tbody>
      </TableWrap>
    </div>
  )
}
