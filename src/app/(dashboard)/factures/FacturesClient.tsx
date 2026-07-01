'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/any'
import { formatFCFA, formatDateFR, calculerTotaux, statutPaiement, today } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import LignesEditor, { type Ligne } from '@/components/ui/LignesEditor'
import TotauxBox from '@/components/ui/TotauxBox'
import { Eye, Pencil, Trash2, Wallet, Check, Printer, QrCode } from 'lucide-react'

const MODES = ['cash','mobile-money','wave','cheque','virement','carte'] as const
const TEMPLATES = ['B2B','B2G','B2C','B2F'] as const

type Paiement = { id: string; date: string; montant: number; mode: string; reference?: string }
type Facture = {
  id: string; numero: string; client_id: string; date: string; echeance?: string
  remise: number; tva_applicable: boolean; notes?: string; is_avoir: boolean
  template_fne: string; payment_method_fne: string
  fne_certifiee: boolean; fne_reference?: string; qr_code_url?: string
  factures_lignes: Ligne[]; paiements: Paiement[]
  clients: { nom: string; ncc?: string; telephone?: string; email?: string } | null
}
type Client = { id: string; nom: string; ncc?: string; template_fne_defaut: string; telephone?: string; email?: string }
type Produit = { id: string; nom: string; prix_base: number; unite: string }
type Entreprise = { nom: string; taux_tva: number; fne_point_of_sale?: string; fne_establishment?: string; rc?: string; ncc?: string; siege?: string; tel?: string } | null

export default function FacturesClient({ factures: initial, clients, produits, entreprise }: {
  factures: Facture[]; clients: Client[]; produits: Produit[]; entreprise: Entreprise
}) {
  const router = useRouter()
  const tva = entreprise?.taux_tva ?? 18
  const [factures, setFactures] = useState(initial)
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState('Toutes')
  const [modal, setModal] = useState<'create'|'edit'|'view'|'pay'|null>(null)
  const [sel, setSel] = useState<Facture | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getStatut = (f: Facture) => {
    const t = calculerTotaux(f.factures_lignes || [], f.remise, tva, f.tva_applicable)
    const paye = (f.paiements || []).reduce((s, p) => s + p.montant, 0)
    return statutPaiement(t.ttc, paye)
  }

  const filtered = useMemo(() => factures
    .filter(f => filtre === 'Toutes' || getStatut(f) === filtre)
    .filter(f => (f.numero + (f.clients?.nom || '')).toLowerCase().includes(q.toLowerCase())),
    [factures, q, filtre])

  const emptyForm: Partial<Facture> = {
    client_id: clients[0]?.id || '', date: today(), remise: 0,
    tva_applicable: true, notes: '', is_avoir: false,
    template_fne: 'B2B', payment_method_fne: 'cash',
    factures_lignes: [{ designation: '', qte: 1, pu: 0 }],
  }
  const [form, setForm] = useState<Partial<Facture>>(emptyForm)
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))
  const [payForm, setPayForm] = useState({ date: today(), montant: 0, mode: 'cash', reference: '' })

  const openCreate = () => { setError(''); setForm(emptyForm); setModal('create') }
  const openEdit = (f: Facture) => { setError(''); setSel(f); setForm({ ...f }); setModal('edit') }
  const openView = (f: Facture) => { setSel(f); setModal('view') }
  const openPay = (f: Facture) => {
    const t = calculerTotaux(f.factures_lignes || [], f.remise, tva, f.tva_applicable)
    const paye = (f.paiements || []).reduce((s, p) => s + p.montant, 0)
    setSel(f); setPayForm({ date: today(), montant: Math.max(0, t.ttc - paye), mode: 'cash', reference: '' }); setModal('pay')
  }

  const save = async () => {
    if (!form.client_id) { setError('Sélectionnez un client.'); return }
    setLoading(true); setError('')
    const sb = getSupabase()
    const { factures_lignes, clients: _c, paiements: _p, ...body } = form as Facture & { clients: unknown; paiements: unknown }

    if (sel?.id) {
      const { error: e } = await sb.from('factures').update(body).eq('id', sel.id)
      if (e) { setError(e.message); setLoading(false); return }
      await sb.from('factures_lignes').delete().eq('facture_id', sel.id)
      if (factures_lignes?.length) {
        await sb.from('factures_lignes').insert(factures_lignes.map((l: Ligne, i: number) => ({ ...l, facture_id: sel.id, taxes: ['TVA'], ordre: i })))
      }
      setFactures(prev => prev.map(f => f.id === sel.id ? { ...f, ...form, factures_lignes: factures_lignes || [] } as Facture : f))
    } else {
      const { data: num } = await sb.rpc('next_numero', { p_type: 'FA', p_annee: new Date().getFullYear() })
      const { data: created, error: e } = await sb.from('factures').insert({ ...body, numero: num }).select().single()
      if (e) { setError(e.message); setLoading(false); return }
      if (factures_lignes?.length) {
        await sb.from('factures_lignes').insert(factures_lignes.map((l: Ligne, i: number) => ({ ...l, facture_id: created.id, taxes: ['TVA'], ordre: i })))
      }
      const cNom = clients.find(c => c.id === form.client_id)?.nom || ''
      setFactures(prev => [{ ...created, factures_lignes: factures_lignes || [], paiements: [], clients: { nom: cNom } } as Facture, ...prev])
    }
    setLoading(false); setModal(null); setSel(null); router.refresh()
  }

  const savePay = async () => {
    if (!sel || !payForm.montant) return
    setLoading(true)
    const sb = getSupabase()
    const { data, error: e } = await sb.from('paiements').insert({ facture_id: sel.id, ...payForm }).select().single()
    if (e) { alert(e.message); setLoading(false); return }
    setFactures(prev => prev.map(f => f.id === sel.id ? { ...f, paiements: [...(f.paiements || []), data] } : f))
    setLoading(false); setModal(null); setSel(null); router.refresh()
  }

  const del = async (f: Facture) => {
    if (!confirm(`Supprimer ${f.numero} ?`)) return
    const sb = getSupabase()
    await sb.from('factures').delete().eq('id', f.id)
    setFactures(prev => prev.filter(x => x.id !== f.id)); router.refresh()
  }

  const certifier = async (f: Facture) => {
    if (f.fne_certifiee) { alert('Déjà certifiée FNE.'); return }
    setLoading(true)
    try {
      const client = clients.find(c => c.id === f.client_id)
      const payload = {
        invoiceType: f.is_avoir ? 'avoir' : 'sale',
        paymentMethod: f.payment_method_fne,
        template: f.template_fne,
        clientNcc: f.template_fne === 'B2B' ? client?.ncc : undefined,
        clientCompanyName: client?.nom || '',
        clientPhone: client?.telephone || '',
        pointOfSale: entreprise?.fne_point_of_sale || entreprise?.nom || '',
        establishment: entreprise?.fne_establishment || entreprise?.nom || '',
        items: (f.factures_lignes || []).map(l => ({ taxes: ['TVA'], description: l.designation, quantity: l.qte, amount: l.pu, measurementUnit: 'pcs' })),
        discount: f.remise || 0, isRne: false,
      }
      const res = await fetch('/api/fne/certifier', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const sb = getSupabase()
      await sb.from('factures').update({ fne_certifiee: true, fne_reference: data.reference, qr_code_url: data.qrCodeUrl }).eq('id', f.id)
      setFactures(prev => prev.map(x => x.id === f.id ? { ...x, fne_certifiee: true, fne_reference: data.reference } : x))
      alert(`✅ FNE certifiée — Réf: ${data.reference}`)
    } catch (err) { alert(`❌ Erreur FNE: ${err}`) }
    setLoading(false); router.refresh()
  }

  const FormContent = (
    <div>
      {error && <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Client *">
          <select style={inputStyle} value={form.client_id || ''} onChange={e => { const c = clients.find(x => x.id === e.target.value); setF('client_id', e.target.value); if (c) setF('template_fne', c.template_fne_defaut) }}>
            <option value="">— Sélectionner —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </Field>
        <Field label="Date"><input type="date" style={inputStyle} value={form.date || today()} onChange={e => setF('date', e.target.value)} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Échéance"><input type="date" style={inputStyle} value={form.echeance || ''} onChange={e => setF('echeance', e.target.value)} /></Field>
        <Field label="Template FNE">
          <select style={inputStyle} value={form.template_fne || 'B2B'} onChange={e => setF('template_fne', e.target.value)}>
            {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Mode paiement">
          <select style={inputStyle} value={form.payment_method_fne || 'cash'} onChange={e => setF('payment_method_fne', e.target.value)}>
            {MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ marginBottom: 14 }}>
        <LignesEditor lignes={form.factures_lignes || []} onChange={l => setF('factures_lignes', l)} produits={produits} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
        <Field label="Remise (FCFA)"><input type="number" min="0" style={inputStyle} value={form.remise || 0} onChange={e => setF('remise', Number(e.target.value))} /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, paddingTop: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.tva_applicable ?? true} onChange={e => setF('tva_applicable', e.target.checked)} />
          TVA ({tva}%)
        </label>
      </div>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} value={form.notes || ''} onChange={e => setF('notes', e.target.value)} /></Field>
      <TotauxBox lignes={form.factures_lignes || []} remise={form.remise || 0} tvaApplicable={form.tva_applicable ?? true} tauxTva={tva} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
        <BtnGhost onClick={() => { setModal(null); setSel(null) }}>Annuler</BtnGhost>
        <BtnPrimary onClick={save} disabled={loading}><Check size={16} />{loading ? 'Enregistrement…' : 'Enregistrer'}</BtnPrimary>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: 'linear-gradient(135deg,#1B3A5C,#2A5FA5)', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, color: '#fff' }}>
        <span style={{ fontSize: 22 }}>🏛️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Intégration FNE / DGI Côte d&apos;Ivoire</div>
          <div style={{ fontSize: 12, opacity: .8 }}>Certification via services.fne.dgi.gouv.ci — {factures.filter(f => f.fne_certifiee).length}/{factures.length} certifiées</div>
        </div>
      </div>
      <PageHeader
        title="Factures" subtitle={`${factures.length} factures`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher une facture…"
        onAdd={openCreate} addLabel="Nouvelle facture"
        extra={
          <select value={filtre} onChange={e => setFiltre(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '10px 14px' }}>
            {['Toutes','Impayée','Partiel','Payée'].map(s => <option key={s}>{s}</option>)}
          </select>
        }
      />
      <TableWrap minWidth={960}>
        <thead><tr>{['N°','Client','Date','TTC','Payé','Reste','FNE','Statut',''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {filtered.map(f => {
            const t = calculerTotaux(f.factures_lignes || [], f.remise, tva, f.tva_applicable)
            const paye = (f.paiements || []).reduce((s, p) => s + p.montant, 0)
            const reste = Math.max(0, t.ttc - paye)
            const statut = statutPaiement(t.ttc, paye)
            return (
              <tr key={f.id}>
                <td style={{ ...td, fontWeight: 700, color: '#C2117A' }}>{f.numero}</td>
                <td style={td}><div style={{ fontWeight: 600 }}>{f.clients?.nom || '—'}</div></td>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatDateFR(f.date)}</td>
                <td style={{ ...td, fontWeight: 700 }}>{formatFCFA(t.ttc)}</td>
                <td style={{ ...td, color: '#3A9A5C', fontWeight: 600 }}>{formatFCFA(paye)}</td>
                <td style={{ ...td, color: reste > 0 ? '#D14343' : '#3A9A5C', fontWeight: 600 }}>{formatFCFA(reste)}</td>
                <td style={td}>{f.fne_certifiee ? <span style={{ fontSize: 11, fontWeight: 600, color: '#3A9A5C', background: '#E8F7EE', padding: '2px 8px', borderRadius: 6 }}>✓</span> : <span style={{ fontSize: 11, color: '#7A736C' }}>—</span>}</td>
                <td style={td}><Badge value={statut} /></td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {statut !== 'Payée' && <BtnIcon onClick={() => openPay(f)}><Wallet size={16} /></BtnIcon>}
                  <BtnIcon onClick={() => openView(f)}><Eye size={16} /></BtnIcon>
                  <BtnIcon onClick={() => openEdit(f)}><Pencil size={16} /></BtnIcon>
                  {!f.fne_certifiee && <BtnIcon onClick={() => certifier(f)}><QrCode size={16} /></BtnIcon>}
                  <BtnIcon onClick={() => del(f)} danger><Trash2 size={16} /></BtnIcon>
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && <EmptyRow text="Aucune facture." cols={9} />}
        </tbody>
      </TableWrap>

      {modal === 'create' && <Modal title="Nouvelle facture" onClose={() => { setModal(null); setError('') }} wide>{FormContent}</Modal>}
      {modal === 'edit' && sel && <Modal title={`Modifier — ${sel.numero}`} onClose={() => { setModal(null); setSel(null); setError('') }} wide>{FormContent}</Modal>}

      {modal === 'pay' && sel && (
        <Modal title={`Encaisser — ${sel.numero}`} onClose={() => { setModal(null); setSel(null) }}>
          {(() => {
            const t = calculerTotaux(sel.factures_lignes || [], sel.remise, tva, sel.tva_applicable)
            const paye = (sel.paiements || []).reduce((s, p) => s + p.montant, 0)
            return (
              <div>
                <div style={{ background: '#F6F4F1', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 14 }}>
                  Total : <strong>{formatFCFA(t.ttc)}</strong> · Déjà payé : <strong style={{ color: '#3A9A5C' }}>{formatFCFA(paye)}</strong> · Reste : <strong style={{ color: '#D14343' }}>{formatFCFA(Math.max(0, t.ttc - paye))}</strong>
                </div>
                <Field label="Date"><input type="date" style={inputStyle} value={payForm.date} onChange={e => setPayForm(p => ({ ...p, date: e.target.value }))} /></Field>
                <Field label="Montant (FCFA)"><input type="number" min="0" style={inputStyle} value={payForm.montant} onChange={e => setPayForm(p => ({ ...p, montant: Number(e.target.value) }))} /></Field>
                <Field label="Mode">
                  <select style={inputStyle} value={payForm.mode} onChange={e => setPayForm(p => ({ ...p, mode: e.target.value }))}>
                    {MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Référence"><input style={inputStyle} value={payForm.reference} onChange={e => setPayForm(p => ({ ...p, reference: e.target.value }))} placeholder="N° transaction (optionnel)" /></Field>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <BtnGhost onClick={() => { setModal(null); setSel(null) }}>Annuler</BtnGhost>
                  <BtnPrimary onClick={savePay} disabled={loading || !payForm.montant}><Wallet size={16} />{loading ? '…' : 'Enregistrer'}</BtnPrimary>
                </div>
              </div>
            )
          })()}
        </Modal>
      )}

      {modal === 'view' && sel && (
        <Modal title={`Facture ${sel.numero}`} onClose={() => { setModal(null); setSel(null) }} wide>
          {sel.fne_certifiee && (
            <div style={{ background: '#E8F7EE', border: '1px solid #3A9A5C', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
              ✅ <strong>Certifiée FNE</strong> — {sel.fne_reference}
              {sel.qr_code_url && <a href={sel.qr_code_url} target="_blank" rel="noreferrer" style={{ marginLeft: 12, color: '#2A5FA5', fontSize: 12 }}>Vérifier ↗</a>}
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#F6F4F1' }}>
              <th style={th}>Désignation</th><th style={{ ...th, textAlign: 'right' }}>Qté</th>
              <th style={{ ...th, textAlign: 'right' }}>P.U.</th><th style={{ ...th, textAlign: 'right' }}>Total</th>
            </tr></thead>
            <tbody>
              {(sel.factures_lignes || []).map((l, i) => (
                <tr key={i}>
                  <td style={td}>{l.designation}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{l.qte}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{formatFCFA(l.pu)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{formatFCFA(l.qte * l.pu)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <TotauxBox lignes={sel.factures_lignes || []} remise={sel.remise} tvaApplicable={sel.tva_applicable} tauxTva={tva} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            {!sel.fne_certifiee && <BtnGhost onClick={() => certifier(sel)} disabled={loading}><QrCode size={16} /> Certifier FNE</BtnGhost>}
            <BtnGhost onClick={() => window.print()}><Printer size={16} /> Imprimer</BtnGhost>
          </div>
        </Modal>
      )}
    </div>
  )
}
