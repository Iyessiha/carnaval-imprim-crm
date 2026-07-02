'use client'
import { useState, useMemo } from 'react'
import { formatFCFA, formatDateFR, calculerTotaux, statutPaiement } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { BtnGhost, BtnPrimary } from '@/components/ui/index'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { AlertTriangle, Printer, Mail, Phone } from 'lucide-react'

type FL = { qte: number; pu: number }
type Pmt = { montant: number; date: string; mode: string }
type Facture = {
  id: string; numero: string; date: string; echeance?: string
  remise: number; tva_applicable: boolean; client_id: string
  factures_lignes: FL[]; paiements: Pmt[]
  clients: { nom: string; telephone?: string; email?: string; adresse?: string } | null
}
type Ent = { nom:string; siege:string; tel:string; email:string; rc:string; ncc:string; taux_tva:number } | null

export default function RelancesClient({ factures, entreprise }: { factures: Facture[]; entreprise: Ent }) {
  const tva = entreprise?.taux_tva ?? 18
  const [sel, setSel] = useState<Facture | null>(null)
  const [niveau, setNiveau] = useState('Tous')

  const impayees = useMemo(() => factures.map(f => {
    const t = calculerTotaux(f.factures_lignes, f.remise, tva, f.tva_applicable)
    const paye = f.paiements.reduce((s, p) => s + p.montant, 0)
    const reste = Math.max(0, t.ttc - paye)
    const statut = statutPaiement(t.ttc, paye)
    const joursRetard = f.echeance ? Math.max(0, Math.floor((new Date().getTime() - new Date(f.echeance).getTime()) / 86400000)) : 0
    const niv = joursRetard === 0 ? 'Non échu' : joursRetard <= 30 ? '1ère relance' : joursRetard <= 60 ? '2ème relance' : 'Contentieux'
    return { ...f, ttc: t.ttc, paye, reste, statut, joursRetard, niv }
  }).filter(f => f.statut !== 'Payée'), [factures, tva])

  const filtered = useMemo(() => niveau === 'Tous' ? impayees : impayees.filter(f => f.niv === niveau), [impayees, niveau])

  const totalReste = filtered.reduce((s, f) => s + f.reste, 0)

  const niveaux = ['Tous','Non échu','1ère relance','2ème relance','Contentieux']
  const NIV_COLORS: Record<string, [string,string]> = {
    'Non échu': ['#E5EDF8','#2A5FA5'],
    '1ère relance': ['#FEF3E2','#F39200'],
    '2ème relance': ['#FDE8E8','#D14343'],
    'Contentieux': ['#1B1A1C','#fff'],
  }

  const genLettre = (f: typeof impayees[0]) => {
    const ent = entreprise
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Relance ${f.numero}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1B1A1C; padding: 40px; max-width: 700px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .logo { font-size: 20px; font-weight: 900; } .logo span { color: #C2117A; }
  h2 { color: #D14343; border-bottom: 2px solid #D14343; padding-bottom: 8px; }
  .montant { font-size: 22px; font-weight: 900; color: #D14343; text-align: center; background: #FDE8E8; padding: 16px; border-radius: 8px; margin: 20px 0; }
  .footer { margin-top: 40px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 16px; }
</style></head><body>
<div class="header">
  <div><div class="logo">CARNAVAL<span>IMPRIM</span></div><div style="font-size:11px;color:#888">${ent?.siege||''}</div></div>
  <div style="text-align:right;font-size:11px;color:#888">Abidjan, le ${new Date().toLocaleDateString('fr-FR')}<br>RC : ${ent?.rc||''}<br>NCC : ${ent?.ncc||''}</div>
</div>
<div style="margin-bottom:24px">
  <strong>${f.clients?.nom || '—'}</strong><br>
  ${f.clients?.adresse || ''}<br>
  ${f.clients?.telephone ? `Tél : ${f.clients.telephone}` : ''}
</div>
<h2>⚠️ ${f.niv === 'Contentieux' ? 'MISE EN DEMEURE' : 'RELANCE DE PAIEMENT'} — Facture N° ${f.numero}</h2>
<p>Sauf erreur ou omission de notre part, nous n'avons pas reçu le règlement de la facture suivante :</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
  <tr style="background:#F6F4F1"><th style="padding:8px 12px;text-align:left">Facture</th><th style="padding:8px 12px;text-align:left">Date</th><th style="padding:8px 12px;text-align:left">Échéance</th><th style="padding:8px 12px;text-align:right">Montant TTC</th><th style="padding:8px 12px;text-align:right">Réglé</th><th style="padding:8px 12px;text-align:right">Reste dû</th></tr>
  <tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${f.numero}</td><td style="padding:8px 12px;border-bottom:1px solid #eee">${formatDateFR(f.date)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee">${f.echeance ? formatDateFR(f.echeance) : '—'}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${formatFCFA(f.ttc)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#3A9A5C">${formatFCFA(f.paye)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:900;color:#D14343">${formatFCFA(f.reste)}</td></tr>
</table>
<div class="montant">Montant restant dû : ${formatFCFA(f.reste)}<br><span style="font-size:13px;font-weight:400">${f.joursRetard > 0 ? `en retard de ${f.joursRetard} jour${f.joursRetard > 1 ? 's' : ''}` : 'à régler à bonne date'}</span></div>
<p>${f.niv === 'Contentieux' ? '<strong>Nous vous mettons en demeure</strong> de procéder au règlement de cette somme dans un délai de <strong>48 heures</strong> sous peine de poursuites judiciaires.' : 'Nous vous prions de bien vouloir procéder au règlement de cette somme dans les meilleurs délais, par virement ou mobile money.'}</p>
<p style="margin-top:16px">Pour tout renseignement, contactez-nous : ${ent?.tel||''} / ${ent?.email||''}</p>
<p style="margin-top:24px">Cordialement,<br><strong>${ent?.nom || 'CARNAVAL IMPRIM'}</strong></p>
<div class="footer">${ent?.nom||''} — ${ent?.siege||''} — RC : ${ent?.rc||''} — NCC : ${ent?.ncc||''}</div>
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400) }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Relances & Impayés</h1>
        <p style={{ color: '#7A736C', fontSize: 14, margin: '4px 0 0' }}>Suivi des créances clients</p>
      </div>

      {/* Bannière alerte */}
      {totalReste > 0 && (
        <div style={{ background: 'linear-gradient(135deg,#D14343,#e85757)', borderRadius: 14, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, color: '#fff' }}>
          <AlertTriangle size={24} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{formatFCFA(totalReste)} à recouvrer</div>
            <div style={{ fontSize: 13, opacity: .85 }}>{filtered.length} facture{filtered.length > 1 ? 's' : ''} impayée{filtered.length > 1 ? 's' : ''} — Agissez rapidement !</div>
          </div>
        </div>
      )}

      {/* Stats par niveau */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {niveaux.map(n => {
          const count = n === 'Tous' ? impayees.length : impayees.filter(f => f.niv === n).length
          const montant = n === 'Tous' ? totalReste : impayees.filter(f => f.niv === n).reduce((s, f) => s + f.reste, 0)
          const [bg, color] = n === 'Tous' ? ['#F0EEEC','#1B1A1C'] : (NIV_COLORS[n] || ['#F0EEEC','#7A736C'])
          return (
            <div key={n} onClick={() => setNiveau(n)}
              style={{ background: bg, color, borderRadius: 12, padding: '10px 16px', cursor: 'pointer', flex: 1, minWidth: 120, border: `2px solid ${niveau === n ? color : 'transparent'}` }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{count}</div>
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{n}</div>
              {montant > 0 && <div style={{ fontSize: 11, opacity: .7, marginTop: 2 }}>{formatFCFA(montant)}</div>}
            </div>
          )
        })}
      </div>

      <TableWrap minWidth={860}>
        <thead><tr>{['Facture','Client','Date','Échéance','TTC','Reste dû','Retard','Niveau',''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {filtered.map(f => {
            const [bg, color] = NIV_COLORS[f.niv] || ['#F0EEEC','#7A736C']
            return (
              <tr key={f.id}>
                <td style={{ ...td, fontWeight: 700, color: '#C2117A' }}>{f.numero}</td>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{f.clients?.nom || '—'}</div>
                  {f.clients?.telephone && <div style={{ fontSize: 11, color: '#7A736C', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}><Phone size={10} />{f.clients.telephone}</div>}
                </td>
                <td style={{ ...td, whiteSpace: 'nowrap', fontSize: 12 }}>{formatDateFR(f.date)}</td>
                <td style={{ ...td, whiteSpace: 'nowrap', fontSize: 12, color: f.joursRetard > 0 ? '#D14343' : '#7A736C' }}>
                  {f.echeance ? formatDateFR(f.echeance) : '—'}
                </td>
                <td style={{ ...td, fontWeight: 600 }}>{formatFCFA(f.ttc)}</td>
                <td style={{ ...td, fontWeight: 800, color: '#D14343' }}>{formatFCFA(f.reste)}</td>
                <td style={{ ...td, fontSize: 12, color: f.joursRetard > 0 ? '#D14343' : '#3A9A5C', fontWeight: 600 }}>
                  {f.joursRetard > 0 ? `${f.joursRetard}j` : 'À venir'}
                </td>
                <td style={td}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: bg, color }}>
                    {f.niv}
                  </span>
                </td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick={() => setSel(f as unknown as Facture)} style={{ background: 'transparent', border: '1px solid #E4DDD6', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Printer size={13} /> Lettre
                  </button>
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && <EmptyRow text="Aucun impayé 🎉" cols={9} />}
        </tbody>
      </TableWrap>

      {sel && (
        <Modal title={`Relance — ${sel.numero}`} onClose={() => setSel(null)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{sel.clients?.nom}</div>
            {sel.clients?.telephone && <div style={{ fontSize: 13, color: '#7A736C', display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} /> {sel.clients.telephone}</div>}
            {sel.clients?.email && <div style={{ fontSize: 13, color: '#7A736C', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><Mail size={14} /> {sel.clients.email}</div>}
          </div>
          <div style={{ background: '#FDE8E8', borderRadius: 10, padding: '14px 16px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#D14343' }}>{formatFCFA(Math.max(0, calculerTotaux(sel.factures_lignes, sel.remise, tva, sel.tva_applicable).ttc - sel.paiements.reduce((s,p) => s+p.montant,0)))}</div>
            <div style={{ fontSize: 12, color: '#D14343', marginTop: 4 }}>Montant à recouvrer</div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <BtnGhost onClick={() => setSel(null)}>Fermer</BtnGhost>
            <BtnPrimary onClick={() => genLettre(sel as unknown as typeof impayees[0])}>
              <Printer size={16} /> Générer la lettre de relance
            </BtnPrimary>
          </div>
        </Modal>
      )}
    </div>
  )
}
