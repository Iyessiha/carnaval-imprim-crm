'use client'
import { useState, useMemo } from 'react'
import { formatDateFR, formatFCFA, today } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnIcon, inputStyle } from '@/components/ui/index'
import { Printer, Truck, CheckCircle } from 'lucide-react'
import Image from 'next/image'

type Production = {
  id: string; caracteristique: string; format: string|null; quantite: number
  date: string; statut: string; client_id: string|null
  clients: { nom: string; adresse?: string; telephone?: string }|null
}
type Client = { id: string; nom: string; adresse?: string; telephone?: string }
type Ent = Record<string,string>|null

export default function BonsLivraisonClient({ productions, clients, entreprise }: {
  productions: Production[]; clients: Client[]; entreprise: Ent
}) {
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState('Tous')
  const [numBL, setNumBL] = useState<Record<string,string>>({})

  const filtered = useMemo(() => productions
    .filter(p => filtre === 'Tous' || p.statut === filtre)
    .filter(p => (p.caracteristique + (p.clients?.nom||'')).toLowerCase().includes(q.toLowerCase())),
    [productions, q, filtre])

  const imprimer = (p: Production, numero: string) => {
    const ent = entreprise
    const client = p.clients
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>BL-${numero || 'XXXX'}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:13px;color:#1B1A1C;padding:32px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px}
  .logo-text{font-size:22px;font-weight:900;color:#1B1A1C}.logo-text span{color:#C2117A}
  .doc-badge{background:#C2117A;color:#fff;padding:8px 20px;border-radius:8px;font-size:18px;font-weight:700;display:inline-block}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0}
  .box{background:#F6F4F1;border-radius:8px;padding:14px}
  .box-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#7A736C;margin-bottom:8px}
  .box-val{font-size:14px;font-weight:700;line-height:1.6}
  table{width:100%;border-collapse:collapse;margin:20px 0}
  th{background:#1B1A1C;color:#fff;padding:9px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase}
  td{padding:10px 12px;border-bottom:1px solid #E4DDD6;font-size:13px}
  tr:nth-child(even) td{background:#fafafa}
  .sign{display:flex;justify-content:space-between;margin-top:48px}
  .sign-box{text-align:center;width:200px}
  .sign-line{border-bottom:1.5px solid #1B1A1C;margin-top:36px;width:100%}
  .sign-label{font-size:11px;color:#7A736C;margin-top:6px}
  .footer{margin-top:36px;font-size:10px;color:#888;border-top:1px solid #eee;padding-top:12px;text-align:center;line-height:1.8}
  .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:#E8F7EE;color:#3A9A5C}
  @media print{body{padding:16px}}
</style></head><body>
<div class="header">
  <div>
    <div class="logo-text">CARNAVAL<span>IMPRIM</span></div>
    <div style="font-size:11px;color:#888;margin-top:4px">${ent?.siege||'Cocody-Blockhauss, Abidjan'}</div>
    <div style="font-size:11px;color:#888">${ent?.tel||'07 19 14 13 13'}</div>
  </div>
  <div style="text-align:right">
    <div class="doc-badge">BON DE LIVRAISON</div>
    <div style="font-size:14px;font-weight:900;margin-top:8px">N° BL-${numero||'XXXX'}</div>
    <div style="font-size:12px;color:#888;margin-top:4px">Date : ${today().split('-').reverse().join('/')}</div>
  </div>
</div>

<div class="grid-2">
  <div class="box">
    <div class="box-title">Livré à</div>
    <div class="box-val">${client?.nom||'—'}</div>
    ${client?.adresse ? `<div style="font-size:12px;color:#7A736C;margin-top:4px">${client.adresse}</div>` : ''}
    ${client?.telephone ? `<div style="font-size:12px;color:#7A736C">📞 ${client.telephone}</div>` : ''}
  </div>
  <div class="box">
    <div class="box-title">Référence commande</div>
    <div class="box-val">${p.caracteristique.slice(0,50)}</div>
    <div style="font-size:12px;color:#7A736C;margin-top:4px">Statut : <span class="badge">${p.statut}</span></div>
  </div>
</div>

<table>
  <thead><tr>
    <th>Désignation / Caractéristique</th>
    <th style="text-align:center">Format</th>
    <th style="text-align:center">Quantité</th>
    <th style="text-align:center">Livré</th>
    <th style="text-align:center">Observations</th>
  </tr></thead>
  <tbody>
    <tr>
      <td>${p.caracteristique}</td>
      <td style="text-align:center">${p.format||'—'}</td>
      <td style="text-align:center;font-weight:700">${p.quantite?.toLocaleString('fr-FR')}</td>
      <td style="text-align:center;font-weight:700;color:#3A9A5C">${p.quantite?.toLocaleString('fr-FR')}</td>
      <td style="text-align:center;color:#7A736C">✓ Conforme</td>
    </tr>
  </tbody>
</table>

<div style="background:#E8F7EE;border-radius:8px;padding:12px 16px;margin-top:8px;font-size:13px">
  ✅ <strong>Marchandise livrée</strong> en bon état et conforme à la commande.<br/>
  Toute réclamation doit être formulée dans les <strong>48 heures</strong> suivant la réception.
</div>

<div class="sign">
  <div class="sign-box">
    <div class="sign-line"></div>
    <div class="sign-label">Livreur / Carnaval Imprim</div>
  </div>
  <div class="sign-box">
    <div class="sign-line"></div>
    <div class="sign-label">Client — Signature & Cachet</div>
  </div>
</div>

<div class="footer">
  ${ent?.nom||'CARNAVAL IMPRIM'} SARL — ${ent?.siege||''} — Tél : ${ent?.tel||''}<br/>
  RC : ${ent?.rc||'CI-ABJ-03-2024-B13-05735'} — NCC : ${ent?.ncc||'240220333S'}
</div>
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400) }
  }

  return (
    <div style={{ padding:24 }}>
      <PageHeader
        title="Bons de livraison"
        subtitle={`${productions.length} ordres · ${productions.filter(p=>p.statut==='Livré').length} livrés`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher…"
        extra={
          <select value={filtre} onChange={e=>setFiltre(e.target.value)}
            style={{ ...inputStyle, width:'auto', padding:'10px 14px' }}>
            {['Tous','En attente','En production','Terminé','Livré'].map(s=><option key={s}>{s}</option>)}
          </select>
        }
      />

      <div style={{ background:'#E5EDF8', borderRadius:12, padding:'12px 18px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:10 }}>
        <Truck size={18} style={{ color:'#2A5FA5' }} />
        <span>Saisissez un numéro de bon puis cliquez <strong>Imprimer BL</strong> pour générer le bon de livraison signable.</span>
      </div>

      <TableWrap minWidth={900}>
        <thead><tr>
          {['Date','Caractéristique','Client','Format','Qté','Statut','N° BL',''].map(h=><th key={h} style={th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id}>
              <td style={{ ...td, fontSize:12, whiteSpace:'nowrap' }}>{formatDateFR(p.date)}</td>
              <td style={td}>
                <div style={{ fontWeight:600, maxWidth:240, fontSize:13 }}>
                  {p.caracteristique.slice(0,55)}{p.caracteristique.length>55?'…':''}
                </div>
              </td>
              <td style={{ ...td, fontSize:13 }}>{p.clients?.nom||'—'}</td>
              <td style={{ ...td, fontSize:12 }}>{p.format||'—'}</td>
              <td style={{ ...td, fontWeight:700 }}>{p.quantite?.toLocaleString('fr-FR')}</td>
              <td style={td}>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999,
                  background: p.statut==='Livré'?'#E8F7EE':p.statut==='Terminé'?'#F0E8F8':'#FEF3E2',
                  color: p.statut==='Livré'?'#3A9A5C':p.statut==='Terminé'?'#7B2FA5':'#F39200' }}>
                  {p.statut}
                </span>
              </td>
              <td style={td}>
                <input
                  value={numBL[p.id]||''}
                  onChange={e => setNumBL(prev=>({...prev,[p.id]:e.target.value}))}
                  placeholder="Ex: 2026-001"
                  style={{ ...inputStyle, padding:'6px 10px', width:120, fontSize:12 }}
                />
              </td>
              <td style={{ ...td, textAlign:'right' }}>
                <button onClick={()=>imprimer(p, numBL[p.id]||'')}
                  style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#C2117A', color:'#fff', border:'none', padding:'7px 14px', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  <Printer size={14} /> BL
                </button>
              </td>
            </tr>
          ))}
          {filtered.length===0 && <EmptyRow text="Aucun ordre de production." cols={8} />}
        </tbody>
      </TableWrap>
    </div>
  )
}
