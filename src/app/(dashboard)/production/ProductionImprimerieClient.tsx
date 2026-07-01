'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDateFR, today } from '@/lib/utils'
import {
  Plus, Search, Pencil, Trash2, X, Check,
  Eye, Printer, Clock, AlertTriangle,
  CheckCircle2, ChevronRight, Settings, Zap
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
type Machine = { id:string; nom:string; type:string; statut:string; marque:string|null }
type Profile = { id:string; nom:string; role:string }
type Etape = { id:string; etape:string; statut:string; operateur_id:string|null; machine_id:string|null; notes:string|null; debut_reel:string|null; fin_reelle:string|null }
type BonTravail = {
  id:string; numero:string; titre:string; type_impression:string
  client_id:string|null; facture_id:string|null
  nom_fichier:string|null; format_fichier:string|null; fichier_conforme:boolean
  support:string|null; grammage:string|null; format_fini:string|null
  format_brut:string|null; recto_verso:boolean; nb_couleurs:string|null
  nb_pages:number|null; pelliculage:string|null; vernis:string|null
  decoupe:string|null; pliage:string|null; reliure:string|null
  autres_finitions:string|null; quantite:number
  date_reception:string; date_livraison_prevue:string|null
  date_livraison_souhaitee:string|null; urgence:boolean
  machine_id:string|null; operateur_id:string|null
  statut:string; instructions_speciales:string|null; notes_internes:string|null
  clients:{ nom:string }|null
  machines:{ nom:string; type:string }|null
  operateur:{ nom:string }|null
  etapes_fabrication:Etape[]
  controles_qualite:{ resultat:string }[]
}

const TYPES_IMPRESSION = ['Numérique','Offset','Textile','Grand format','Conception graphique'] as const
const STATUTS_BT = ['Nouveau','Pré-presse','Impression','Finition','Contrôle qualité','Prêt','Livré','Annulé'] as const
const PELLICULAGES = ['Sans','Brillant','Mat','Soft touch'] as const
const VERNIS_OPTS = ['Sans','Vernis sélectif','UV total'] as const
const PLIAGES = ['Sans','2 plis','3 plis','Accordéon','Roulé'] as const
const RELIURES = ['Sans','Piqûre à cheval','Dos carré collé','Spirale','Agrafage'] as const
const ETAPES_ORDRE = ['Réception fichier','Contrôle pré-presse','Validation BAT','Impression','Pelliculage','Vernis','Découpe','Pliage','Reliure','Contrôle qualité','Conditionnement','Livraison'] as const

const STATUT_COLOR: Record<string,{bg:string;color:string}> = {
  'Nouveau':           { bg:'#F6F4F1', color:'#7A736C' },
  'Pré-presse':        { bg:'#fef3e2', color:'#F39200' },
  'Impression':        { bg:'#e5edf8', color:'#2A5FA5' },
  'Finition':          { bg:'#f0e8f7', color:'#7B2FA5' },
  'Contrôle qualité':  { bg:'#fde8e8', color:'#D14343' },
  'Prêt':              { bg:'#e0f4ea', color:'#2A8A50' },
  'Livré':             { bg:'#e8f7ee', color:'#3A9A5C' },
  'Annulé':            { bg:'#F6F4F1', color:'#7A736C' },
  'En attente':        { bg:'#F6F4F1', color:'#7A736C' },
  'En cours':          { bg:'#e5edf8', color:'#2A5FA5' },
  'Terminé':           { bg:'#e8f7ee', color:'#3A9A5C' },
  'Bloqué':            { bg:'#fde8e8', color:'#D14343' },
}

const MACHINE_ICON: Record<string,string> = {
  'Numérique':'🖨️', 'Offset':'⚙️', 'Textile':'👕',
  'Grand format':'🖼️', 'Finition':'✂️',
}

// ── Styles ─────────────────────────────────────────────────────
const S = {
  input:{ width:'100%', padding:'10px 12px', border:'1px solid #E4DDD6', borderRadius:10, fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit' } as React.CSSProperties,
  label:{ display:'block', fontSize:11, fontWeight:700, color:'#7A736C', marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'.3px' },
  btnPrimary:{ display:'inline-flex', alignItems:'center', gap:7, background:'#C2117A', color:'#fff', border:'none', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  btnGhost:{ display:'inline-flex', alignItems:'center', gap:7, background:'#fff', color:'#1B1A1C', border:'1px solid #E4DDD6', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  iconBtn:{ background:'transparent', border:'none', cursor:'pointer', color:'#7A736C', padding:6, borderRadius:8, display:'inline-flex', alignItems:'center' } as React.CSSProperties,
  card:{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:14, padding:18 } as React.CSSProperties,
}

// ── Modal ──────────────────────────────────────────────────────
function Modal({ title, onClose, wide, xl, children }:{ title:string; onClose:()=>void; wide?:boolean; xl?:boolean; children:React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(27,26,28,.5)', zIndex:50, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:16, overflowY:'auto' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:xl?960:wide?720:540, marginTop:24, marginBottom:24, boxShadow:'0 24px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #E4DDD6' }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={S.iconBtn}><X size={18}/></button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  )
}

// ── Progression des étapes ─────────────────────────────────────
function ProgressionEtapes({ etapes, bonId, profiles, machines, onUpdate }:{
  etapes:Etape[]; bonId:string; profiles:Profile[]; machines:Machine[]
  onUpdate:(etapes:Etape[])=>void
}) {
  const supabase = createClient()
  const etapesActives = ETAPES_ORDRE.filter(e => etapes.find(x => x.etape === e))

  const updateEtape = async (etapeId:string, statut:string) => {
    const now = new Date().toISOString()
    const updates: Record<string,string|null> = { statut }
    if (statut === 'En cours') updates.debut_reel = now
    if (statut === 'Terminé') updates.fin_reelle = now
    await supabase.from('etapes_fabrication').update(updates).eq('id', etapeId)
    onUpdate(etapes.map(e => e.id === etapeId ? { ...e, ...updates } : e))
  }

  if (etapes.length === 0) return (
    <div style={{ padding:'24px', textAlign:'center', color:'#7A736C', fontSize:13 }}>
      Aucune étape définie pour ce bon de travail.
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {etapes.map((e, i) => {
        const sc = STATUT_COLOR[e.statut] || STATUT_COLOR['En attente']
        return (
          <div key={e.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', border:'1px solid #E4DDD6', borderRadius:12, background:e.statut==='Terminé'?'#f8fdf9':'#fff' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:sc.bg, color:sc.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
              {e.statut === 'Terminé' ? '✓' : i+1}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{e.etape}</div>
              {(e.debut_reel || e.fin_reelle) && (
                <div style={{ fontSize:11, color:'#7A736C', marginTop:2 }}>
                  {e.debut_reel && `Début : ${new Date(e.debut_reel).toLocaleString('fr-FR')}`}
                  {e.fin_reelle && ` · Fin : ${new Date(e.fin_reelle).toLocaleString('fr-FR')}`}
                </div>
              )}
            </div>
            <select
              value={e.statut}
              onChange={ev => updateEtape(e.id, ev.target.value)}
              style={{ border:'none', background:sc.bg, color:sc.color, fontWeight:600, fontSize:12, padding:'5px 10px', borderRadius:999, cursor:'pointer', fontFamily:'inherit' }}
            >
              {['En attente','En cours','Terminé','Bloqué'].map(s => <option key={s} value={s} style={{ color:'#1B1A1C', background:'#fff' }}>{s}</option>)}
            </select>
          </div>
        )
      })}
    </div>
  )
}

// ── Fiche détaillée d'un bon de travail ────────────────────────
function FicheBonTravail({ bon, profiles, machines, onUpdate }:{
  bon:BonTravail; profiles:Profile[]; machines:Machine[]
  onUpdate:(b:BonTravail)=>void
}) {
  const supabase = createClient()
  const sc = STATUT_COLOR[bon.statut] || STATUT_COLOR['Nouveau']

  const updateStatut = async (statut:string) => {
    await supabase.from('bons_travail').update({ statut }).eq('id', bon.id)
    onUpdate({ ...bon, statut })
  }

  const Section = ({ title, children }:{ title:string; children:React.ReactNode }) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10, paddingBottom:6, borderBottom:'1px solid #E4DDD6' }}>{title}</div>
      {children}
    </div>
  )

  const Row = ({ l, v }:{ l:string; v:string|number|boolean|null|undefined }) => {
    if (!v && v !== 0 && v !== false) return null
    return (
      <div style={{ display:'flex', gap:12, padding:'5px 0', fontSize:13 }}>
        <span style={{ color:'#7A736C', minWidth:160, flexShrink:0 }}>{l}</span>
        <span style={{ fontWeight:500 }}>{typeof v === 'boolean' ? (v ? 'Oui' : 'Non') : String(v)}</span>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>{MACHINE_ICON[bon.type_impression]||'🖨️'}</span>
            <div>
              <div style={{ fontWeight:800, fontSize:18 }}>{bon.titre}</div>
              <div style={{ fontSize:13, color:'#7A736C' }}>{bon.numero} · {bon.clients?.nom || '—'}</div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {bon.urgence && <span style={{ background:'#fde8e8', color:'#D14343', fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:999 }}>⚡ URGENT</span>}
          <select
            value={bon.statut}
            onChange={e=>updateStatut(e.target.value)}
            style={{ border:`2px solid ${sc.color}`, background:sc.bg, color:sc.color, fontWeight:700, fontSize:13, padding:'7px 14px', borderRadius:10, cursor:'pointer', fontFamily:'inherit' }}
          >
            {STATUTS_BT.map(s=><option key={s} value={s} style={{ color:'#1B1A1C', background:'#fff' }}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Colonne gauche */}
        <div>
          <Section title="Fichier client">
            <Row l="Nom du fichier" v={bon.nom_fichier} />
            <Row l="Format" v={bon.format_fichier} />
            <Row l="Fichier conforme" v={bon.fichier_conforme} />
            {bon.remarques_fichier && <div style={{ marginTop:6, padding:'8px 10px', background:'#fef3e2', borderRadius:8, fontSize:12, color:'#F39200' }}>⚠️ {bon.remarques_fichier}</div>}
          </Section>

          <Section title="Spécifications techniques">
            <Row l="Type d'impression" v={bon.type_impression} />
            <Row l="Support / Papier" v={bon.support} />
            <Row l="Grammage" v={bon.grammage} />
            <Row l="Format brut" v={bon.format_brut} />
            <Row l="Format fini" v={bon.format_fini} />
            <Row l="Couleurs" v={bon.nb_couleurs} />
            <Row l="Recto-verso" v={bon.recto_verso} />
            <Row l="Nombre de pages" v={bon.nb_pages} />
            <Row l="Quantité" v={`${bon.quantite?.toLocaleString('fr-FR')} exemplaires`} />
          </Section>
        </div>

        {/* Colonne droite */}
        <div>
          <Section title="Finitions">
            <Row l="Pelliculage" v={bon.pelliculage !== 'Sans' ? bon.pelliculage : null} />
            <Row l="Vernis" v={bon.vernis !== 'Sans' ? bon.vernis : null} />
            <Row l="Découpe" v={bon.decoupe !== 'Sans' ? bon.decoupe : null} />
            <Row l="Pliage" v={bon.pliage !== 'Sans' ? bon.pliage : null} />
            <Row l="Reliure" v={bon.reliure !== 'Sans' ? bon.reliure : null} />
            {bon.autres_finitions && <Row l="Autres" v={bon.autres_finitions} />}
          </Section>

          <Section title="Planning & assignation">
            <Row l="Réception" v={formatDateFR(bon.date_reception)} />
            <Row l="Livraison souhaitée" v={bon.date_livraison_souhaitee ? formatDateFR(bon.date_livraison_souhaitee) : null} />
            <Row l="Livraison prévue" v={bon.date_livraison_prevue ? formatDateFR(bon.date_livraison_prevue) : null} />
            <Row l="Machine" v={bon.machines?.nom} />
            <Row l="Opérateur" v={bon.operateur?.nom} />
          </Section>

          {bon.instructions_speciales && (
            <Section title="Instructions spéciales">
              <div style={{ padding:'10px 12px', background:'#F6F4F1', borderRadius:10, fontSize:13, lineHeight:1.6 }}>{bon.instructions_speciales}</div>
            </Section>
          )}
        </div>
      </div>

      {/* Progression des étapes */}
      <div style={{ marginTop:8 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:12, paddingBottom:6, borderBottom:'1px solid #E4DDD6' }}>
          Progression des étapes
        </div>
        <ProgressionEtapes
          etapes={bon.etapes_fabrication || []}
          bonId={bon.id}
          profiles={profiles}
          machines={machines}
          onUpdate={etapes => onUpdate({ ...bon, etapes_fabrication: etapes })}
        />
      </div>
    </div>
  )
}

// ── Formulaire création bon de travail ─────────────────────────
type BonForm = {
  titre:string; type_impression:string; client_id:string; facture_id:string
  nom_fichier:string; format_fichier:string; fichier_conforme:boolean; remarques_fichier:string
  support:string; grammage:string; format_brut:string; format_fini:string
  recto_verso:boolean; nb_couleurs:string; nb_pages:string; quantite:number
  pelliculage:string; vernis:string; decoupe:string; pliage:string; reliure:string; autres_finitions:string
  date_reception:string; date_livraison_souhaitee:string; date_livraison_prevue:string
  urgence:boolean; machine_id:string; operateur_id:string
  instructions_speciales:string; notes_internes:string
  etapes_selectionnees:string[]
}

const EMPTY_FORM: BonForm = {
  titre:'', type_impression:'Numérique', client_id:'', facture_id:'',
  nom_fichier:'', format_fichier:'PDF', fichier_conforme:false, remarques_fichier:'',
  support:'', grammage:'', format_brut:'', format_fini:'',
  recto_verso:false, nb_couleurs:'Quadri', nb_pages:'', quantite:1,
  pelliculage:'Sans', vernis:'Sans', decoupe:'Sans', pliage:'Sans', reliure:'Sans', autres_finitions:'',
  date_reception:today(), date_livraison_souhaitee:'', date_livraison_prevue:'',
  urgence:false, machine_id:'', operateur_id:'',
  instructions_speciales:'', notes_internes:'',
  etapes_selectionnees:['Réception fichier','Contrôle pré-presse','Impression','Contrôle qualité','Livraison'],
}

function BonTravailForm({ initial, clients, machines, profiles, factures, onSave, onCancel, loading }:{
  initial:BonForm; clients:{id:string;nom:string}[]; machines:Machine[]; profiles:Profile[]
  factures:{id:string;numero:string}[]; onSave:(f:BonForm)=>void; onCancel:()=>void; loading:boolean
}) {
  const [f, setF] = useState<BonForm>(initial)
  const [tab, setTab] = useState<'base'|'specs'|'finitions'|'planning'>('base')
  const set = (k:keyof BonForm, v: string|boolean|number|string[]) => setF(p=>({...p,[k]:v}))

  const F = ({ label, children, half }:{ label:string; children:React.ReactNode; half?:boolean }) => (
    <div style={{ marginBottom:14, gridColumn:half?'span 1':undefined }}>
      <label style={S.label}>{label}</label>{children}
    </div>
  )

  const tabs = [
    { id:'base',     label:'📋 Identification' },
    { id:'specs',    label:'⚙️ Spécifications' },
    { id:'finitions',label:'✂️ Finitions' },
    { id:'planning', label:'📅 Planning' },
  ]

  // Machines filtrées selon le type d'impression
  const machinesFiltrees = machines.filter(m => m.type === f.type_impression || m.type === 'Finition')

  return (
    <div>
      {/* Onglets */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid #E4DDD6', paddingBottom:0 }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as typeof tab)}
            style={{ padding:'8px 14px', border:'none', background:'transparent', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit',
              color:tab===t.id?'#C2117A':'#7A736C', borderBottom:`2px solid ${tab===t.id?'#C2117A':'transparent'}`, borderRadius:0 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Onglet Base */}
      {tab==='base' && (
        <div>
          <F label="Titre du bon de travail *">
            <input style={S.input} value={f.titre} onChange={e=>set('titre',e.target.value)} placeholder="Ex: Brochures Ministère PND — 1000 ex" />
          </F>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <F label="Type d'impression">
              <select style={S.input} value={f.type_impression} onChange={e=>set('type_impression',e.target.value)}>
                {TYPES_IMPRESSION.map(t=><option key={t}>{t}</option>)}
              </select>
            </F>
            <F label="Client">
              <select style={S.input} value={f.client_id} onChange={e=>set('client_id',e.target.value)}>
                <option value="">— Aucun —</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </F>
            <F label="Facture liée">
              <select style={S.input} value={f.facture_id} onChange={e=>set('facture_id',e.target.value)}>
                <option value="">— Aucune —</option>
                {factures.map(fac=><option key={fac.id} value={fac.id}>{fac.numero}</option>)}
              </select>
            </F>
            <F label="Quantité">
              <input type="number" style={S.input} value={f.quantite} min={1} onChange={e=>set('quantite',Number(e.target.value))} />
            </F>
          </div>
          <div style={{ background:'#F6F4F1', borderRadius:12, padding:14, marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.3px', marginBottom:10 }}>Fichier client</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <F label="Nom du fichier"><input style={S.input} value={f.nom_fichier} onChange={e=>set('nom_fichier',e.target.value)} placeholder="brochure_pnd_v3.pdf" /></F>
              <F label="Format"><input style={S.input} value={f.format_fichier} onChange={e=>set('format_fichier',e.target.value)} placeholder="PDF, AI, PSD…" /></F>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, marginBottom:8 }}>
              <input type="checkbox" checked={f.fichier_conforme} onChange={e=>set('fichier_conforme',e.target.checked)} /> Fichier conforme (résolution, fonds perdus, CMJN…)
            </label>
            {!f.fichier_conforme && (
              <F label="Remarques sur le fichier">
                <input style={S.input} value={f.remarques_fichier} onChange={e=>set('remarques_fichier',e.target.value)} placeholder="Résolution insuffisante, RVB au lieu de CMJN…" />
              </F>
            )}
          </div>
          <F label="Instructions spéciales">
            <textarea style={{ ...S.input, minHeight:64, resize:'vertical' }} value={f.instructions_speciales} onChange={e=>set('instructions_speciales',e.target.value)} placeholder="Attention au grain de la pelliculeuse, couleurs Pantone…" />
          </F>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:600 }}>
            <input type="checkbox" checked={f.urgence} onChange={e=>set('urgence',e.target.checked)} />
            <span style={{ color:'#D14343' }}>⚡ Travail urgent</span>
          </label>
        </div>
      )}

      {/* Onglet Spécifications */}
      {tab==='specs' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <F label="Support / Papier"><input style={S.input} value={f.support} onChange={e=>set('support',e.target.value)} placeholder="Couché mat, offset, autocollant…" /></F>
            <F label="Grammage"><input style={S.input} value={f.grammage} onChange={e=>set('grammage',e.target.value)} placeholder="250g, 80g, 135g…" /></F>
            <F label="Format brut"><input style={S.input} value={f.format_brut} onChange={e=>set('format_brut',e.target.value)} placeholder="Format avant coupe ex: 32x45cm" /></F>
            <F label="Format fini"><input style={S.input} value={f.format_fini} onChange={e=>set('format_fini',e.target.value)} placeholder="21x29,7cm, A5, 8,5x5,5cm…" /></F>
            <F label="Nombre de couleurs">
              <select style={S.input} value={f.nb_couleurs} onChange={e=>set('nb_couleurs',e.target.value)}>
                {['Quadri (4/4)','Quadri (4/0)','Bichromie','Monochromie','N&B'].map(c=><option key={c}>{c}</option>)}
              </select>
            </F>
            <F label="Nb pages (brochures)"><input type="number" style={S.input} value={f.nb_pages} min={0} onChange={e=>set('nb_pages',e.target.value)} /></F>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, marginTop:4 }}>
            <input type="checkbox" checked={f.recto_verso} onChange={e=>set('recto_verso',e.target.checked)} /> Recto-verso
          </label>
        </div>
      )}

      {/* Onglet Finitions */}
      {tab==='finitions' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <F label="Pelliculage">
              <select style={S.input} value={f.pelliculage} onChange={e=>set('pelliculage',e.target.value)}>
                {PELLICULAGES.map(p=><option key={p}>{p}</option>)}
              </select>
            </F>
            <F label="Vernis">
              <select style={S.input} value={f.vernis} onChange={e=>set('vernis',e.target.value)}>
                {VERNIS_OPTS.map(v=><option key={v}>{v}</option>)}
              </select>
            </F>
            <F label="Pliage">
              <select style={S.input} value={f.pliage} onChange={e=>set('pliage',e.target.value)}>
                {PLIAGES.map(p=><option key={p}>{p}</option>)}
              </select>
            </F>
            <F label="Reliure">
              <select style={S.input} value={f.reliure} onChange={e=>set('reliure',e.target.value)}>
                {RELIURES.map(r=><option key={r}>{r}</option>)}
              </select>
            </F>
            <F label="Découpe"><input style={S.input} value={f.decoupe} onChange={e=>set('decoupe',e.target.value)} placeholder="Sans / Découpe spéciale…" /></F>
            <F label="Autres finitions"><input style={S.input} value={f.autres_finitions} onChange={e=>set('autres_finitions',e.target.value)} placeholder="Dorure, gaufrage, embossage…" /></F>
          </div>
          <div style={{ marginTop:16 }}>
            <label style={S.label}>Étapes de fabrication à suivre</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
              {ETAPES_ORDRE.map(etape=>(
                <label key={etape} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', border:`1px solid ${f.etapes_selectionnees.includes(etape)?'#C2117A':'#E4DDD6'}`, borderRadius:8, cursor:'pointer', fontSize:13, background:f.etapes_selectionnees.includes(etape)?'#F5E0EE':'#fff' }}>
                  <input type="checkbox" checked={f.etapes_selectionnees.includes(etape)}
                    onChange={e=>set('etapes_selectionnees', e.target.checked ? [...f.etapes_selectionnees,etape] : f.etapes_selectionnees.filter(x=>x!==etape))} />
                  {etape}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Onglet Planning */}
      {tab==='planning' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <F label="Date de réception"><input type="date" style={S.input} value={f.date_reception} onChange={e=>set('date_reception',e.target.value)} /></F>
            <F label="Livraison souhaitée (client)"><input type="date" style={S.input} value={f.date_livraison_souhaitee} onChange={e=>set('date_livraison_souhaitee',e.target.value)} /></F>
            <F label="Livraison prévue (interne)"><input type="date" style={S.input} value={f.date_livraison_prevue} onChange={e=>set('date_livraison_prevue',e.target.value)} /></F>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8 }}>
            <F label={`Machine (${f.type_impression})`}>
              <select style={S.input} value={f.machine_id} onChange={e=>set('machine_id',e.target.value)}>
                <option value="">— Non assignée —</option>
                {machinesFiltrees.map(m=>(
                  <option key={m.id} value={m.id} disabled={m.statut==='En panne'||m.statut==='Maintenance'}>
                    {MACHINE_ICON[m.type]||'🖨️'} {m.nom} {m.statut!=='Disponible'?`(${m.statut})`:''}
                  </option>
                ))}
              </select>
            </F>
            <F label="Opérateur assigné">
              <select style={S.input} value={f.operateur_id} onChange={e=>set('operateur_id',e.target.value)}>
                <option value="">— Non assigné —</option>
                {profiles.map(p=><option key={p.id} value={p.id}>{p.nom} ({p.role})</option>)}
              </select>
            </F>
          </div>
          <F label="Notes internes">
            <textarea style={{ ...S.input, minHeight:64, resize:'vertical' }} value={f.notes_internes} onChange={e=>set('notes_internes',e.target.value)} placeholder="Notes visibles uniquement en interne…" />
          </F>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:20, paddingTop:16, borderTop:'1px solid #E4DDD6' }}>
        <div style={{ display:'flex', gap:8 }}>
          {tabs.map((t,i)=>(
            <button key={t.id} onClick={()=>setTab(t.id as typeof tab)}
              style={{ width:10, height:10, borderRadius:'50%', border:'none', cursor:'pointer', background:tab===t.id?'#C2117A':'#E4DDD6' }} />
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={S.btnGhost}>Annuler</button>
          <button style={{ ...S.btnPrimary, opacity:loading?.7:1 }} disabled={loading||!f.titre.trim()} onClick={()=>onSave(f)}>
            <Check size={16}/> {loading?'Création…':'Créer le bon de travail'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────
export default function ProductionImprimerieClient({ bons:initial, clients, machines, profiles, factures }:{
  bons:BonTravail[]; clients:{id:string;nom:string}[]
  machines:Machine[]; profiles:Profile[]; factures:{id:string;numero:string}[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [bons, setBons] = useState<BonTravail[]>(initial)
  const [q, setQ] = useState('')
  const [filterStatut, setFilterStatut] = useState('Tous')
  const [filterType, setFilterType] = useState('Tous')
  const [modal, setModal] = useState<'create'|'view'|'machines'|null>(null)
  const [selected, setSelected] = useState<BonTravail|null>(null)
  const [loading, setLoading] = useState(false)

  // Stats
  const stats = useMemo(()=>({
    total: bons.length,
    urgents: bons.filter(b=>b.urgence && !['Livré','Annulé'].includes(b.statut)).length,
    enCours: bons.filter(b=>['Pré-presse','Impression','Finition','Contrôle qualité'].includes(b.statut)).length,
    prets: bons.filter(b=>b.statut==='Prêt').length,
  }), [bons])

  const filtered = useMemo(()=>bons
    .filter(b=>filterStatut==='Tous'||b.statut===filterStatut)
    .filter(b=>filterType==='Tous'||b.type_impression===filterType)
    .filter(b=>[b.numero,b.titre,b.clients?.nom||''].join(' ').toLowerCase().includes(q.toLowerCase()))
  , [bons, q, filterStatut, filterType])

  const handleCreate = async (f:BonForm) => {
    setLoading(true)
    const year = new Date().getFullYear()
    const { data: numData } = await supabase.rpc('next_numero', { p_type:'BT', p_annee:year })
    const { data: bon, error } = await supabase.from('bons_travail').insert({
      numero: numData, titre:f.titre, type_impression:f.type_impression,
      client_id:f.client_id||null, facture_id:f.facture_id||null,
      nom_fichier:f.nom_fichier||null, format_fichier:f.format_fichier||null,
      fichier_conforme:f.fichier_conforme, remarques_fichier:f.remarques_fichier||null,
      support:f.support||null, grammage:f.grammage||null,
      format_brut:f.format_brut||null, format_fini:f.format_fini||null,
      recto_verso:f.recto_verso, nb_couleurs:f.nb_couleurs||null,
      nb_pages:f.nb_pages?Number(f.nb_pages):null, quantite:f.quantite,
      pelliculage:f.pelliculage, vernis:f.vernis, decoupe:f.decoupe,
      pliage:f.pliage, reliure:f.reliure, autres_finitions:f.autres_finitions||null,
      date_reception:f.date_reception,
      date_livraison_souhaitee:f.date_livraison_souhaitee||null,
      date_livraison_prevue:f.date_livraison_prevue||null,
      urgence:f.urgence, machine_id:f.machine_id||null,
      operateur_id:f.operateur_id||null,
      instructions_speciales:f.instructions_speciales||null,
      notes_internes:f.notes_internes||null,
    }).select().single()

    if (!error && bon && f.etapes_selectionnees.length) {
      await supabase.from('etapes_fabrication').insert(
        f.etapes_selectionnees.map(etape=>({ bon_travail_id:bon.id, etape, statut:'En attente' }))
      )
    }

    const { data: full } = await supabase.from('bons_travail').select(`
      *, clients(nom), operateur:profiles!operateur_id(nom),
      machines(nom, type), etapes_fabrication(*), controles_qualite(*)
    `).eq('id', bon?.id||'').single()
    if (full) setBons(prev=>[full as unknown as BonTravail,...prev])
    setModal(null); setLoading(false); router.refresh()
  }

  const handleDelete = async (b:BonTravail) => {
    if (!confirm(`Supprimer le bon de travail ${b.numero} ?`)) return
    await supabase.from('etapes_fabrication').delete().eq('bon_travail_id', b.id)
    await supabase.from('bons_travail').delete().eq('id', b.id)
    setBons(prev=>prev.filter(x=>x.id!==b.id)); router.refresh()
  }

  const updateBon = (updated:BonTravail) => {
    setBons(prev=>prev.map(b=>b.id===updated.id?updated:b))
    if (selected?.id===updated.id) setSelected(updated)
  }

  return (
    <div style={{ padding:24 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Production</h1>
          <p style={{ color:'#7A736C', fontSize:14, margin:'4px 0 0' }}>Module imprimerie — Bons de travail</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>setModal('machines')} style={S.btnGhost}><Settings size={16}/> Machines</button>
          <button onClick={()=>setModal('create')} style={S.btnPrimary}><Plus size={16}/> Nouveau bon de travail</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:18 }}>
        {[
          { l:'Total BT', v:stats.total, c:'#2A5FA5', bg:'#e5edf8', i:'📋' },
          { l:'En cours', v:stats.enCours, c:'#F39200', bg:'#fef3e2', i:'⚙️' },
          { l:'Urgents', v:stats.urgents, c:'#D14343', bg:'#fde8e8', i:'⚡' },
          { l:'Prêts à livrer', v:stats.prets, c:'#3A9A5C', bg:'#e8f7ee', i:'✅' },
        ].map((k,i)=>(
          <div key={i} style={{ ...S.card, padding:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#7A736C' }}>{k.l}</span>
              <span style={{ fontSize:18 }}>{k.i}</span>
            </div>
            <div style={{ fontSize:26, fontWeight:800, color:k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={16} style={{ position:'absolute', left:12, top:12, color:'#7A736C' }} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher un bon de travail…" style={{ ...S.input, paddingLeft:36 }} />
        </div>
        <select value={filterStatut} onChange={e=>setFilterStatut(e.target.value)} style={{ ...S.input, width:'auto', padding:'10px 14px' }}>
          <option>Tous</option>
          {STATUTS_BT.map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ ...S.input, width:'auto', padding:'10px 14px' }}>
          <option>Tous</option>
          {TYPES_IMPRESSION.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Liste des bons — vue Kanban simplifiée */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
        {filtered.map(b=>{
          const sc = STATUT_COLOR[b.statut] || STATUT_COLOR['Nouveau']
          const etapesTerminees = (b.etapes_fabrication||[]).filter(e=>e.statut==='Terminé').length
          const etapesTotal = (b.etapes_fabrication||[]).length
          const progression = etapesTotal > 0 ? Math.round((etapesTerminees/etapesTotal)*100) : 0

          return (
            <div key={b.id} style={{ ...S.card, cursor:'pointer', transition:'box-shadow .15s', position:'relative', borderLeft:`4px solid ${sc.color}` }}
              onClick={()=>{ setSelected(b); setModal('view') }}>

              {b.urgence && (
                <div style={{ position:'absolute', top:12, right:12, background:'#fde8e8', color:'#D14343', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999 }}>⚡ URGENT</div>
              )}

              <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:12 }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{MACHINE_ICON[b.type_impression]||'🖨️'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, lineHeight:1.3, marginBottom:3 }}>{b.titre}</div>
                  <div style={{ fontSize:12, color:'#7A736C' }}>{b.numero} · {b.clients?.nom||'Sans client'}</div>
                </div>
              </div>

              {/* Specs rapides */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                {b.format_fini && <span style={{ fontSize:11, background:'#F6F4F1', padding:'2px 8px', borderRadius:6, color:'#5F5E5A' }}>{b.format_fini}</span>}
                {b.quantite && <span style={{ fontSize:11, background:'#F6F4F1', padding:'2px 8px', borderRadius:6, color:'#5F5E5A' }}>{b.quantite.toLocaleString('fr-FR')} ex</span>}
                {b.pelliculage && b.pelliculage!=='Sans' && <span style={{ fontSize:11, background:'#f0e8f7', padding:'2px 8px', borderRadius:6, color:'#7B2FA5' }}>{b.pelliculage}</span>}
                {b.recto_verso && <span style={{ fontSize:11, background:'#e5edf8', padding:'2px 8px', borderRadius:6, color:'#2A5FA5' }}>R/V</span>}
              </div>

              {/* Progression */}
              {etapesTotal > 0 && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#7A736C', marginBottom:4 }}>
                    <span>Progression</span><span>{etapesTerminees}/{etapesTotal} étapes</span>
                  </div>
                  <div style={{ height:6, background:'#E4DDD6', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${progression}%`, background:progression===100?'#3A9A5C':'#C2117A', borderRadius:3, transition:'width .3s' }} />
                  </div>
                </div>
              )}

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999, background:sc.bg, color:sc.color }}>
                  ● {b.statut}
                </span>
                <div style={{ display:'flex', gap:4 }} onClick={e=>e.stopPropagation()}>
                  {b.date_livraison_prevue && (
                    <span style={{ fontSize:11, color:'#7A736C', display:'flex', alignItems:'center', gap:3 }}>
                      <Clock size={12}/>{formatDateFR(b.date_livraison_prevue)}
                    </span>
                  )}
                  <button onClick={e=>{ e.stopPropagation(); handleDelete(b) }} style={{ ...S.iconBtn, color:'#D14343', padding:3 }}><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length===0 && (
        <div style={{ ...S.card, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🖨️</div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{q||filterStatut!=='Tous'||filterType!=='Tous' ? 'Aucun résultat' : 'Aucun bon de travail'}</div>
          <div style={{ color:'#7A736C', fontSize:14, marginBottom:20 }}>{q||filterStatut!=='Tous'||filterType!=='Tous' ? 'Essayez d\'autres filtres' : 'Créez le premier bon de travail pour démarrer la production'}</div>
          {!q && filterStatut==='Tous' && filterType==='Tous' && (
            <button onClick={()=>setModal('create')} style={S.btnPrimary}><Plus size={16}/> Nouveau bon de travail</button>
          )}
        </div>
      )}

      {/* Modal Créer */}
      {modal==='create' && (
        <Modal title="Nouveau bon de travail" onClose={()=>setModal(null)} xl>
          <BonTravailForm initial={EMPTY_FORM} clients={clients} machines={machines} profiles={profiles} factures={factures} onSave={handleCreate} onCancel={()=>setModal(null)} loading={loading} />
        </Modal>
      )}

      {/* Modal Fiche détaillée */}
      {modal==='view' && selected && (
        <Modal title={`Bon de travail — ${selected.numero}`} onClose={()=>{ setModal(null); setSelected(null) }} xl>
          <FicheBonTravail bon={selected} profiles={profiles} machines={machines} onUpdate={updateBon} />
        </Modal>
      )}

      {/* Modal Machines */}
      {modal==='machines' && (
        <Modal title="Parc machines" onClose={()=>setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {machines.map(m=>{
              const sc2: Record<string,{bg:string;color:string}> = {
                'Disponible':  { bg:'#e8f7ee', color:'#3A9A5C' },
                'En service':  { bg:'#e5edf8', color:'#2A5FA5' },
                'En panne':    { bg:'#fde8e8', color:'#D14343' },
                'Maintenance': { bg:'#fef3e2', color:'#F39200' },
              }
              const st = sc2[m.statut] || sc2['Disponible']
              return (
                <div key={m.id} style={{ ...S.card, padding:14 }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{MACHINE_ICON[m.type]||'🖨️'}</div>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{m.nom}</div>
                  <div style={{ fontSize:12, color:'#7A736C', marginBottom:8 }}>{m.type}{m.marque ? ` · ${m.marque}` : ''}</div>
                  <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999, background:st.bg, color:st.color }}>● {m.statut}</span>
                </div>
              )
            })}
          </div>
        </Modal>
      )}
    </div>
  )
}
