'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/any'
import { formatFCFA, formatDateFR, today } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import { Check, Pencil, Trash2, Eye, Plus, X, Printer } from 'lucide-react'

const STATUTS = ['En cours', 'Reçu', 'Annulé'] as const

type Ligne = { id?: string; designation: string; qte: number; pu: number; unite: string; tva?: number }
type Bon = {
  id: string; numero: string; fournisseur_id: string; date: string; statut: string; notes?: string
  bons_commande_lignes: Ligne[]
  fournisseurs: { nom: string } | null
}
type Fournisseur = { id: string; nom: string }

export default function BonsClient({ bons: initial, fournisseurs, tauxTva = 18 }: { bons: Bon[]; fournisseurs: Fournisseur[]; tauxTva?: number }) {
  const router = useRouter()
  const [bons, setBons] = useState(initial)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'create'|'edit'|'view'|null>(null)
  const [sel, setSel] = useState<Bon | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(() => bons.filter(b => (b.numero + (b.fournisseurs?.nom||'')).toLowerCase().includes(q.toLowerCase())), [bons, q])

  const emptyForm = { fournisseur_id: fournisseurs[0]?.id||'', date: today(), statut: 'En cours', notes: '', lignes: [{ designation:'', qte:1, pu:0, unite:'unité' }] }
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)

  const totalBon = (lignes: Ligne[]) => lignes.reduce((s, l) => s + l.qte * l.pu, 0)

  const save = async () => {
    if (!form.fournisseur_id) { setError('Sélectionnez un fournisseur.'); return }
    setLoading(true); setError('')
    const sb = getSupabase()
    const body = { fournisseur_id: form.fournisseur_id, date: form.date, statut: form.statut, notes: form.notes||null }
    if (sel?.id) {
      const { error: e } = await sb.from('bons_commande_fournisseurs').update(body).eq('id', sel.id)
      if (e) { setError(e.message); setLoading(false); return }
      await sb.from('bons_commande_lignes').delete().eq('bon_commande_fournisseur_id', sel.id)
      if (form.lignes.length) await sb.from('bons_commande_lignes').insert(form.lignes.filter(l => l.designation).map((l, i) => ({ ...l, bon_commande_fournisseur_id: sel.id, ordre: i })))
      const fNom = fournisseurs.find(f => f.id === form.fournisseur_id)?.nom || ''
      setBons(prev => prev.map(b => b.id === sel.id ? { ...b, ...body, bons_commande_lignes: form.lignes, fournisseurs: { nom: fNom } } : b))
    } else {
      const { data: num } = await sb.rpc('next_numero', { p_type: 'BC', p_annee: new Date().getFullYear() })
      const { data: created, error: e } = await sb.from('bons_commande_fournisseurs').insert({ ...body, numero: num }).select().single()
      if (e) { setError(e.message); setLoading(false); return }
      if (form.lignes.length) await sb.from('bons_commande_lignes').insert(form.lignes.filter(l => l.designation).map((l, i) => ({ ...l, bon_commande_fournisseur_id: created.id, ordre: i })))
      const fNom = fournisseurs.find(f => f.id === form.fournisseur_id)?.nom || ''
      setBons(prev => [{ ...created, bons_commande_lignes: form.lignes, fournisseurs: { nom: fNom } }, ...prev])
    }
    setLoading(false); setModal(null); setSel(null); router.refresh()
  }

  const del = async (b: Bon) => {
    if (!confirm(`Supprimer ${b.numero} ?`)) return
    const sb = getSupabase()
    await sb.from('bons_commande_fournisseurs').delete().eq('id', b.id)
    setBons(prev => prev.filter(x => x.id !== b.id)); router.refresh()
  }

  const updateStatut = async (b: Bon, statut: string) => {
    const sb = getSupabase()
    await sb.from('bons_commande_fournisseurs').update({ statut }).eq('id', b.id)
    setBons(prev => prev.map(x => x.id === b.id ? { ...x, statut } : x)); router.refresh()
  }

  const setLigne = (i: number, k: keyof Ligne, v: string|number) =>
    setForm(p => ({ ...p, lignes: p.lignes.map((l, j) => j === i ? { ...l, [k]: v } : l) }))
  const addLigne = () => setForm(p => ({ ...p, lignes: [...p.lignes, { designation:'', qte:1, pu:0, unite:'unité' }] }))
  const delLigne = (i: number) => setForm(p => ({ ...p, lignes: p.lignes.filter((_, j) => j !== i) }))

  const imprimer = (b: Bon) => {
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>BC ${b.numero}</title>
<style>body{font-family:Arial,sans-serif;font-size:13px;padding:32px} .logo{font-size:20px;font-weight:900} .logo span{color:#C2117A}
table{width:100%;border-collapse:collapse;margin:16px 0} th{background:#1B1A1C;color:#fff;padding:8px 12px;text-align:left;font-size:11px}
td{padding:8px 12px;border-bottom:1px solid #eee} .total{font-size:16px;font-weight:900;color:#C2117A;text-align:right;margin-top:8px}
.footer{margin-top:32px;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:12px}</style></head><body>
<div style="display:flex;justify-content:space-between;margin-bottom:32px">
  <div><div class="logo">CARNAVAL<span>IMPRIM</span></div></div>
  <div style="text-align:right;font-size:11px;color:#888">Abidjan, le ${new Date().toLocaleDateString('fr-FR')}</div>
</div>
<h2 style="color:#1B1A1C;border-bottom:2px solid #C2117A;padding-bottom:8px">BON DE COMMANDE N° ${b.numero}</h2>
<p style="margin-bottom:16px"><strong>Fournisseur :</strong> ${b.fournisseurs?.nom || '—'} &nbsp;&nbsp; <strong>Date :</strong> ${formatDateFR(b.date)}</p>
<table><thead><tr><th>#</th><th>Désignation</th><th>Qté</th><th>Unité</th><th>P.U.</th><th style="text-align:right">Total</th></tr></thead>
<tbody>${(b.bons_commande_lignes||[]).map((l,i) => `<tr><td style="color:#888">${i+1}</td><td>${l.designation}</td><td>${l.qte}</td><td>${l.unite||'unité'}</td><td>${formatFCFA(l.pu)}</td><td style="text-align:right;font-weight:700">${formatFCFA(l.qte*l.pu)}</td></tr>`).join('')}</tbody></table>
<div class="total">Total : ${formatFCFA(totalBon(b.bons_commande_lignes||[]))}</div>
${b.notes ? `<p style="margin-top:16px;background:#F6F4F1;padding:10px;border-radius:4px"><strong>Notes :</strong> ${b.notes}</p>` : ''}
<div style="display:flex;justify-content:space-between;margin-top:40px">
  <div><p>Signature acheteur :</p><div style="border-bottom:1px solid #000;width:200px;margin-top:32px"></div></div>
  <div><p>Signature fournisseur :</p><div style="border-bottom:1px solid #000;width:200px;margin-top:32px"></div></div>
</div>
<div class="footer">CARNAVAL IMPRIM — Document généré le ${new Date().toLocaleDateString('fr-FR')}</div>
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400) }
  }

  const openCreate = () => { setError(''); setForm(emptyForm); setModal('create') }
  const openEdit = (b: Bon) => {
    setError(); setSel(b)
    setForm({ fournisseur_id: b.fournisseur_id, date: b.date, statut: b.statut, notes: b.notes||'', lignes: b.bons_commande_lignes?.length ? b.bons_commande_lignes : [{ designation:'', qte:1, pu:0, unite:'unité' }] })
    setModal('edit')
  }

  const FormContent = (
    <div>
      {error && <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Fournisseur *">
          <select style={inputStyle} value={form.fournisseur_id} onChange={e => setForm(p => ({ ...p, fournisseur_id: e.target.value }))}>
            <option value="">— Sélectionner —</option>
            {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        </Field>
        <Field label="Date"><input type="date" style={inputStyle} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></Field>
        <Field label="Statut">
          <select style={inputStyle} value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}>
            {STATUTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      {/* Lignes */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#7A736C', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.3px' }}>Articles commandés</label>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 60px 110px 80px 28px', gap: 6, marginBottom: 6 }}>
          {['Désignation','Qté','P.U. (FCFA)','Unité',''].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#7A736C' }}>{h}</span>)}
        </div>
        {form.lignes.map((l, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 60px 110px 80px 28px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
            <input style={{ ...inputStyle, padding: '8px 10px' }} value={l.designation} onChange={e => setLigne(i, 'designation', e.target.value)} placeholder="Désignation" />
            <input type="number" min="0" style={{ ...inputStyle, padding: '8px 6px', textAlign: 'center' }} value={l.qte} onChange={e => setLigne(i, 'qte', Number(e.target.value))} />
            <input type="number" min="0" style={{ ...inputStyle, padding: '8px 6px', textAlign: 'right' }} value={l.pu} onChange={e => setLigne(i, 'pu', Number(e.target.value))} />
            <input style={{ ...inputStyle, padding: '8px 6px' }} value={l.unite} onChange={e => setLigne(i, 'unite', e.target.value)} placeholder="unité" />
            <button onClick={() => delLigne(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D14343', padding: 4, display: 'flex' }}><X size={16} /></button>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <button onClick={addLigne} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E4DDD6', padding: '7px 12px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#1B1A1C' }}>
            <Plus size={14} /> Ajouter une ligne
          </button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Total : {formatFCFA(totalBon(form.lignes))}</span>
        </div>
      </div>

      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <BtnGhost onClick={() => { setModal(null); setSel(null) }}>Annuler</BtnGhost>
        <BtnPrimary onClick={save} disabled={loading}><Check size={16} />{loading ? '…' : 'Enregistrer'}</BtnPrimary>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Bons de commande fournisseurs"
        subtitle={`${bons.length} bon${bons.length > 1 ? 's' : ''} · ${bons.filter(b => b.statut === 'En cours').length} en cours`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher un bon…"
        onAdd={openCreate} addLabel="Nouveau bon"
      />

      <TableWrap minWidth={780}>
        <thead><tr>{['N°','Fournisseur','Date','Articles','Montant','Statut',''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {filtered.map(b => (
            <tr key={b.id}>
              <td style={{ ...td, fontWeight: 700, color: '#C2117A' }}>{b.numero}</td>
              <td style={td}><div style={{ fontWeight: 600 }}>{b.fournisseurs?.nom || '—'}</div></td>
              <td style={{ ...td, whiteSpace: 'nowrap', fontSize: 12 }}>{formatDateFR(b.date)}</td>
              <td style={{ ...td, fontSize: 12, color: '#7A736C' }}>{b.bons_commande_lignes?.length || 0} article{(b.bons_commande_lignes?.length||0) > 1 ? 's' : ''}</td>
              <td style={{ ...td, fontWeight: 700 }}>{formatFCFA(totalBon(b.bons_commande_lignes||[]))}</td>
              <td style={td}>
                <select value={b.statut} onChange={e => updateStatut(b, e.target.value)}
                  style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 8, border: '1px solid #E4DDD6', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}>
                  {STATUTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <BtnIcon onClick={() => imprimer(b)} title="Imprimer"><Printer size={16} /></BtnIcon>
                <BtnIcon onClick={() => { setSel(b); setModal('view') }} title="Voir"><Eye size={16} /></BtnIcon>
                <BtnIcon onClick={() => openEdit(b)} title="Modifier"><Pencil size={16} /></BtnIcon>
                <BtnIcon onClick={() => del(b)} danger><Trash2 size={16} /></BtnIcon>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <EmptyRow text="Aucun bon de commande." cols={7} />}
        </tbody>
      </TableWrap>

      {modal === 'create' && <Modal title="Nouveau bon de commande" onClose={() => { setModal(null); setError('') }} wide>{FormContent}</Modal>}
      {modal === 'edit' && sel && <Modal title={`Modifier — ${sel.numero}`} onClose={() => { setModal(null); setSel(null); setError('') }} wide>{FormContent}</Modal>}

      {modal === 'view' && sel && (
        <Modal title={`Bon ${sel.numero}`} onClose={() => { setModal(null); setSel(null) }} wide>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div><div style={{ fontWeight: 700, fontSize: 15 }}>{sel.fournisseurs?.nom}</div>
            <div style={{ fontSize: 13, color: '#7A736C', marginTop: 4 }}>{formatDateFR(sel.date)} · <Badge value={sel.statut} /></div></div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 14 }}>
            <thead><tr style={{ background: '#F6F4F1' }}>
              <th style={th}>Désignation</th><th style={{ ...th, textAlign: 'right' }}>Qté</th>
              <th style={{ ...th }}>Unité</th><th style={{ ...th, textAlign: 'right' }}>P.U.</th><th style={{ ...th, textAlign: 'right' }}>Total</th>
            </tr></thead>
            <tbody>
              {(sel.bons_commande_lignes||[]).map((l, i) => (
                <tr key={i}>
                  <td style={td}>{l.designation}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{l.qte}</td>
                  <td style={td}>{l.unite||'unité'}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{formatFCFA(l.pu)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{formatFCFA(l.qte * l.pu)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, color: '#C2117A', marginBottom: 14 }}>Total : {formatFCFA(totalBon(sel.bons_commande_lignes||[]))}</div>
          {sel.notes && <div style={{ background: '#F6F4F1', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}><strong>Notes :</strong> {sel.notes}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <BtnGhost onClick={() => imprimer(sel)}><Printer size={16} /> Imprimer</BtnGhost>
          </div>
        </Modal>
      )}
    </div>
  )
}
