'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatFCFA, formatDateFR, calculerTotaux, today } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import LignesEditor, { type Ligne } from '@/components/ui/LignesEditor'
import TotauxBox from '@/components/ui/TotauxBox'
import { Eye, Pencil, Trash2, Receipt, Check, Printer } from 'lucide-react'

const STATUTS = ['Brouillon', 'Envoyé', 'Accepté', 'Refusé'] as const

type Devis = {
  id: string; numero: string; client_id: string; date: string
  validite?: string; statut: string; remise: number; tva_applicable: boolean
  notes?: string; devis_lignes: Ligne[]
  clients: { nom: string; ncc?: string; telephone?: string; email?: string; adresse?: string } | null
}
type Client = { id: string; nom: string; ncc?: string; template_fne_defaut: string; telephone?: string; email?: string; adresse?: string }
type Produit = { id: string; nom: string; prix_base: number; unite: string }

export default function DevisClient({ devis: initial, clients, produits, tauxTva }: {
  devis: Devis[]; clients: Client[]; produits: Produit[]; tauxTva: number
}) {
  const router = useRouter()
  const supabase = createClient()
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

  const emptyForm = {
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
    const { devis_lignes, clients: _c, ...body } = form as Devis & { clients: unknown }

    if (sel?.id) {
      const { error: e } = await supabase.from('devis').update(body).eq('id', sel.id)
      if (e) { setError(e.message); setLoading(false); return }
      await supabase.from('devis_lignes').delete().eq('devis_id', sel.id)
      if (devis_lignes?.length) {
        await supabase.from('devis_lignes').insert(
          devis_lignes.map((l, i) => ({ ...l, devis_id: sel.id, ordre: i }))
        )
      }
      const clientInfo = clients.find(c => c.id === form.client_id)
      setDevis(prev => prev.map(d => d.id === sel.id ? {
        ...d, ...form, devis_lignes: devis_lignes || [],
        clients: clientInfo ? { nom: clientInfo.nom } : d.clients
      } as Devis : d))
    } else {
      const annee = new Date().getFullYear()
      const { data: num } = await supabase.rpc('next_numero', { p_type: 'DV', p_annee: annee })
      const { data: created, error: e } = await supabase.from('devis')
        .insert({ ...body, numero: num }).select().single()
      if (e) { setError(e.message); setLoading(false); return }
      if (devis_lignes?.length) {
        await supabase.from('devis_lignes').insert(
          devis_lignes.map((l, i) => ({ ...l, devis_id: created.id, ordre: i }))
        )
      }
      const clientInfo = clients.find(c => c.id === form.client_id)
      setDevis(prev => [{ ...created, devis_lignes: devis_lignes || [],
        clients: clientInfo ? { nom: clientInfo.nom } : null }, ...prev])
    }
    setLoading(false); setModal(null); setSel(null); router.refresh()
  }

  const del = async (d: Devis) => {
    if (!confirm(`Supprimer le devis ${d.numero} ?`)) return
    await supabase.from('devis').delete().eq('id', d.id)
    setDevis(prev => prev.filter(x => x.id !== d.id))
    router.refresh()
  }

  const toFacture = async (d: Devis) => {
    if (!confirm(`Convertir ${d.numero} en facture ?`)) return
    setLoading(true)
    const annee = new Date().getFullYear()
    const { data: num } = await supabase.rpc('next_numero', { p_type: 'FA', p_annee: annee })
    const client = clients.find(c => c.id === d.client_id)
    const { data: facture, error: e } = await supabase.from('factures').insert({
      numero: num, client_id: d.client_id, devis_id: d.id, date: today(),
      remise: d.remise, tva_applicable: d.tva_applicable, notes: d.notes,
      template_fne: client?.template_fne_defaut || 'B2B', payment_method_fne: 'cash',
    }).select().single()
    if (e) { alert(e.message); setLoading(false); return }
    if (d.devis_lignes?.length) {
      await supabase.from('factures_lignes').insert(
        d.devis_lignes.map((l, i) => ({ ...l, facture_id: facture.id, taxes: ['TVA'], ordre: i }))
      )
    }
    await supabase.from('devis').update({ statut: 'Accepté' }).eq('id', d.id)
    setDevis(prev => prev.map(x => x.id === d.id ? { ...x, statut: 'Accepté' } : x))
    setLoading(false); setModal(null)
    alert(`✅ Facture ${num} créée avec succès !`)
    router.refresh()
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
        <Field label="Date">
          <input type="date" style={inputStyle} value={form.date || today()} onChange={e => setF('date', e.target.value)} />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Validité (jusqu'au)">
          <input type="date" style={inputStyle} value={form.validite || ''} onChange={e => setF('validite', e.target.value)} />
        </Field>
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
        <Field label="Remise globale (FCFA)">
          <input type="number" min="0" style={inputStyle} value={form.remise || 0} onChange={e => setF('remise', Number(e.target.value))} />
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, paddingTop: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.tva_applicable ?? true} onChange={e => setF('tva_applicable', e.target.checked)} />
          Appliquer TVA ({tauxTva}%)
        </label>
      </div>
      <Field label="Notes / conditions particulières">
        <textarea style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} value={form.notes || ''} onChange={e => setF('notes', e.target.value)} />
      </Field>
      <TotauxBox lignes={form.devis_lignes || []} remise={form.remise || 0} tvaApplicable={form.tva_applicable ?? true} tauxTva={tauxTva} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
        <BtnGhost onClick={() => { setModal(null); setSel(null) }}>Annuler</BtnGhost>
        <BtnPrimary onClick={save} disabled={loading}>
          <Check size={16} />{loading ? 'Enregistrement…' : 'Enregistrer'}
        </BtnPrimary>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Devis"
        subtitle={`${devis.length} devis · ${devis.filter(d => d.statut === 'Envoyé').length} en attente de réponse`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher un devis…"
        onAdd={openCreate} addLabel="Nouveau devis"
        extra={
          <select value={filtre} onChange={e => setFiltre(e.target.value)}
            style={{ ...inputStyle, width: 'auto', padding: '10px 14px' }}>
            {['Tous', ...STATUTS].map(s => <option key={s}>{s}</option>)}
          </select>
        }
      />

      <TableWrap minWidth={820}>
        <thead><tr>
          {['N°', 'Client', 'Date', 'Validité', 'Montant TTC', 'Statut', ''].map(h => <th key={h} style={th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map(d => {
            const t = calculerTotaux(d.devis_lignes || [], d.remise, tauxTva, d.tva_applicable)
            const expire = d.validite && new Date(d.validite) < new Date()
            return (
              <tr key={d.id}>
                <td style={{ ...td, fontWeight: 700, color: '#C2117A' }}>{d.numero}</td>
                <td style={td}><div style={{ fontWeight: 600 }}>{d.clients?.nom || '—'}</div></td>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatDateFR(d.date)}</td>
                <td style={{ ...td, whiteSpace: 'nowrap', color: expire ? '#D14343' : '#7A736C', fontWeight: expire ? 600 : 400 }}>
                  {d.validite ? formatDateFR(d.validite) : '—'}{expire ? ' ⚠️' : ''}
                </td>
                <td style={{ ...td, fontWeight: 700 }}>{formatFCFA(t.ttc)}</td>
                <td style={td}><Badge value={d.statut} /></td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <BtnIcon onClick={() => openView(d)} title="Aperçu"><Eye size={16} /></BtnIcon>
                  <BtnIcon onClick={() => openEdit(d)} title="Modifier"><Pencil size={16} /></BtnIcon>
                  {d.statut !== 'Accepté' && d.statut !== 'Refusé' && (
                    <BtnIcon onClick={() => toFacture(d)} title="Convertir en facture" ><Receipt size={16} /></BtnIcon>
                  )}
                  <BtnIcon onClick={() => del(d)} danger title="Supprimer"><Trash2 size={16} /></BtnIcon>
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && <EmptyRow text={q ? `Aucun résultat pour "${q}"` : 'Aucun devis.'} cols={7} />}
        </tbody>
      </TableWrap>

      {modal === 'create' && <Modal title="Nouveau devis" onClose={() => { setModal(null); setError('') }} wide>{FormContent}</Modal>}
      {modal === 'edit' && sel && <Modal title={`Modifier — ${sel.numero}`} onClose={() => { setModal(null); setSel(null); setError('') }} wide>{FormContent}</Modal>}

      {modal === 'view' && sel && (
        <Modal title={`Devis ${sel.numero}`} onClose={() => { setModal(null); setSel(null) }} wide>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{sel.clients?.nom}</div>
              {sel.clients?.telephone && <div style={{ fontSize: 13, color: '#7A736C' }}>📞 {sel.clients.telephone}</div>}
              {sel.clients?.email && <div style={{ fontSize: 13, color: '#7A736C' }}>✉️ {sel.clients.email}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#7A736C' }}>Date : <strong>{formatDateFR(sel.date)}</strong></div>
              {sel.validite && <div style={{ fontSize: 13, color: '#7A736C' }}>Validité : <strong>{formatDateFR(sel.validite)}</strong></div>}
              <div style={{ marginTop: 6 }}><Badge value={sel.statut} /></div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
            <thead><tr style={{ background: '#F6F4F1' }}>
              <th style={th}>Désignation</th>
              <th style={{ ...th, textAlign: 'right' }}>Qté</th>
              <th style={{ ...th, textAlign: 'right' }}>P.U. HT</th>
              <th style={{ ...th, textAlign: 'right' }}>Montant HT</th>
            </tr></thead>
            <tbody>
              {(sel.devis_lignes || []).map((l, i) => (
                <tr key={i}>
                  <td style={td}>{l.designation}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{l.qte}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{formatFCFA(l.pu)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{formatFCFA(l.qte * l.pu)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <TotauxBox lignes={sel.devis_lignes || []} remise={sel.remise} tvaApplicable={sel.tva_applicable} tauxTva={tauxTva} />

          {sel.notes && <div style={{ marginTop: 14, fontSize: 13, color: '#7A736C', background: '#F6F4F1', padding: '10px 14px', borderRadius: 10 }}>
            <strong>Notes :</strong> {sel.notes}
          </div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <BtnGhost onClick={() => window.print()}><Printer size={16} /> Imprimer</BtnGhost>
            {sel.statut !== 'Accepté' && sel.statut !== 'Refusé' && (
              <BtnPrimary onClick={() => toFacture(sel)} disabled={loading}>
                <Receipt size={16} /> Convertir en facture
              </BtnPrimary>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
