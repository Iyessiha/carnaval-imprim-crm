'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/any'
import { formatFCFA, formatDateFR, today } from '@/lib/utils'
import { FREQUENCES, montantMensuel, echeanceSuivante } from '@/lib/charges'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import { Check, Pencil, Trash2, ToggleLeft, ToggleRight, CalendarCheck } from 'lucide-react'

const CATEGORIES = ['Charges générales', 'Loyer', 'Énergie & eau', 'Télécom', 'Salaires', 'Assurance', 'Transport', 'Autre']

type Charge = {
  id: string; libelle: string; montant: number; frequence: string
  categorie: string; actif: boolean; prochaine_echeance: string | null
}
type Form = { libelle: string; montant: number | string; frequence: string; categorie: string; prochaine_echeance: string; actif: boolean }
const emptyForm = (): Form => ({ libelle: '', montant: '', frequence: 'mensuelle', categorie: 'Charges générales', prochaine_echeance: '', actif: true })

export default function ChargesClient({ charges: initial }: { charges: Charge[] }) {
  const router = useRouter()
  const [charges, setCharges] = useState(initial)
  useEffect(() => { setCharges(initial) }, [initial])
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [sel, setSel] = useState<Charge | null>(null)
  const [form, setForm] = useState<Form>(emptyForm())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setF = (k: keyof Form, v: string | number | boolean) => setForm(p => ({ ...p, [k]: v }))

  const filtered = useMemo(() => charges.filter(c => (c.libelle + c.categorie).toLowerCase().includes(q.toLowerCase())), [charges, q])
  const actives = charges.filter(c => c.actif)
  const totalMois = actives.reduce((s, c) => s + montantMensuel(c.montant, c.frequence), 0)
  const enRetard = actives.filter(c => c.prochaine_echeance && c.prochaine_echeance < today()).length

  const close = () => { setModal(null); setSel(null); setError('') }

  const save = async () => {
    if (!form.libelle.trim()) { setError('Le libellé est obligatoire.'); return }
    const montant = Number(form.montant)
    if (!(montant > 0)) { setError('Le montant doit être supérieur à 0.'); return }
    setLoading(true); setError('')
    const sb = getSupabase()
    const body = {
      libelle: form.libelle.trim(), montant, frequence: form.frequence, categorie: form.categorie,
      prochaine_echeance: form.prochaine_echeance || null, actif: form.actif,
    }
    const { error: e } = sel
      ? await sb.from('charges_fixes').update(body).eq('id', sel.id)
      : await sb.from('charges_fixes').insert(body)
    setLoading(false)
    if (e) { setError(e.message); return }
    close(); router.refresh()
  }

  const toggleActif = async (c: Charge) => {
    const { error: e } = await getSupabase().from('charges_fixes').update({ actif: !c.actif }).eq('id', c.id)
    if (e) { alert(e.message); return }
    setCharges(prev => prev.map(x => x.id === c.id ? { ...x, actif: !x.actif } : x)); router.refresh()
  }

  // Charge payée → on passe à l'échéance suivante
  const avancer = async (c: Charge) => {
    const next = echeanceSuivante(c.prochaine_echeance, c.frequence)
    if (!confirm(`« ${c.libelle} » réglée ? Prochaine échéance : ${formatDateFR(next)}`)) return
    const { error: e } = await getSupabase().from('charges_fixes').update({ prochaine_echeance: next }).eq('id', c.id)
    if (e) { alert(e.message); return }
    setCharges(prev => prev.map(x => x.id === c.id ? { ...x, prochaine_echeance: next } : x)); router.refresh()
  }

  const del = async (c: Charge) => {
    if (!confirm(`Supprimer « ${c.libelle} » ?\n(Astuce : désactivez-la pour la conserver sans la compter.)`)) return
    const { error: e } = await getSupabase().from('charges_fixes').delete().eq('id', c.id)
    if (e) { alert('Suppression impossible (réservée aux administrateurs) : ' + e.message); return }
    setCharges(prev => prev.filter(x => x.id !== c.id)); router.refresh()
  }

  const FormContent = (
    <div>
      {error && <div style={{ background: '#fde8e8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
      <Field label="Libellé *">
        <input style={inputStyle} value={form.libelle} onChange={e => setF('libelle', e.target.value)} placeholder="Ex : Loyer local Cocody-Blockhauss" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Montant (FCFA) *">
          <input type="number" min="0" style={inputStyle} value={form.montant} onChange={e => setF('montant', e.target.value)} />
        </Field>
        <Field label="Fréquence">
          <select style={inputStyle} value={form.frequence} onChange={e => setF('frequence', e.target.value)}>
            {FREQUENCES.map(f => <option key={f}>{f}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Catégorie">
          <select style={inputStyle} value={form.categorie} onChange={e => setF('categorie', e.target.value)}>
            {(CATEGORIES.includes(form.categorie) ? CATEGORIES : [form.categorie, ...CATEGORIES]).map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Prochaine échéance">
          <input type="date" style={inputStyle} value={form.prochaine_echeance} onChange={e => setF('prochaine_echeance', e.target.value)} />
        </Field>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', marginBottom: 14 }}>
        <input type="checkbox" checked={form.actif} onChange={e => setF('actif', e.target.checked)} />
        Charge active (comptée dans le total mensuel)
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <BtnGhost onClick={close}>Annuler</BtnGhost>
        <BtnPrimary onClick={save} disabled={loading}><Check size={16} />{loading ? '…' : 'Enregistrer'}</BtnPrimary>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Charges fixes"
        subtitle={`${actives.length} actives · total ${formatFCFA(Math.round(totalMois))} / mois${enRetard ? ` · ${enRetard} échéance(s) dépassée(s)` : ''}`}
        q={q} setQ={setQ} searchPlaceholder="Rechercher une charge…"
        onAdd={() => { setSel(null); setError(''); setForm(emptyForm()); setModal('create') }} addLabel="Nouvelle charge"
      />

      <TableWrap minWidth={820}>
        <thead><tr>
          {['Charge', 'Catégorie', 'Fréquence', 'Montant', 'Équiv. / mois', 'Échéance', 'Statut', ''].map(h => <th key={h} style={th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map(c => {
            const retard = c.actif && c.prochaine_echeance && c.prochaine_echeance < today()
            return (
              <tr key={c.id} style={{ opacity: c.actif ? 1 : .55 }}>
                <td style={{ ...td, fontWeight: 600 }}>{c.libelle}</td>
                <td style={{ ...td, fontSize: 12, color: '#7A736C' }}>{c.categorie}</td>
                <td style={{ ...td, fontSize: 12 }}>{c.frequence}</td>
                <td style={{ ...td, fontWeight: 700 }}>{formatFCFA(c.montant)}</td>
                <td style={{ ...td, fontSize: 12, color: '#7A736C' }}>{c.frequence === 'mensuelle' ? '—' : formatFCFA(Math.round(montantMensuel(c.montant, c.frequence)))}</td>
                <td style={{ ...td, fontSize: 12, whiteSpace: 'nowrap', color: retard ? '#D14343' : undefined, fontWeight: retard ? 700 : 400 }}>
                  {c.prochaine_echeance ? <>{retard ? '⚠️ ' : ''}{formatDateFR(c.prochaine_echeance)}</> : '—'}
                </td>
                <td style={td}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                    background: c.actif ? '#E8F7EE' : '#F0EEEC', color: c.actif ? '#3A9A5C' : '#7A736C' }}>
                    {c.actif ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {c.actif && <BtnIcon onClick={() => avancer(c)} title="Réglée → échéance suivante"><CalendarCheck size={16} style={{ color: '#2A5FA5' }} /></BtnIcon>}
                  <BtnIcon onClick={() => toggleActif(c)} title={c.actif ? 'Désactiver' : 'Activer'}>
                    {c.actif ? <ToggleRight size={18} style={{ color: '#3A9A5C' }} /> : <ToggleLeft size={18} />}
                  </BtnIcon>
                  <BtnIcon onClick={() => {
                    setSel(c); setError('')
                    setForm({ libelle: c.libelle, montant: c.montant, frequence: c.frequence, categorie: c.categorie, prochaine_echeance: c.prochaine_echeance || '', actif: c.actif })
                    setModal('edit')
                  }}><Pencil size={16} /></BtnIcon>
                  <BtnIcon onClick={() => del(c)} danger><Trash2 size={16} /></BtnIcon>
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && <EmptyRow text="Aucune charge fixe. Cliquez sur « Nouvelle charge »." cols={8} />}
        </tbody>
      </TableWrap>

      {modal === 'create' && <Modal title="Nouvelle charge fixe" onClose={close} wide>{FormContent}</Modal>}
      {modal === 'edit' && sel && <Modal title={`Modifier — ${sel.libelle}`} onClose={close} wide>{FormContent}</Modal>}
    </div>
  )
}
