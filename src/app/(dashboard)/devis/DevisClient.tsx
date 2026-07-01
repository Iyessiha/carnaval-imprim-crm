'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatFCFA, formatDateFR, calculerTotaux, today } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, X, Check, Eye, Receipt, ArrowRight } from 'lucide-react'

type Client = { id: string; nom: string; ncc: string | null; template_fne_defaut: string }
type Produit = { id: string; nom: string; prix_base: number; unite: string; categorie: string }
type Ligne = { designation: string; qte: number; pu: number; remise_ligne: number; produit_id?: string }
type Devis = {
  id: string; numero: string; client_id: string; date: string
  validite: string | null; statut: string; remise: number
  tva_applicable: boolean; notes: string | null
  clients: { nom: string } | null
  devis_lignes: { designation: string; qte: number; pu: number; remise_ligne: number }[]
}

const STATUTS = ['Brouillon', 'Envoyé', 'Accepté', 'Refusé'] as const
const STATUT_STYLE: Record<string, string> = {
  'Brouillon': 'background:#F6F4F1;color:#7A736C',
  'Envoyé':    'background:#e5edf8;color:#2A5FA5',
  'Accepté':   'background:#e8f7ee;color:#3A9A5C',
  'Refusé':    'background:#fde8e8;color:#D14343',
}

const S = {
  input: { width:'100%', padding:'10px 12px', border:'1px solid #E4DDD6', borderRadius:10, fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit' } as React.CSSProperties,
  label: { display:'block', fontSize:11, fontWeight:700, color:'#7A736C', marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'.3px' },
  btnPrimary: { display:'inline-flex', alignItems:'center', gap:7, background:'#C2117A', color:'#fff', border:'none', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  btnGhost: { display:'inline-flex', alignItems:'center', gap:7, background:'#fff', color:'#1B1A1C', border:'1px solid #E4DDD6', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  iconBtn: { background:'transparent', border:'none', cursor:'pointer', color:'#7A736C', padding:6, borderRadius:8, display:'inline-flex', alignItems:'center' } as React.CSSProperties,
}

// ── Éditeur de lignes ──────────────────────────────────────────
function LignesEditor({ lignes, setLignes, produits }: { lignes: Ligne[]; setLignes: (l: Ligne[]) => void; produits: Produit[] }) {
  const set = (i: number, k: keyof Ligne, v: string | number) =>
    setLignes(lignes.map((l, j) => j === i ? { ...l, [k]: v } : l))

  const addLigne = () => setLignes([...lignes, { designation: '', qte: 1, pu: 0, remise_ligne: 0 }])
  const removeLigne = (i: number) => setLignes(lignes.filter((_, j) => j !== i))

  return (
    <div>
      <label style={S.label}>Lignes de prestation</label>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 64px 120px 30px', gap:6, marginBottom:6 }}>
        {['Désignation','Qté','P.U. HT',''].map(h => (
          <div key={h} style={{ fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.3px' }}>{h}</div>
        ))}
      </div>
      {lignes.map((l, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 64px 120px 30px', gap:6, marginBottom:8, alignItems:'center' }}>
          <div>
            <input
              list="produits-list"
              style={{ ...S.input, padding:'8px 10px' }}
              placeholder="Désignation"
              value={l.designation}
              onChange={e => {
                const prod = produits.find(p => p.nom === e.target.value)
                set(i, 'designation', e.target.value)
                if (prod) set(i, 'pu', prod.prix_base)
              }}
            />
          </div>
          <input type="number" style={{ ...S.input, padding:'8px 10px' }} value={l.qte} min={1} onChange={e => set(i, 'qte', Number(e.target.value))} />
          <input type="number" style={{ ...S.input, padding:'8px 10px' }} value={l.pu} min={0} onChange={e => set(i, 'pu', Number(e.target.value))} />
          <button onClick={() => removeLigne(i)} style={{ ...S.iconBtn, color:'#D14343' }}><X size={15}/></button>
        </div>
      ))}
      <datalist id="produits-list">{produits.map(p => <option key={p.id} value={p.nom} />)}</datalist>
      <button onClick={addLigne} style={{ ...S.btnGhost, padding:'7px 12px', fontSize:12, marginTop:4 }}>
        <Plus size={13}/> Ajouter une ligne
      </button>
    </div>
  )
}

// ── Bloc totaux ────────────────────────────────────────────────
function TotauxBox({ lignes, remise, tvaApplicable, tauxTva }: { lignes: Ligne[]; remise: number; tvaApplicable: boolean; tauxTva: number }) {
  const t = calculerTotaux(lignes, remise, tauxTva, tvaApplicable)
  const Row = ({ l, v, bold }: { l: string; v: string; bold?: boolean }) => (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize: bold ? 15 : 13, fontWeight: bold ? 800 : 500 }}>
      <span style={{ color: bold ? '#1B1A1C' : '#7A736C' }}>{l}</span>
      <span style={{ color: bold ? '#C2117A' : '#1B1A1C' }}>{v}</span>
    </div>
  )
  return (
    <div style={{ background:'#F6F4F1', borderRadius:12, padding:14, marginTop:14 }}>
      <Row l="Sous-total" v={formatFCFA(t.sousTotal)} />
      {remise > 0 && <Row l="Remise" v={`- ${formatFCFA(remise)}`} />}
      {tvaApplicable && <Row l={`TVA (${tauxTva}%)`} v={formatFCFA(t.tva)} />}
      <div style={{ borderTop:'1px solid #E4DDD6', marginTop:6, paddingTop:6 }}>
        <Row l="Total TTC" v={formatFCFA(t.ttc)} bold />
      </div>
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────
function Modal({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(27,26,28,.45)', zIndex:50, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:16, overflowY:'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth: wide ? 720 : 520, marginTop:28, marginBottom:28, boxShadow:'0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #E4DDD6' }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={S.iconBtn}><X size={18}/></button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
      </div>
    </div>
  )
}

// ── Formulaire devis ───────────────────────────────────────────
function DevisForm({ initial, clients, produits, tauxTva, onSave, onCancel, loading }: {
  initial: Partial<Devis> & { lignes?: Ligne[] }
  clients: Client[]; produits: Produit[]; tauxTva: number
  onSave: (d: { devis: Record<string, unknown>; lignes: Ligne[] }) => void
  onCancel: () => void; loading: boolean
}) {
  const [clientId, setClientId] = useState(initial.client_id || clients[0]?.id || '')
  const [date, setDate] = useState(initial.date || today())
  const [validite, setValidite] = useState(initial.validite || '')
  const [statut, setStatut] = useState(initial.statut || 'Brouillon')
  const [remise, setRemise] = useState(initial.remise || 0)
  const [tvaApplicable, setTvaApplicable] = useState(initial.tva_applicable !== false)
  const [notes, setNotes] = useState(initial.notes || '')
  const [lignes, setLignes] = useState<Ligne[]>(initial.lignes || [{ designation:'', qte:1, pu:0, remise_ligne:0 }])

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom:14 }}><label style={S.label}>{label}</label>{children}</div>
  )

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <F label="Client *">
          <select style={S.input} value={clientId} onChange={e => setClientId(e.target.value)}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </F>
        <F label="Date">
          <input type="date" style={S.input} value={date} onChange={e => setDate(e.target.value)} />
        </F>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <F label="Date de validité">
          <input type="date" style={S.input} value={validite} onChange={e => setValidite(e.target.value)} />
        </F>
        <F label="Statut">
          <select style={S.input} value={statut} onChange={e => setStatut(e.target.value)}>
            {STATUTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </F>
      </div>

      <div style={{ marginBottom:14 }}>
        <LignesEditor lignes={lignes} setLignes={setLignes} produits={produits} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, alignItems:'center' }}>
        <F label="Remise globale (FCFA)">
          <input type="number" style={S.input} value={remise} min={0} onChange={e => setRemise(Number(e.target.value))} />
        </F>
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, marginTop:14 }}>
          <input type="checkbox" checked={tvaApplicable} onChange={e => setTvaApplicable(e.target.checked)} />
          Appliquer TVA ({tauxTva}%)
        </label>
      </div>

      <F label="Notes">
        <textarea style={{ ...S.input, minHeight:56, resize:'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Conditions particulières…" />
      </F>

      <TotauxBox lignes={lignes} remise={remise} tvaApplicable={tvaApplicable} tauxTva={tauxTva} />

      <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:16 }}>
        <button onClick={onCancel} style={S.btnGhost}>Annuler</button>
        <button
          style={{ ...S.btnPrimary, opacity: loading ? .7 : 1 }}
          disabled={loading || !clientId}
          onClick={() => onSave({ devis: { client_id:clientId, date, validite:validite||null, statut, remise, tva_applicable:tvaApplicable, notes:notes||null }, lignes })}
        >
          <Check size={16}/> {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────
export default function DevisClient({ devis: initial, clients, produits, tauxTva }: {
  devis: Devis[]; clients: Client[]; produits: Produit[]; tauxTva: number
}) {
  const router = useRouter()
  const supabase = createClient()
  const [devis, setDevis] = useState<Devis[]>(initial)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'create'|'edit'|'view'|null>(null)
  const [selected, setSelected] = useState<Devis | null>(null)
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() =>
    devis.filter(d => [d.numero, d.clients?.nom || ''].join(' ').toLowerCase().includes(q.toLowerCase())),
  [devis, q])

  const getTtc = (d: Devis) => calculerTotaux(d.devis_lignes || [], d.remise, tauxTva, d.tva_applicable).ttc

  // Créer
  const handleCreate = async ({ devis: data, lignes }: { devis: Record<string, unknown>; lignes: Ligne[] }) => {
    setLoading(true)
    const year = new Date().getFullYear()
    const { data: numData } = await supabase.rpc('next_numero', { p_type: 'DV', p_annee: year })
    const { data: created, error } = await supabase.from('devis').insert({ ...data, numero: numData }).select('*, clients(nom), devis_lignes(*)').single()
    if (error || !created) { setLoading(false); return }
    if (lignes.length) {
      await supabase.from('devis_lignes').insert(lignes.map((l, i) => ({ ...l, devis_id: created.id, ordre: i })))
    }
    const { data: full } = await supabase.from('devis').select('*, clients(nom), devis_lignes(*)').eq('id', created.id).single()
    if (full) setDevis(prev => [full, ...prev])
    setModal(null); setLoading(false); router.refresh()
  }

  // Modifier
  const handleUpdate = async ({ devis: data, lignes }: { devis: Record<string, unknown>; lignes: Ligne[] }) => {
    if (!selected) return
    setLoading(true)
    await supabase.from('devis').update(data).eq('id', selected.id)
    await supabase.from('devis_lignes').delete().eq('devis_id', selected.id)
    if (lignes.length) await supabase.from('devis_lignes').insert(lignes.map((l, i) => ({ ...l, devis_id: selected.id, ordre: i })))
    const { data: full } = await supabase.from('devis').select('*, clients(nom), devis_lignes(*)').eq('id', selected.id).single()
    if (full) setDevis(prev => prev.map(d => d.id === full.id ? full : d))
    setModal(null); setSelected(null); setLoading(false); router.refresh()
  }

  // Supprimer
  const handleDelete = async (d: Devis) => {
    if (!confirm(`Supprimer le devis ${d.numero} ?`)) return
    await supabase.from('devis_lignes').delete().eq('devis_id', d.id)
    await supabase.from('devis').delete().eq('id', d.id)
    setDevis(prev => prev.filter(x => x.id !== d.id)); router.refresh()
  }

  // Convertir en facture
  const convertirEnFacture = async (d: Devis) => {
    setLoading(true)
    const year = new Date().getFullYear()
    const { data: numData } = await supabase.rpc('next_numero', { p_type: 'FA', p_annee: year })
    const { data: facture } = await supabase.from('factures').insert({
      numero: numData, client_id: d.client_id, devis_id: d.id,
      date: today(), remise: d.remise, tva_applicable: d.tva_applicable,
      notes: d.notes, template_fne: 'B2B', payment_method_fne: 'cash',
    }).select().single()
    if (facture && d.devis_lignes?.length) {
      await supabase.from('factures_lignes').insert(
        d.devis_lignes.map((l, i) => ({ ...l, facture_id: facture.id, taxes: ['TVA'], measurement_unit: 'pcs', ordre: i }))
      )
    }
    await supabase.from('devis').update({ statut: 'Accepté' }).eq('id', d.id)
    setDevis(prev => prev.map(x => x.id === d.id ? { ...x, statut: 'Accepté' } : x))
    setModal(null); setLoading(false)
    alert(`✅ Facture ${numData} créée depuis le devis ${d.numero}`)
    router.refresh()
  }

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Devis</h1>
        <p style={{ color:'#7A736C', fontSize:14, margin:'4px 0 0' }}>{devis.length} devis enregistré{devis.length > 1 ? 's' : ''}</p>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={16} style={{ position:'absolute', left:12, top:12, color:'#7A736C' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un devis…" style={{ ...S.input, paddingLeft:36 }} />
        </div>
        <button style={S.btnPrimary} onClick={() => { setSelected(null); setModal('create') }}>
          <Plus size={16}/> Nouveau devis
        </button>
      </div>

      <div style={{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:14, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ background:'#F6F4F1' }}>
                {['N°','Client','Date','Validité','Montant TTC','Statut',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'11px 16px', fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.3px', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} style={{ borderTop:'1px solid #E4DDD6' }}>
                  <td style={{ padding:'13px 16px', fontWeight:700, fontSize:14 }}>{d.numero}</td>
                  <td style={{ padding:'13px 16px', fontSize:13 }}>{d.clients?.nom || '—'}</td>
                  <td style={{ padding:'13px 16px', fontSize:13, whiteSpace:'nowrap' }}>{formatDateFR(d.date)}</td>
                  <td style={{ padding:'13px 16px', fontSize:13, whiteSpace:'nowrap', color: d.validite ? '#7A736C' : '#E4DDD6' }}>{d.validite ? formatDateFR(d.validite) : '—'}</td>
                  <td style={{ padding:'13px 16px', fontWeight:600 }}>{formatFCFA(getTtc(d))}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:999, ...Object.fromEntries(STATUT_STYLE[d.statut]?.split(';').map(s => s.split(':').map(x => x.trim())) || []) }}>
                      ● {d.statut}
                    </span>
                  </td>
                  <td style={{ padding:'13px 16px', textAlign:'right', whiteSpace:'nowrap' }}>
                    <button onClick={() => { setSelected(d); setModal('view') }} style={S.iconBtn} title="Aperçu"><Eye size={16}/></button>
                    <button onClick={() => { setSelected(d); setModal('edit') }} style={S.iconBtn} title="Modifier"><Pencil size={16}/></button>
                    <button onClick={() => handleDelete(d)} style={{ ...S.iconBtn, color:'#D14343' }} title="Supprimer"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding:48, textAlign:'center', color:'#7A736C', fontSize:14 }}>
            {q ? `Aucun résultat pour "${q}"` : 'Aucun devis. Créez le premier !'}
          </div>
        )}
      </div>

      {/* Modal Créer */}
      {modal === 'create' && (
        <Modal title="Nouveau devis" onClose={() => setModal(null)} wide>
          <DevisForm initial={{}} clients={clients} produits={produits} tauxTva={tauxTva} onSave={handleCreate} onCancel={() => setModal(null)} loading={loading} />
        </Modal>
      )}

      {/* Modal Modifier */}
      {modal === 'edit' && selected && (
        <Modal title={`Modifier — ${selected.numero}`} onClose={() => { setModal(null); setSelected(null) }} wide>
          <DevisForm
            initial={{ ...selected, lignes: selected.devis_lignes?.map(l => ({ ...l, remise_ligne: l.remise_ligne || 0 })) }}
            clients={clients} produits={produits} tauxTva={tauxTva}
            onSave={handleUpdate} onCancel={() => { setModal(null); setSelected(null) }} loading={loading}
          />
        </Modal>
      )}

      {/* Modal Aperçu */}
      {modal === 'view' && selected && (
        <Modal title={`Devis ${selected.numero}`} onClose={() => { setModal(null); setSelected(null) }} wide>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontSize:13, color:'#7A736C' }}>Client</div>
                <div style={{ fontWeight:700 }}>{selected.clients?.nom}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:13, color:'#7A736C' }}>Date</div>
                <div style={{ fontWeight:600 }}>{formatDateFR(selected.date)}</div>
              </div>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#F6F4F1' }}>
                  <th style={{ textAlign:'left', padding:'8px 12px', fontWeight:700, color:'#7A736C', fontSize:11, textTransform:'uppercase' }}>Désignation</th>
                  <th style={{ textAlign:'right', padding:'8px 12px', fontWeight:700, color:'#7A736C', fontSize:11, textTransform:'uppercase' }}>Qté</th>
                  <th style={{ textAlign:'right', padding:'8px 12px', fontWeight:700, color:'#7A736C', fontSize:11, textTransform:'uppercase' }}>P.U.</th>
                  <th style={{ textAlign:'right', padding:'8px 12px', fontWeight:700, color:'#7A736C', fontSize:11, textTransform:'uppercase' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selected.devis_lignes?.map((l, i) => (
                  <tr key={i} style={{ borderTop:'1px solid #E4DDD6' }}>
                    <td style={{ padding:'10px 12px' }}>{l.designation}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right' }}>{l.qte}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right' }}>{formatFCFA(l.pu)}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:600 }}>{formatFCFA(l.qte * l.pu)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TotauxBox lignes={selected.devis_lignes?.map(l => ({ ...l, remise_ligne: l.remise_ligne || 0 })) || []} remise={selected.remise} tvaApplicable={selected.tva_applicable} tauxTva={tauxTva} />
            {selected.notes && <p style={{ fontSize:13, color:'#7A736C', marginTop:12 }}><strong>Notes :</strong> {selected.notes}</p>}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:16 }}>
              {selected.statut !== 'Accepté' && (
                <button onClick={() => convertirEnFacture(selected)} style={{ ...S.btnPrimary, gap:8 }} disabled={loading}>
                  <Receipt size={15}/> Convertir en facture <ArrowRight size={14}/>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
