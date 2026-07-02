'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/any'
import { formatFCFA, formatDateFR, calculerTotaux, today } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import LignesEditor, { type Ligne } from '@/components/ui/LignesEditor'
import TotauxBox from '@/components/ui/TotauxBox'
import { Eye, Pencil, Trash2, Receipt, Check, Printer, Copy } from 'lucide-react'

const STATUTS = ['Brouillon', 'Envoyé', 'Accepté', 'Refusé'] as const

type Devis = {
  id: string; numero: string; client_id: string; date: string
  validite?: string; statut: string; remise: number; tva_applicable: boolean
  notes?: string; devis_lignes: Ligne[]
  clients: { nom: string; telephone?: string; email?: string; adresse?: string; ncc?: string } | null
}
type Client = { id: string; nom: string; template_fne_defaut: string; telephone?: string; email?: string; adresse?: string; ncc?: string }
type Produit = { id: string; nom: string; prix_base: number; unite: string }
type Entreprise = { nom: string; siege: string; tel: string; email: string; rc: string; ncc: string; taux_tva: number } | null

export default function DevisClient({ devis: initial, clients, produits, tauxTva, entreprise }: {
  devis: Devis[]; clients: Client[]; produits: Produit[]; tauxTva: number; entreprise?: Entreprise
}) {
  const router = useRouter()
  const [devis, setDevis] = useState(initial)
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState('Tous')
  const [modal, setModal] = useState<'create' | 'edit' | 'view' | null>(null)
  const [sel, setSel] = useState<Devis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(() => devis
    .filter(d => filtre === 'Tous' || d.statut === filtre)
    .filter(d => (d.numero + (d.clients?.nom || '')).toLowerCase().includes(q.toLowerCase())),
    [devis, q, filtre])

  const emptyForm: Partial<Devis> = {
    client_id: clients[0]?.id || '', date: today(),
    statut: 'Brouillon', remise: 0, tva_applicable: true, notes: '',
    devis_lignes: [{ designation: '', qte: 1, pu: 0 }],
  }
  const [form, setForm] = useState<Partial<Devis>>(emptyForm)
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const openCreate = () => { setError(''); setForm(emptyForm); setModal('create') }
  const openEdit = (d: Devis) => { setError(''); setSel(d); setForm({ ...d }); setModal('edit') }
  const openView = (d: Devis) => { setSel(d); setModal('view') }

  const save = async () => {
    if (!form.client_id) { setError('Sélectionnez un client.'); return }
    setLoading(true); setError('')
    const sb = getSupabase()
    const { devis_lignes, clients: _c, ...body } = form as Devis & { clients: unknown }
    if (sel?.id) {
      const { error: e } = await sb.from('devis').update(body).eq('id', sel.id)
      if (e) { setError(e.message); setLoading(false); return }
      await sb.from('devis_lignes').delete().eq('devis_id', sel.id)
      if (devis_lignes?.length) await sb.from('devis_lignes').insert(devis_lignes.map((l: Ligne, i: number) => ({ ...l, devis_id: sel.id, ordre: i })))
      const cNom = clients.find(c => c.id === form.client_id)?.nom || ''
      setDevis(prev => prev.map(d => d.id === sel.id ? { ...d, ...form, devis_lignes: devis_lignes || [], clients: { nom: cNom } } as Devis : d))
    } else {
      const { data: numero } = await sb.rpc('next_numero', { p_type: 'DV', p_annee: new Date().getFullYear() })
      const { data: created, error: e } = await sb.from('devis').insert({ ...body, numero }).select().single()
      if (e) { setError(e.message); setLoading(false); return }
      if (devis_lignes?.length) await sb.from('devis_lignes').insert(devis_lignes.map((l: Ligne, i: number) => ({ ...l, devis_id: created.id, ordre: i })))
      const cNom = clients.find(c => c.id === form.client_id)?.nom || ''
      setDevis(prev => [{ ...created, devis_lignes: devis_lignes || [], clients: { nom: cNom } } as Devis, ...prev])
    }
    setLoading(false); setModal(null); setSel(null); router.refresh()
  }

  const del = async (d: Devis) => {
    if (!confirm(`Supprimer ${d.numero} ?`)) return
    const sb = getSupabase()
    await sb.from('devis').delete().eq('id', d.id)
    setDevis(prev => prev.filter(x => x.id !== d.id)); router.refresh()
  }

  const toFacture = async (d: Devis) => {
    if (!confirm(`Convertir ${d.numero} en facture ?`)) return
    setLoading(true)
    const sb = getSupabase()
    const { data: num } = await sb.rpc('next_numero', { p_type: 'FA', p_annee: new Date().getFullYear() })
    const client = clients.find(c => c.id === d.client_id)
    const { data: facture, error: e } = await sb.from('factures').insert({
      numero: num, client_id: d.client_id, devis_id: d.id, date: today(),
      remise: d.remise, tva_applicable: d.tva_applicable, notes: d.notes,
      template_fne: client?.template_fne_defaut || 'B2B', payment_method_fne: 'cash',
    }).select().single()
    if (e) { alert(e.message); setLoading(false); return }
    if (d.devis_lignes?.length) await sb.from('factures_lignes').insert(d.devis_lignes.map((l: Ligne, i: number) => ({ ...l, facture_id: facture.id, taxes: ['TVA'], ordre: i })))
    await sb.from('devis').update({ statut: 'Accepté' }).eq('id', d.id)
    setDevis(prev => prev.map(x => x.id === d.id ? { ...x, statut: 'Accepté' } : x))
    setLoading(false); setModal(null)
    alert(`✅ Facture ${num} créée !`); router.refresh()
  }

  const dupliquer = async (d: Devis) => {
    setLoading(true)
    const sb = getSupabase()
    const { data: num } = await sb.rpc('next_numero', { p_type: 'DV', p_annee: new Date().getFullYear() })
    const { data: created, error: e } = await sb.from('devis').insert({
      numero: num, client_id: d.client_id, date: today(),
      statut: 'Brouillon', remise: d.remise, tva_applicable: d.tva_applicable, notes: d.notes,
    }).select().single()
    if (e) { alert(e.message); setLoading(false); return }
    if (d.devis_lignes?.length) await sb.from('devis_lignes').insert(d.devis_lignes.map((l: Ligne, i: number) => ({ ...l, devis_id: created.id, ordre: i })))
    const cNom = clients.find(c => c.id === d.client_id)?.nom || ''
    setDevis(prev => [{ ...created, devis_lignes: d.devis_lignes || [], clients: { nom: cNom } } as Devis, ...prev])
    setLoading(false); router.refresh()
  }

  const imprimer = (d: Devis) => {
    const t = calculerTotaux(d.devis_lignes || [], d.remise, tauxTva, d.tva_applicable)
    const client = d.clients
    const ent = entreprise
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Devis ${d.numero}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1B1A1C; padding: 32px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
  .logo { font-size: 22px; font-weight: 900; color: #1B1A1C; }
  .logo span { color: #C2117A; }
  .infos-ent { font-size: 11px; color: #666; text-align: right; line-height: 1.7; }
  .doc-title { background: #C2117A; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 20px; font-weight: 700; display: inline-block; margin-bottom: 24px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .client-box { background: #F6F4F1; border-radius: 8px; padding: 14px; min-width: 220px; }
  .client-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #888; margin-bottom: 6px; }
  .client-box p { font-weight: 700; font-size: 14px; }
  .meta-right { text-align: right; font-size: 12px; color: #555; line-height: 2; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead tr { background: #1B1A1C; color: #fff; }
  th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  td { padding: 10px 12px; border-bottom: 1px solid #E4DDD6; }
  tr:nth-child(even) td { background: #fafafa; }
  .totaux { margin-left: auto; width: 280px; }
  .totaux-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
  .totaux-total { border-top: 2px solid #C2117A; margin-top: 6px; padding-top: 8px; font-size: 16px; font-weight: 900; color: #C2117A; }
  .footer { margin-top: 40px; font-size: 11px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 16px; line-height: 1.8; }
  .notes { background: #FEF3E2; border-left: 3px solid #F39200; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 12px; }
  @media print { body { padding: 16px; } }
</style></head><body>
<div class="header">
  <div>
    <div class="logo">CARNAVAL<span>IMPRIM</span></div>
    <div style="font-size:11px;color:#888;margin-top:4px">${ent?.siege || 'Cocody - Blockhauss, Abidjan'}</div>
    <div style="font-size:11px;color:#888">${ent?.tel || '07 19 14 13 13'}</div>
  </div>
  <div class="infos-ent">
    RC : ${ent?.rc || 'CI-ABJ-03-2024-B13-05735'}<br>
    NCC : ${ent?.ncc || '240220333S'}<br>
    ${ent?.email || 'contact@carnavalimprim.ci'}
  </div>
</div>

<div class="doc-title">DEVIS N° ${d.numero}</div>

<div class="meta">
  <div class="client-box">
    <h4>Client</h4>
    <p>${client?.nom || '—'}</p>
    ${client?.adresse ? `<div style="font-size:12px;color:#555;margin-top:4px">${client.adresse}</div>` : ''}
    ${client?.telephone ? `<div style="font-size:12px;color:#555">${client.telephone}</div>` : ''}
    ${client?.ncc ? `<div style="font-size:11px;color:#888;margin-top:2px">NCC : ${client.ncc}</div>` : ''}
  </div>
  <div class="meta-right">
    <div><strong>Date :</strong> ${formatDateFR(d.date)}</div>
    ${d.validite ? `<div><strong>Validité :</strong> ${formatDateFR(d.validite)}</div>` : ''}
    <div><strong>Statut :</strong> ${d.statut}</div>
  </div>
</div>

<table>
  <thead><tr><th>#</th><th>Désignation</th><th style="text-align:right">Qté</th><th style="text-align:right">P.U. HT</th><th style="text-align:right">Montant HT</th></tr></thead>
  <tbody>
    ${(d.devis_lignes || []).map((l, i) => `
    <tr>
      <td style="color:#888">${i + 1}</td>
      <td>${l.designation}</td>
      <td style="text-align:right">${l.qte}</td>
      <td style="text-align:right">${formatFCFA(l.pu)}</td>
      <td style="text-align:right;font-weight:700">${formatFCFA(l.qte * l.pu)}</td>
    </tr>`).join('')}
  </tbody>
</table>

${d.notes ? `<div class="notes"><strong>Notes :</strong> ${d.notes}</div>` : ''}

<div class="totaux">
  <div class="totaux-row"><span>Sous-total HT</span><span>${formatFCFA(t.sousTotal)}</span></div>
  ${t.remise > 0 ? `<div class="totaux-row"><span>Remise</span><span>- ${formatFCFA(t.remise)}</span></div>` : ''}
  ${d.tva_applicable ? `<div class="totaux-row"><span>TVA (${tauxTva}%)</span><span>${formatFCFA(t.tva)}</span></div>` : ''}
  <div class="totaux-row totaux-total"><span>TOTAL TTC</span><span>${formatFCFA(t.ttc)}</span></div>
</div>

<div class="footer">
  CARNAVAL IMPRIM SARL — ${ent?.siege || 'Cocody-Blockhauss, Abidjan'} — Tél : ${ent?.tel || '07 19 14 13 13'}<br>
  RC : ${ent?.rc || 'CI-ABJ-03-2024-B13-05735'} — NCC : ${ent?.ncc || '240220333S'} — Régime : Réel simplifié — Centre des impôts : Cocody<br>
  Ce devis est valable 30 jours à compter de sa date d'émission.
</div>
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500) }
  }

  const FormContent = (
    <div>
      {error && <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Client *">
          <select style={inputStyle} value={form.client_id || ''} onChange={e => setF('client_id', e.target.value)}>
            <option value="">— Sélectionner —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </Field>
        <Field label="Date"><input type="date" style={inputStyle} value={form.date || today()} onChange={e => setF('date', e.target.value)} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Validité"><input type="date" style={inputStyle} value={form.validite || ''} onChange={e => setF('validite', e.target.value)} /></Field>
        <Field label="Statut">
          <select style={inputStyle} value={form.statut || 'Brouillon'} onChange={e => setF('statut', e.target.value)}>
            {STATUTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ marginBottom: 14 }}>
        <LignesEditor lignes={form.devis_lignes || []} onChange={l => setF('devis_lignes', l)} produits={produits} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
        <Field label="Remise (FCFA)"><input type="number" min="0" style={inputStyle} value={form.remise || 0} onChange={e => setF('remise', Number(e.target.value))} /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, paddingTop: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.tva_applicable ?? true} onChange={e => setF('tva_applicable', e.target.checked)} /> TVA ({tauxTva}%)
        </label>
      </div>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} value={form.notes || ''} onChange={e => setF('notes', e.target.value)} /></Field>
      <TotauxBox lignes={form.devis_lignes || []} remise={form.remise || 0} tvaApplicable={form.tva_applicable ?? true} tauxTva={tauxTva} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
        <BtnGhost onClick={() => { setModal(null); setSel(null) }}>Annuler</BtnGhost>
        <BtnPrimary onClick={save} disabled={loading}><Check size={16} />{loading ? '…' : 'Enregistrer'}</BtnPrimary>
      </div>
    </div>
  )

  const stats = { total: devis.length, brouillon: devis.filter(d => d.statut === 'Brouillon').length, envoye: devis.filter(d => d.statut === 'Envoyé').length, accepte: devis.filter(d => d.statut === 'Accepté').length }

  return (
    <div style={{ padding: 24 }}>
      {/* Bandeau stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', val: stats.total, c: '#1B1A1C', bg: '#F0EEEC' },
          { label: 'Brouillons', val: stats.brouillon, c: '#7A736C', bg: '#F0EEEC' },
          { label: 'Envoyés', val: stats.envoye, c: '#F39200', bg: '#FEF3E2' },
          { label: 'Acceptés', val: stats.accepte, c: '#3A9A5C', bg: '#E8F7EE' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }} onClick={() => setFiltre(s.label === 'Total' ? 'Tous' : s.label.replace('s', '').replace('és', 'é').replace('illons', 'illon'))}>
            <strong style={{ color: s.c }}>{s.val}</strong> <span style={{ color: '#7A736C' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <PageHeader
        title="Devis"
        subtitle={`${devis.length} devis`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher un devis…"
        onAdd={openCreate} addLabel="Nouveau devis"
        extra={
          <select value={filtre} onChange={e => setFiltre(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '10px 14px' }}>
            {['Tous', ...STATUTS].map(s => <option key={s}>{s}</option>)}
          </select>
        }
      />

      <TableWrap minWidth={860}>
        <thead><tr>{['N°','Client','Date','Validité','TTC','Statut',''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {filtered.map(d => {
            const t = calculerTotaux(d.devis_lignes || [], d.remise, tauxTva, d.tva_applicable)
            const expire = d.validite && new Date(d.validite) < new Date() && d.statut !== 'Accepté'
            return (
              <tr key={d.id}>
                <td style={{ ...td, fontWeight: 700, color: '#C2117A' }}>{d.numero}</td>
                <td style={td}><div style={{ fontWeight: 600 }}>{d.clients?.nom || '—'}</div></td>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatDateFR(d.date)}</td>
                <td style={{ ...td, whiteSpace: 'nowrap', color: expire ? '#D14343' : '#7A736C' }}>
                  {d.validite ? formatDateFR(d.validite) : '—'}{expire ? ' ⚠️' : ''}
                </td>
                <td style={{ ...td, fontWeight: 700 }}>{formatFCFA(t.ttc)}</td>
                <td style={td}><Badge value={d.statut} /></td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <BtnIcon onClick={() => imprimer(d)} title="Imprimer PDF"><Printer size={16} /></BtnIcon>
                  <BtnIcon onClick={() => openView(d)} title="Aperçu"><Eye size={16} /></BtnIcon>
                  <BtnIcon onClick={() => openEdit(d)} title="Modifier"><Pencil size={16} /></BtnIcon>
                  <BtnIcon onClick={() => dupliquer(d)} title="Dupliquer"><Copy size={16} /></BtnIcon>
                  {d.statut !== 'Accepté' && d.statut !== 'Refusé' && <BtnIcon onClick={() => toFacture(d)} title="→ Facture"><Receipt size={16} /></BtnIcon>}
                  <BtnIcon onClick={() => del(d)} danger><Trash2 size={16} /></BtnIcon>
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && <EmptyRow text="Aucun devis." cols={7} />}
        </tbody>
      </TableWrap>

      {modal === 'create' && <Modal title="Nouveau devis" onClose={() => { setModal(null); setError('') }} wide>{FormContent}</Modal>}
      {modal === 'edit' && sel && <Modal title={`Modifier — ${sel.numero}`} onClose={() => { setModal(null); setSel(null); setError('') }} wide>{FormContent}</Modal>}
      {modal === 'view' && sel && (
        <Modal title={`Devis ${sel.numero}`} onClose={() => { setModal(null); setSel(null) }} wide>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{sel.clients?.nom}</div>
              {sel.clients?.telephone && <div style={{ fontSize: 13, color: '#7A736C', marginTop: 2 }}>📞 {sel.clients.telephone}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: 13 }}>
              <div>{formatDateFR(sel.date)}{sel.validite ? ` → ${formatDateFR(sel.validite)}` : ''}</div>
              <div style={{ marginTop: 4 }}><Badge value={sel.statut} /></div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 14 }}>
            <thead><tr style={{ background: '#F6F4F1' }}>
              <th style={th}>Désignation</th><th style={{ ...th, textAlign: 'right' }}>Qté</th>
              <th style={{ ...th, textAlign: 'right' }}>P.U.</th><th style={{ ...th, textAlign: 'right' }}>Total</th>
            </tr></thead>
            <tbody>
              {(sel.devis_lignes || []).map((l, i) => (
                <tr key={i}>
                  <td style={td}>{l.designation}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{l.qte}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{formatFCFA(l.pu)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{formatFCFA(l.qte * l.pu)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <TotauxBox lignes={sel.devis_lignes || []} remise={sel.remise} tvaApplicable={sel.tva_applicable} tauxTva={tauxTva} />
          {sel.notes && <div style={{ marginTop: 12, background: '#F6F4F1', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}><strong>Notes :</strong> {sel.notes}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <BtnGhost onClick={() => imprimer(sel)}><Printer size={16} /> Imprimer PDF</BtnGhost>
            {sel.statut !== 'Accepté' && sel.statut !== 'Refusé' && (
              <BtnPrimary onClick={() => toFacture(sel)} disabled={loading}><Receipt size={16} /> → Facture</BtnPrimary>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
