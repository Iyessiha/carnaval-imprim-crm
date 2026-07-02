'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/any'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import Modal from '@/components/ui/Modal'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import {
  Check, Building2, Zap, Users, Plus, Pencil,
  KeyRound, ToggleLeft, ToggleRight, Shield, ShieldOff, Eye, EyeOff
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────
type Profile = {
  id: string; nom: string; email: string; role: string
  actif: boolean; poste?: string; telephone?: string
  permissions?: Record<string,boolean>; derniere_connexion?: string; created_at: string
}

const ROLES = ['Admin','Commercial','Production','Comptabilité'] as const
type Role = typeof ROLES[number]

const ROLE_COLORS: Record<Role, [string,string]> = {
  'Admin':         ['#FDE8E8','#D14343'],
  'Commercial':    ['#E5EDF8','#2A5FA5'],
  'Production':    ['#F0E8F8','#7B2FA5'],
  'Comptabilité':  ['#FEF3E2','#F39200'],
}

// Permissions par module — ce que chaque rôle peut faire
const MODULES = [
  { key: 'clients',      label: 'Clients' },
  { key: 'devis',        label: 'Devis' },
  { key: 'factures',     label: 'Factures' },
  { key: 'relances',     label: 'Relances' },
  { key: 'production',   label: 'Production' },
  { key: 'bons',         label: 'Bons commande' },
  { key: 'catalogue',    label: 'Catalogue' },
  { key: 'fournisseurs', label: 'Fournisseurs' },
  { key: 'comptabilite', label: 'Comptabilité' },
  { key: 'caisse',       label: 'Caisse' },
  { key: 'stats',        label: 'Statistiques' },
  { key: 'parametres',   label: 'Paramètres' },
]

const PERMISSIONS_DEFAUT: Record<Role, Record<string,boolean>> = {
  'Admin':        Object.fromEntries(MODULES.map(m => [m.key, true])),
  'Commercial':   { clients:true, devis:true, factures:true, relances:true, production:false, bons:false, catalogue:true, fournisseurs:false, comptabilite:false, caisse:false, stats:true, parametres:false },
  'Production':   { clients:false, devis:false, factures:false, relances:false, production:true, bons:true, catalogue:true, fournisseurs:true, comptabilite:false, caisse:false, stats:false, parametres:false },
  'Comptabilité': { clients:true, devis:true, factures:true, relances:true, production:false, bons:false, catalogue:false, fournisseurs:true, comptabilite:true, caisse:true, stats:true, parametres:false },
}

export default function ParametresClient({ entreprise: initial, fneConfig: initialFne, profiles: initialProfiles, currentUserId, isAdmin }: {
  entreprise: Record<string,unknown>|null
  fneConfig: Record<string,unknown>|null
  profiles: Profile[]
  currentUserId: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'entreprise'|'fne'|'users'>('entreprise')
  const [profiles, setProfiles] = useState(initialProfiles)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'create'|'edit'|'password'|'permissions'|null>(null)
  const [selUser, setSelUser] = useState<Profile|null>(null)
  const [showPwd, setShowPwd] = useState(false)

  // Formulaire entreprise
  const [ent, setEnt] = useState<Record<string,string>>({
    nom:               String(initial?.nom || 'CARNAVAL IMPRIM'),
    forme:             String(initial?.forme || 'SARL'),
    capital:           String((initial as Record<string,unknown>)?.capital || '1000000'),
    siege:             String(initial?.siege || 'Cocody - Blockhauss, Abidjan'),
    tel:               String(initial?.tel || '07 19 14 13 13 / 07 58 26 53 12'),
    email:             String(initial?.email || ''),
    rc:                String(initial?.rc || 'CI-ABJ-03-2024-B13-05735'),
    ncc:               String(initial?.ncc || '240220333S'),
    regime:            String(initial?.regime || 'Réel simplifié'),
    centre_impots:     String(initial?.centre_impots || 'Cocody'),
    taux_tva:          String(initial?.taux_tva || '18'),
    fne_point_of_sale: String(initial?.fne_point_of_sale || ''),
    fne_establishment: String(initial?.fne_establishment || ''),
  })

  // Formulaire FNE
  const [fne, setFne] = useState({
    api_key:  String(initialFne?.api_key || ''),
    url_prod: String(initialFne?.url_prod || ''),
    mode:     String(initialFne?.mode || 'test'),
  })

  // Formulaire nouvel utilisateur
  const emptyUser = { nom:'', email:'', password:'', role:'Commercial' as Role, poste:'', telephone:'' }
  const [formUser, setFormUser] = useState(emptyUser)
  const [newPwd, setNewPwd] = useState('')
  const [permEdit, setPermEdit] = useState<Record<string,boolean>>({})

  // ── Sauvegardes ────────────────────────────────────────────────
  const saveEnt = async () => {
    setSaving(true); setError('')
    const sb = getSupabase()
    const { error: e } = await sb.from('entreprise').update({
      nom: ent.nom, forme: ent.forme, capital: Number(ent.capital)||1000000,
      siege: ent.siege, tel: ent.tel, email: ent.email,
      rc: ent.rc, ncc: ent.ncc, regime: ent.regime,
      centre_impots: ent.centre_impots,
      taux_tva: parseFloat(ent.taux_tva)||18,
      fne_point_of_sale: ent.fne_point_of_sale,
      fne_establishment: ent.fne_establishment,
    }).eq('id', String(initial?.id || ''))
    setSaving(false)
    if (e) { setError(e.message); return }
    setSaved('✅ Entreprise sauvegardée'); setTimeout(() => setSaved(''), 3000)
  }

  const saveFne = async () => {
    setSaving(true); setError('')
    const sb = getSupabase()
    const { error: e } = await sb.from('fne_config').update({
      api_key: fne.api_key || null,
      url_prod: fne.url_prod || null,
      mode: fne.mode,
      actif: !!(fne.api_key),
    }).gte('created_at', '2000-01-01')
    setSaving(false)
    if (e) { setError(e.message); return }
    setSaved('✅ Configuration FNE sauvegardée'); setTimeout(() => setSaved(''), 3000)
  }

  // ── Gestion utilisateurs ────────────────────────────────────────
  const createUser = async () => {
    if (!formUser.nom.trim()) { setError('Nom obligatoire.'); return }
    if (!formUser.email.trim()) { setError('Email obligatoire.'); return }
    if (!formUser.password || formUser.password.length < 8) { setError('Mot de passe : 8 caractères minimum.'); return }
    setSaving(true); setError('')
    const sb = getSupabase()
    const { data, error: e } = await sb.rpc('create_user_with_profile', {
      p_email: formUser.email,
      p_password: formUser.password,
      p_nom: formUser.nom,
      p_role: formUser.role,
      p_poste: formUser.poste || null,
      p_telephone: formUser.telephone || null,
    })
    if (e) { setError(e.message); setSaving(false); return }
    // Appliquer permissions par défaut
    await sb.from('profiles').update({
      permissions: PERMISSIONS_DEFAUT[formUser.role as Role]
    }).eq('id', data)
    // Refresh
    const { data: updated } = await sb.from('profiles').select('id, nom, email, role, actif, poste, telephone, permissions, derniere_connexion, created_at').order('created_at')
    if (updated) setProfiles(updated as Profile[])
    setSaving(false); setModal(null); setFormUser(emptyUser)
    setSaved(`✅ Utilisateur ${formUser.nom} créé avec succès`); setTimeout(() => setSaved(''), 4000)
    router.refresh()
  }

  const updateUser = async () => {
    if (!selUser) return
    setSaving(true); setError('')
    const sb = getSupabase()
    const { error: e } = await sb.from('profiles').update({
      nom: formUser.nom,
      role: formUser.role,
      poste: formUser.poste || null,
      telephone: formUser.telephone || null,
    }).eq('id', selUser.id)
    if (e) { setError(e.message); setSaving(false); return }
    setProfiles(prev => prev.map(p => p.id === selUser.id ? { ...p, nom: formUser.nom, role: formUser.role, poste: formUser.poste, telephone: formUser.telephone } : p))
    setSaving(false); setModal(null); setSelUser(null)
    setSaved('✅ Utilisateur modifié'); setTimeout(() => setSaved(''), 3000)
  }

  const changePassword = async () => {
    if (!selUser) return
    if (!newPwd || newPwd.length < 8) { setError('Mot de passe : 8 caractères minimum.'); return }
    setSaving(true); setError('')
    const sb = getSupabase()
    const { error: e } = await sb.rpc('admin_set_password', { p_user_id: selUser.id, p_new_password: newPwd })
    setSaving(false)
    if (e) { setError(e.message); return }
    setModal(null); setSelUser(null); setNewPwd('')
    setSaved(`✅ Mot de passe de ${selUser.nom} modifié`); setTimeout(() => setSaved(''), 3000)
  }

  const toggleActif = async (p: Profile) => {
    if (p.id === currentUserId) { alert('Vous ne pouvez pas désactiver votre propre compte.'); return }
    const sb = getSupabase()
    const { error: e } = await sb.rpc('admin_toggle_user', { p_user_id: p.id, p_actif: !p.actif })
    if (e) { alert(e.message); return }
    setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, actif: !x.actif } : x))
    setSaved(`✅ ${p.nom} ${!p.actif ? 'activé' : 'désactivé'}`); setTimeout(() => setSaved(''), 3000)
  }

  const savePermissions = async () => {
    if (!selUser) return
    setSaving(true); setError('')
    const sb = getSupabase()
    const { error: e } = await sb.from('profiles').update({ permissions: permEdit }).eq('id', selUser.id)
    if (e) { setError(e.message); setSaving(false); return }
    setProfiles(prev => prev.map(p => p.id === selUser.id ? { ...p, permissions: permEdit } : p))
    setSaving(false); setModal(null); setSelUser(null)
    setSaved('✅ Permissions mises à jour'); setTimeout(() => setSaved(''), 3000)
  }

  // ── UI Tabs ─────────────────────────────────────────────────────
  const TABS = [
    { key:'entreprise', label:'Entreprise', icon:Building2 },
    { key:'fne',        label:'FNE / DGI',  icon:Zap },
    { key:'users',      label:'Utilisateurs', icon:Users },
  ] as const

  const tabStyle = (k: string) => ({
    display:'flex', alignItems:'center', gap:7,
    padding:'9px 18px', borderRadius:9, border:'none', cursor:'pointer',
    fontSize:13, fontWeight:600, fontFamily:'inherit',
    background: tab === k ? '#fff' : 'transparent',
    color: tab === k ? '#C2117A' : '#7A736C',
    boxShadow: tab === k ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
  } as React.CSSProperties)

  const RowPerms = ({ moduleKey, label, checked }: { moduleKey:string; label:string; checked:boolean }) => (
    <label style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F0EEEC', cursor:'pointer', fontSize:13 }}>
      <span style={{ fontWeight:500 }}>{label}</span>
      <div style={{ position:'relative', width:40, height:22 }} onClick={() => setPermEdit(p => ({ ...p, [moduleKey]: !p[moduleKey] }))}>
        <div style={{ position:'absolute', inset:0, background: checked ? '#C2117A' : '#E4DDD6', borderRadius:999, transition:'background .2s' }} />
        <div style={{ position:'absolute', top:3, left: checked ? 20 : 3, width:16, height:16, background:'#fff', borderRadius:'50%', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }} />
      </div>
    </label>
  )

  return (
    <div style={{ padding:24 }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Paramètres</h1>
        <p style={{ color:'#7A736C', fontSize:14, margin:'4px 0 0' }}>Configuration de Carnaval Imprim CRM</p>
      </div>

      {/* Messages */}
      {saved && <div style={{ background:'#E8F7EE', color:'#3A9A5C', padding:'10px 16px', borderRadius:10, marginBottom:16, fontWeight:600, fontSize:14 }}>{saved}</div>}
      {error && <div style={{ background:'#FDE8E8', color:'#D14343', padding:'10px 16px', borderRadius:10, marginBottom:16, fontSize:14 }}>{error}<button onClick={() => setError('')} style={{ float:'right', background:'none', border:'none', cursor:'pointer', color:'#D14343', fontSize:16 }}>×</button></div>}

      {/* Onglets */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'#F6F4F1', borderRadius:12, padding:4, width:'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setError('') }} style={tabStyle(t.key)}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── ENTREPRISE ─────────────────────────────────────────── */}
      {tab === 'entreprise' && (
        <div style={{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:14, padding:24, maxWidth:640 }}>
          <h2 style={{ fontSize:15, fontWeight:700, margin:'0 0 20px' }}>Informations légales</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Raison sociale"><input style={inputStyle} value={ent.nom} onChange={e => setEnt(p=>({...p,nom:e.target.value}))} /></Field>
            <Field label="Forme juridique"><input style={inputStyle} value={ent.forme} onChange={e => setEnt(p=>({...p,forme:e.target.value}))} placeholder="SARL" /></Field>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Capital social (FCFA)"><input type="number" style={inputStyle} value={ent.capital} onChange={e => setEnt(p=>({...p,capital:e.target.value}))} /></Field>
            <Field label="Siège social"><input style={inputStyle} value={ent.siege} onChange={e => setEnt(p=>({...p,siege:e.target.value}))} /></Field>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Téléphone(s)"><input style={inputStyle} value={ent.tel} onChange={e => setEnt(p=>({...p,tel:e.target.value}))} /></Field>
            <Field label="Email"><input type="email" style={inputStyle} value={ent.email} onChange={e => setEnt(p=>({...p,email:e.target.value}))} /></Field>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="RC (RCCM)"><input style={inputStyle} value={ent.rc} onChange={e => setEnt(p=>({...p,rc:e.target.value}))} /></Field>
            <Field label="NCC"><input style={inputStyle} value={ent.ncc} onChange={e => setEnt(p=>({...p,ncc:e.target.value}))} /></Field>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Régime d'imposition"><input style={inputStyle} value={ent.regime} onChange={e => setEnt(p=>({...p,regime:e.target.value}))} /></Field>
            <Field label="Centre des impôts"><input style={inputStyle} value={ent.centre_impots} onChange={e => setEnt(p=>({...p,centre_impots:e.target.value}))} /></Field>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <Field label="Taux TVA (%)"><input type="number" min="0" max="100" step="0.5" style={inputStyle} value={ent.taux_tva} onChange={e => setEnt(p=>({...p,taux_tva:e.target.value}))} /></Field>
            <Field label="FNE Point de vente"><input style={inputStyle} value={ent.fne_point_of_sale} onChange={e => setEnt(p=>({...p,fne_point_of_sale:e.target.value}))} /></Field>
            <Field label="FNE Établissement"><input style={inputStyle} value={ent.fne_establishment} onChange={e => setEnt(p=>({...p,fne_establishment:e.target.value}))} /></Field>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
            <BtnPrimary onClick={saveEnt} disabled={saving}><Check size={16} />{saving ? 'Sauvegarde…' : 'Sauvegarder'}</BtnPrimary>
          </div>
        </div>
      )}

      {/* ── FNE ────────────────────────────────────────────────── */}
      {tab === 'fne' && (
        <div style={{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:14, padding:24, maxWidth:560 }}>
          <div style={{ background:'linear-gradient(135deg,#1B3A5C,#2A5FA5)', borderRadius:10, padding:'14px 16px', marginBottom:20, color:'#fff' }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>🏛️ FNE — Facture Normalisée Électronique</div>
            <div style={{ fontSize:12, opacity:.85 }}>DGI Côte d&apos;Ivoire · services.fne.dgi.gouv.ci</div>
            <div style={{ fontSize:12, opacity:.85, marginTop:4 }}>NCC : {ent.ncc} · Inscrivez-vous sur le portail DGI pour obtenir votre clé API</div>
          </div>
          <Field label="Mode">
            <select style={inputStyle} value={fne.mode} onChange={e => setFne(p=>({...p,mode:e.target.value}))}>
              <option value="test">Test (sandbox)</option>
              <option value="production">Production (réel DGI)</option>
            </select>
          </Field>
          <Field label="Clé API FNE">
            <div style={{ position:'relative' }}>
              <input type={showPwd ? 'text' : 'password'} style={{ ...inputStyle, paddingRight:40 }}
                value={fne.api_key} onChange={e => setFne(p=>({...p,api_key:e.target.value}))}
                placeholder="Obtenir sur services.fne.dgi.gouv.ci" />
              <button onClick={() => setShowPwd(!showPwd)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#7A736C' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Field label="URL Production FNE">
            <input style={inputStyle} value={fne.url_prod} onChange={e => setFne(p=>({...p,url_prod:e.target.value}))} placeholder="https://..." />
          </Field>
          <div style={{ background:'#FEF3E2', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13 }}>
            ⚠️ URL Test (sandbox) : <code>http://54.247.95.108/ws</code> — déjà configurée côté serveur.
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <BtnPrimary onClick={saveFne} disabled={saving}><Check size={16} />{saving ? '…' : 'Sauvegarder'}</BtnPrimary>
          </div>
        </div>
      )}

      {/* ── UTILISATEURS ───────────────────────────────────────── */}
      {tab === 'users' && (
        <div>
          {/* Bannière non-admin */}
          {!isAdmin && (
            <div style={{ background:'#FEF3E2', border:'1px solid #F39200', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:14 }}>
              ⚠️ Vous avez un accès en lecture seule. Seuls les Administrateurs peuvent créer ou modifier des utilisateurs.
            </div>
          )}

          {/* Statistiques */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            {ROLES.map(r => {
              const count = profiles.filter(p => p.role === r).length
              const [bg, color] = ROLE_COLORS[r]
              return (
                <div key={r} style={{ background:bg, borderRadius:12, padding:'10px 16px', minWidth:100, textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:800, color }}>{count}</div>
                  <div style={{ fontSize:11, fontWeight:600, color, marginTop:2 }}>{r}</div>
                </div>
              )
            })}
            <div style={{ background:'#F0EEEC', borderRadius:12, padding:'10px 16px', minWidth:100, textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:'#7A736C' }}>{profiles.filter(p => !p.actif).length}</div>
              <div style={{ fontSize:11, fontWeight:600, color:'#7A736C', marginTop:2 }}>Inactifs</div>
            </div>
          </div>

          {/* Bouton créer */}
          {isAdmin && (
            <div style={{ marginBottom:16 }}>
              <button onClick={() => { setFormUser(emptyUser); setError(''); setModal('create') }}
                style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#C2117A', color:'#fff', border:'none', padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <Plus size={16} /> Nouvel utilisateur
              </button>
            </div>
          )}

          {/* Tableau utilisateurs */}
          <TableWrap minWidth={840}>
            <thead><tr>
              {['Utilisateur','Email','Rôle','Poste','Statut','Dernière connexion','Actions'].map(h => <th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {profiles.map(p => {
                const [bg, color] = ROLE_COLORS[p.role as Role] || ['#F0EEEC','#7A736C']
                const isMe = p.id === currentUserId
                return (
                  <tr key={p.id} style={{ opacity: p.actif ? 1 : .5 }}>
                    <td style={td}>
                      <div style={{ fontWeight:700 }}>{p.nom}{isMe && <span style={{ fontSize:10, background:'#E5EDF8', color:'#2A5FA5', padding:'1px 7px', borderRadius:999, marginLeft:7, fontWeight:700 }}>Moi</span>}</div>
                      {p.telephone && <div style={{ fontSize:11, color:'#7A736C', marginTop:2 }}>📞 {p.telephone}</div>}
                    </td>
                    <td style={{ ...td, fontSize:12, color:'#7A736C' }}>{p.email||'—'}</td>
                    <td style={td}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999, background:bg, color }}>
                        {p.role === 'Admin' && '👑 '}{p.role}
                      </span>
                    </td>
                    <td style={{ ...td, fontSize:12, color:'#7A736C' }}>{p.poste||'—'}</td>
                    <td style={td}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999, background: p.actif?'#E8F7EE':'#F0EEEC', color: p.actif?'#3A9A5C':'#7A736C' }}>
                        {p.actif ? '✓ Actif' : '✗ Inactif'}
                      </span>
                    </td>
                    <td style={{ ...td, fontSize:12, color:'#7A736C' }}>
                      {p.derniere_connexion ? new Date(p.derniere_connexion).toLocaleDateString('fr-FR') : 'Jamais'}
                    </td>
                    <td style={{ ...td, textAlign:'right', whiteSpace:'nowrap' }}>
                      {isAdmin && (
                        <>
                          {/* Modifier profil */}
                          <BtnIcon title="Modifier" onClick={() => {
                            setSelUser(p)
                            setFormUser({ nom:p.nom, email:p.email, password:'', role:p.role as Role, poste:p.poste||'', telephone:p.telephone||'' })
                            setError(''); setModal('edit')
                          }}><Pencil size={15} /></BtnIcon>

                          {/* Changer mot de passe */}
                          <BtnIcon title="Changer le mot de passe" onClick={() => {
                            setSelUser(p); setNewPwd(''); setError(''); setModal('password')
                          }}><KeyRound size={15} /></BtnIcon>

                          {/* Permissions */}
                          <BtnIcon title="Gérer les accès" onClick={() => {
                            setSelUser(p)
                            setPermEdit({ ...(PERMISSIONS_DEFAUT[p.role as Role]||{}), ...(p.permissions||{}) })
                            setError(''); setModal('permissions')
                          }}>{p.role === 'Admin' ? <Shield size={15} /> : <ShieldOff size={15} />}</BtnIcon>

                          {/* Activer/Désactiver */}
                          {!isMe && (
                            <BtnIcon title={p.actif ? 'Désactiver' : 'Activer'} onClick={() => toggleActif(p)}>
                              {p.actif ? <ToggleRight size={18} style={{ color:'#3A9A5C' }} /> : <ToggleLeft size={18} />}
                            </BtnIcon>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
              {profiles.length === 0 && <EmptyRow text="Aucun utilisateur." cols={7} />}
            </tbody>
          </TableWrap>

          {/* Légende des rôles */}
          <div style={{ marginTop:20, background:'#F6F4F1', borderRadius:12, padding:'14px 18px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.3px', marginBottom:10 }}>Accès par défaut selon le rôle</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10 }}>
              {ROLES.map(r => {
                const perms = PERMISSIONS_DEFAUT[r]
                const count = Object.values(perms).filter(Boolean).length
                const [bg, color] = ROLE_COLORS[r]
                return (
                  <div key={r} style={{ background:'#fff', borderRadius:10, padding:'10px 14px', border:'1px solid #E4DDD6' }}>
                    <div style={{ fontSize:12, fontWeight:700, color, background:bg, display:'inline-block', padding:'2px 10px', borderRadius:999, marginBottom:8 }}>{r}</div>
                    <div style={{ fontSize:11, color:'#7A736C' }}>{count}/{MODULES.length} modules accessibles</div>
                    <div style={{ fontSize:11, color:'#7A736C', marginTop:4 }}>
                      {MODULES.filter(m => perms[m.key]).map(m => m.label).join(', ')}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CRÉER UTILISATEUR ─────────────────────────────── */}
      {modal === 'create' && (
        <Modal title="Nouvel utilisateur" onClose={() => { setModal(null); setError('') }} wide>
          <div>
            {error && <div style={{ background:'#fde8e8',color:'#D14343',padding:'10px 14px',borderRadius:10,marginBottom:14,fontSize:13 }}>{error}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Nom complet *"><input style={inputStyle} value={formUser.nom} onChange={e => setFormUser(p=>({...p,nom:e.target.value}))} placeholder="Ex: Kouadio Jean" /></Field>
              <Field label="Email *"><input type="email" style={inputStyle} value={formUser.email} onChange={e => setFormUser(p=>({...p,email:e.target.value}))} placeholder="jean@carnavalimprim.ci" /></Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Mot de passe * (min. 8 caractères)">
                <div style={{ position:'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} style={{ ...inputStyle, paddingRight:40 }}
                    value={formUser.password} onChange={e => setFormUser(p=>({...p,password:e.target.value}))}
                    placeholder="••••••••" />
                  <button onClick={() => setShowPwd(!showPwd)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#7A736C' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field label="Rôle *">
                <select style={inputStyle} value={formUser.role} onChange={e => setFormUser(p=>({...p,role:e.target.value as Role}))}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Poste / Fonction"><input style={inputStyle} value={formUser.poste} onChange={e => setFormUser(p=>({...p,poste:e.target.value}))} placeholder="Ex: Commerciale" /></Field>
              <Field label="Téléphone"><input style={inputStyle} value={formUser.telephone} onChange={e => setFormUser(p=>({...p,telephone:e.target.value}))} placeholder="07 XX XX XX XX" /></Field>
            </div>
            {/* Aperçu permissions */}
            <div style={{ background:'#F6F4F1', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#7A736C', textTransform:'uppercase', letterSpacing:'.3px', marginBottom:6 }}>
                Accès par défaut pour &quot;{formUser.role}&quot;
              </div>
              <div style={{ fontSize:12, color:'#7A736C' }}>
                {MODULES.filter(m => PERMISSIONS_DEFAUT[formUser.role as Role]?.[m.key]).map(m => m.label).join(', ') || 'Aucun accès'}
              </div>
              <div style={{ fontSize:11, color:'#C2117A', marginTop:4 }}>Vous pourrez affiner les accès après création.</div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <BtnGhost onClick={() => { setModal(null); setError('') }}>Annuler</BtnGhost>
              <BtnPrimary onClick={createUser} disabled={saving}><Plus size={16} />{saving ? 'Création…' : 'Créer l\'utilisateur'}</BtnPrimary>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL MODIFIER ─────────────────────────────────────── */}
      {modal === 'edit' && selUser && (
        <Modal title={`Modifier — ${selUser.nom}`} onClose={() => { setModal(null); setSelUser(null); setError('') }}>
          <div>
            {error && <div style={{ background:'#fde8e8',color:'#D14343',padding:'10px 14px',borderRadius:10,marginBottom:14,fontSize:13 }}>{error}</div>}
            <Field label="Nom complet"><input style={inputStyle} value={formUser.nom} onChange={e => setFormUser(p=>({...p,nom:e.target.value}))} /></Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Rôle">
                <select style={inputStyle} value={formUser.role}
                  disabled={selUser.id === currentUserId}
                  onChange={e => setFormUser(p=>({...p,role:e.target.value as Role}))}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Poste / Fonction"><input style={inputStyle} value={formUser.poste} onChange={e => setFormUser(p=>({...p,poste:e.target.value}))} /></Field>
            </div>
            <Field label="Téléphone"><input style={inputStyle} value={formUser.telephone} onChange={e => setFormUser(p=>({...p,telephone:e.target.value}))} /></Field>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <BtnGhost onClick={() => { setModal(null); setSelUser(null) }}>Annuler</BtnGhost>
              <BtnPrimary onClick={updateUser} disabled={saving}><Check size={16} />{saving ? '…' : 'Sauvegarder'}</BtnPrimary>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL MOT DE PASSE ─────────────────────────────────── */}
      {modal === 'password' && selUser && (
        <Modal title={`Mot de passe — ${selUser.nom}`} onClose={() => { setModal(null); setSelUser(null); setError(''); setNewPwd('') }}>
          <div>
            {error && <div style={{ background:'#fde8e8',color:'#D14343',padding:'10px 14px',borderRadius:10,marginBottom:14,fontSize:13 }}>{error}</div>}
            <div style={{ background:'#FEF3E2', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13 }}>
              ⚠️ Le nouveau mot de passe sera actif immédiatement. Communiquez-le à {selUser.nom} de manière sécurisée.
            </div>
            <Field label="Nouveau mot de passe (min. 8 caractères)">
              <div style={{ position:'relative' }}>
                <input type={showPwd ? 'text' : 'password'} style={{ ...inputStyle, paddingRight:40 }}
                  value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  placeholder="••••••••" />
                <button onClick={() => setShowPwd(!showPwd)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#7A736C' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <BtnGhost onClick={() => { setModal(null); setSelUser(null); setNewPwd('') }}>Annuler</BtnGhost>
              <BtnPrimary onClick={changePassword} disabled={saving || newPwd.length < 8}>
                <KeyRound size={16} />{saving ? '…' : 'Changer le mot de passe'}
              </BtnPrimary>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL PERMISSIONS ──────────────────────────────────── */}
      {modal === 'permissions' && selUser && (
        <Modal title={`Accès modules — ${selUser.nom}`} onClose={() => { setModal(null); setSelUser(null); setError('') }}>
          <div>
            {error && <div style={{ background:'#fde8e8',color:'#D14343',padding:'10px 14px',borderRadius:10,marginBottom:14,fontSize:13 }}>{error}</div>}
            <div style={{ background:'#E5EDF8', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13 }}>
              <strong>{selUser.nom}</strong> · Rôle : {selUser.role}<br/>
              <span style={{ fontSize:11, color:'#7A736C', marginTop:4, display:'block' }}>Activez/désactivez l&apos;accès à chaque module. Les accès par défaut correspondent au rôle.</span>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                <button onClick={() => setPermEdit(Object.fromEntries(MODULES.map(m => [m.key, true])))}
                  style={{ fontSize:11, fontWeight:600, padding:'5px 12px', borderRadius:8, border:'1px solid #E4DDD6', background:'#E8F7EE', color:'#3A9A5C', cursor:'pointer' }}>
                  Tout activer
                </button>
                <button onClick={() => setPermEdit(Object.fromEntries(MODULES.map(m => [m.key, false])))}
                  style={{ fontSize:11, fontWeight:600, padding:'5px 12px', borderRadius:8, border:'1px solid #E4DDD6', background:'#FDE8E8', color:'#D14343', cursor:'pointer' }}>
                  Tout désactiver
                </button>
                <button onClick={() => setPermEdit({ ...PERMISSIONS_DEFAUT[selUser.role as Role] })}
                  style={{ fontSize:11, fontWeight:600, padding:'5px 12px', borderRadius:8, border:'1px solid #E4DDD6', background:'#F6F4F1', color:'#7A736C', cursor:'pointer' }}>
                  Remettre par défaut
                </button>
              </div>
              {MODULES.map(m => (
                <RowPerms key={m.key} moduleKey={m.key} label={m.label} checked={!!permEdit[m.key]} />
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <BtnGhost onClick={() => { setModal(null); setSelUser(null) }}>Annuler</BtnGhost>
              <BtnPrimary onClick={savePermissions} disabled={saving}>
                <Shield size={16} />{saving ? '…' : 'Enregistrer les accès'}
              </BtnPrimary>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
