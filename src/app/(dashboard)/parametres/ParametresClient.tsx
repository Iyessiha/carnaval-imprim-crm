'use client'
import { useState } from 'react'
import { getSupabase } from '@/lib/supabase/any'
import { BtnPrimary, BtnGhost, BtnIcon, Field, inputStyle } from '@/components/ui/index'
import Modal from '@/components/ui/Modal'
import { TableWrap, th, td, EmptyRow } from '@/components/ui/Table'
import {
  Check, Building2, Zap, Users, Plus, Pencil,
  KeyRound, ToggleLeft, ToggleRight, Shield, ShieldOff,
  Eye, EyeOff, UserCheck, UserX, RefreshCw
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────
type Profile = {
  id: string; nom: string; email: string; role: string
  actif: boolean; poste?: string; telephone?: string
  permissions?: Record<string, boolean>
  derniere_connexion?: string; created_at: string
}

const ROLES = ['Admin', 'Commercial', 'Production', 'Comptabilité'] as const
type Role = typeof ROLES[number]

const ROLE_COLORS: Record<Role, { bg: string; color: string }> = {
  'Admin':         { bg: '#FDE8E8', color: '#D14343' },
  'Commercial':    { bg: '#E5EDF8', color: '#2A5FA5' },
  'Production':    { bg: '#F0E8F8', color: '#7B2FA5' },
  'Comptabilité':  { bg: '#FEF3E2', color: '#D4780A' },
}

const MODULES = [
  { key: 'clients',      label: 'Clients',       icon: '👥' },
  { key: 'devis',        label: 'Devis',         icon: '📋' },
  { key: 'factures',     label: 'Factures',      icon: '🧾' },
  { key: 'relances',     label: 'Relances',      icon: '⚠️' },
  { key: 'production',   label: 'Production',    icon: '🖨️' },
  { key: 'livraisons',   label: 'Bons livraison',icon: '📦' },
  { key: 'bons',         label: 'Bons commande', icon: '🛒' },
  { key: 'catalogue',    label: 'Catalogue',     icon: '🗂️' },
  { key: 'fournisseurs', label: 'Fournisseurs',  icon: '🚚' },
  { key: 'comptabilite', label: 'Comptabilité',  icon: '📊' },
  { key: 'caisse',       label: 'Caisse',        icon: '💵' },
  { key: 'bons-caisse',  label: 'Bons de caisse',icon: '🧾' },
  { key: 'stats',        label: 'Statistiques',  icon: '📈' },
  { key: 'parametres',   label: 'Paramètres',    icon: '⚙️' },
]

const PERMS_DEFAUT: Record<Role, Record<string, boolean>> = {
  'Admin':         Object.fromEntries(MODULES.map(m => [m.key, true])),
  'Commercial':    { clients:true, devis:true, factures:true, relances:true, production:false, livraisons:true, bons:false, catalogue:true, fournisseurs:false, comptabilite:false, caisse:false, 'bons-caisse':false, stats:true, parametres:false },
  'Production':    { clients:false, devis:false, factures:false, relances:false, production:true, livraisons:true, bons:true, catalogue:true, fournisseurs:true, comptabilite:false, caisse:false, 'bons-caisse':false, stats:false, parametres:false },
  'Comptabilité':  { clients:true, devis:true, factures:true, relances:true, production:false, livraisons:false, bons:false, catalogue:false, fournisseurs:true, comptabilite:true, caisse:true, 'bons-caisse':true, stats:true, parametres:false },
}

// ── Composant principal ────────────────────────────────────────────
export default function ParametresClient({
  entreprise: initial, fneConfig: initialFne,
  profiles: initialProfiles, currentUserId, isAdmin
}: {
  entreprise: Record<string, unknown> | null
  fneConfig: Record<string, unknown> | null
  profiles: Profile[]
  currentUserId: string
  isAdmin: boolean
}) {
  const [tab, setTab] = useState<'entreprise' | 'fne' | 'users'>('entreprise')
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | 'password' | 'permissions' | null>(null)
  const [selUser, setSelUser] = useState<Profile | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // ── Formulaire entreprise ──────────────────────────────────────
  const [ent, setEnt] = useState<Record<string, string>>({
    nom:               String(initial?.nom           || 'CARNAVAL IMPRIM'),
    forme:             String(initial?.forme          || 'SARL'),
    capital:           String(initial?.capital        || '1000000'),
    siege:             String(initial?.siege          || 'Cocody - Blockhauss, Abidjan'),
    tel:               String(initial?.tel            || '07 19 14 13 13 / 07 58 26 53 12'),
    email:             String(initial?.email          || ''),
    rc:                String(initial?.rc             || 'CI-ABJ-03-2024-B13-05735'),
    ncc:               String(initial?.ncc            || '240220333S'),
    regime:            String(initial?.regime         || 'Réel simplifié'),
    centre_impots:     String(initial?.centre_impots  || 'Cocody'),
    taux_tva:          String(initial?.taux_tva       || '18'),
    fne_point_of_sale: String(initial?.fne_point_of_sale || ''),
    fne_establishment: String(initial?.fne_establishment || ''),
  })

  // ── Formulaire FNE ────────────────────────────────────────────
  const [fne, setFne] = useState({
    api_key:  String(initialFne?.api_key  || ''),
    url_prod: String(initialFne?.url_prod || ''),
    mode:     String(initialFne?.mode     || 'test'),
  })

  // ── Formulaire utilisateur ─────────────────────────────────────
  const emptyUser = { nom: '', email: '', password: '', role: 'Commercial' as Role, poste: '', telephone: '' }
  const [formUser, setFormUser] = useState(emptyUser)
  const [newPwd, setNewPwd] = useState('')
  const [permEdit, setPermEdit] = useState<Record<string, boolean>>({})

  // ── Helpers ────────────────────────────────────────────────────
  const flash = (msg: string, dur = 3500) => {
    setSaved(msg); setTimeout(() => setSaved(''), dur)
  }
  const closeModal = () => {
    setModal(null); setSelUser(null); setError('')
    setNewPwd(''); setShowPwd(false)
  }

  const refreshProfiles = async () => {
    setRefreshing(true)
    const sb = getSupabase()
    const { data } = await sb
      .from('profiles')
      .select('id, nom, email, role, actif, poste, telephone, permissions, derniere_connexion, created_at')
      .order('created_at')
    if (data) setProfiles(data as Profile[])
    setRefreshing(false)
  }

  // ── Sauvegarder Entreprise ─────────────────────────────────────
  const saveEnt = async () => {
    setSaving(true); setError('')
    const sb = getSupabase()
    const { error: e } = await sb.from('entreprise').update({
      nom: ent.nom, forme: ent.forme,
      capital: Number(ent.capital) || 1000000,
      siege: ent.siege, tel: ent.tel, email: ent.email || null,
      rc: ent.rc, ncc: ent.ncc, regime: ent.regime,
      centre_impots: ent.centre_impots,
      taux_tva: parseFloat(ent.taux_tva) || 18,
      fne_point_of_sale: ent.fne_point_of_sale || null,
      fne_establishment: ent.fne_establishment || null,
    }).eq('id', String(initial?.id || ''))
    setSaving(false)
    if (e) { setError(e.message); return }
    flash('✅ Informations entreprise sauvegardées')
  }

  // ── Sauvegarder FNE ───────────────────────────────────────────
  const saveFne = async () => {
    setSaving(true); setError('')
    const sb = getSupabase()
    const { error: e } = await sb.from('fne_config').update({
      api_key:  fne.api_key  || null,
      url_prod: fne.url_prod || null,
      mode:     fne.mode,
      actif:    !!(fne.api_key),
    }).gte('created_at', '2000-01-01')
    setSaving(false)
    if (e) { setError(e.message); return }
    flash('✅ Configuration FNE/DGI sauvegardée')
  }

  // ── Créer utilisateur ─────────────────────────────────────────
  const createUser = async () => {
    if (!formUser.nom.trim())   { setError('Le nom est obligatoire.'); return }
    if (!formUser.email.trim()) { setError("L'email est obligatoire."); return }
    if (!formUser.password || formUser.password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.'); return
    }
    setSaving(true); setError('')
    const sb = getSupabase()
    const { data: newId, error: e } = await sb.rpc('create_user_with_profile', {
      p_email:     formUser.email.trim().toLowerCase(),
      p_password:  formUser.password,
      p_nom:       formUser.nom.trim(),
      p_role:      formUser.role,
      p_poste:     formUser.poste     || null,
      p_telephone: formUser.telephone || null,
    })
    if (e) { setError(e.message); setSaving(false); return }

    // Appliquer les permissions par défaut du rôle
    await sb.from('profiles').update({
      permissions: PERMS_DEFAUT[formUser.role],
    }).eq('id', newId)

    await refreshProfiles()
    setSaving(false)
    closeModal()
    flash(`✅ Utilisateur « ${formUser.nom} » créé avec succès !`, 4000)
  }

  // ── Modifier utilisateur ──────────────────────────────────────
  const updateUser = async () => {
    if (!selUser) return
    if (!formUser.nom.trim()) { setError('Le nom est obligatoire.'); return }
    setSaving(true); setError('')
    const sb = getSupabase()
    const { error: e } = await sb.from('profiles').update({
      nom:       formUser.nom.trim(),
      role:      formUser.role,
      poste:     formUser.poste     || null,
      telephone: formUser.telephone || null,
    }).eq('id', selUser.id)
    if (e) { setError(e.message); setSaving(false); return }
    setProfiles(prev => prev.map(p =>
      p.id === selUser.id
        ? { ...p, nom: formUser.nom, role: formUser.role, poste: formUser.poste, telephone: formUser.telephone }
        : p
    ))
    setSaving(false); closeModal()
    flash(`✅ Profil de « ${formUser.nom} » mis à jour`)
  }

  // ── Changer mot de passe ──────────────────────────────────────
  const changePassword = async () => {
    if (!selUser) return
    if (!newPwd || newPwd.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.'); return
    }
    setSaving(true); setError('')
    const sb = getSupabase()
    const { error: e } = await sb.rpc('admin_set_password', {
      p_user_id:    selUser.id,
      p_new_password: newPwd,
    })
    setSaving(false)
    if (e) { setError(e.message); return }
    closeModal()
    flash(`✅ Mot de passe de « ${selUser.nom} » modifié`)
  }

  // ── Activer / Désactiver ──────────────────────────────────────
  const toggleActif = async (p: Profile) => {
    if (p.id === currentUserId) {
      setError('Vous ne pouvez pas désactiver votre propre compte.'); return
    }
    const sb = getSupabase()
    const { error: e } = await sb.rpc('admin_toggle_user', {
      p_user_id: p.id,
      p_actif:   !p.actif,
    })
    if (e) { setError(e.message); return }
    setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, actif: !x.actif } : x))
    flash(`✅ « ${p.nom} » ${!p.actif ? 'activé' : 'désactivé'}`)
  }

  // ── Sauvegarder permissions ───────────────────────────────────
  const savePermissions = async () => {
    if (!selUser) return
    setSaving(true); setError('')
    const sb = getSupabase()
    const { error: e } = await sb.from('profiles')
      .update({ permissions: permEdit })
      .eq('id', selUser.id)
    if (e) { setError(e.message); setSaving(false); return }
    setProfiles(prev => prev.map(p =>
      p.id === selUser.id ? { ...p, permissions: permEdit } : p
    ))
    setSaving(false); closeModal()
    flash(`✅ Accès de « ${selUser.nom} » mis à jour`)
  }

  // ── Styles tabs ───────────────────────────────────────────────
  const tabBtn = (k: string) => ({
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
    background: tab === k ? '#fff' : 'transparent',
    color: tab === k ? '#C2117A' : '#7A736C',
    boxShadow: tab === k ? '0 1px 6px rgba(0,0,0,.1)' : 'none',
    transition: 'all .15s',
  } as React.CSSProperties)

  // ── Toggle permission inline ──────────────────────────────────
  const ToggleSwitch = ({ k, checked }: { k: string; checked: boolean }) => (
    <button
      onClick={() => setPermEdit(p => ({ ...p, [k]: !p[k] }))}
      style={{
        position: 'relative', width: 44, height: 24, border: 'none',
        borderRadius: 999, cursor: 'pointer', flexShrink: 0, padding: 0,
        background: checked ? '#C2117A' : '#E4DDD6',
        transition: 'background .2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: checked ? 22 : 3,
        width: 18, height: 18, background: '#fff', borderRadius: '50%',
        boxShadow: '0 1px 4px rgba(0,0,0,.25)', transition: 'left .18s',
      }} />
    </button>
  )

  // ── Rendu ─────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 900 }}>

      {/* En-tête */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Paramètres</h1>
        <p style={{ color: '#7A736C', fontSize: 13, margin: '4px 0 0' }}>
          Configuration de Carnaval Imprim CRM
        </p>
      </div>

      {/* Notifications */}
      {saved && (
        <div style={{ background: '#E8F7EE', color: '#2D7A4E', border: '1px solid #B7E4C7', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: 14 }}>
          {saved}
        </div>
      )}
      {error && (
        <div style={{ background: '#FDE8E8', color: '#D14343', border: '1px solid #F5AAAA', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D14343', fontSize: 18, padding: '0 0 0 12px', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#F6F4F1', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {([
          { k: 'entreprise', label: 'Entreprise',    Icon: Building2 },
          { k: 'fne',        label: 'FNE / DGI',     Icon: Zap },
          { k: 'users',      label: 'Utilisateurs',  Icon: Users },
        ] as const).map(({ k, label, Icon }) => (
          <button key={k} onClick={() => { setTab(k as typeof tab); setError('') }} style={tabBtn(k)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ══════════════════ ONGLET ENTREPRISE ══════════════════ */}
      {tab === 'entreprise' && (
        <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 24, maxWidth: 680 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px', color: '#1B1A1C' }}>
            Informations légales &amp; configuration
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Raison sociale">
              <input style={inputStyle} value={ent.nom} onChange={e => setEnt(p => ({ ...p, nom: e.target.value }))} />
            </Field>
            <Field label="Forme juridique">
              <input style={inputStyle} value={ent.forme} onChange={e => setEnt(p => ({ ...p, forme: e.target.value }))} placeholder="SARL" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Capital social (FCFA)">
              <input type="number" style={inputStyle} value={ent.capital} onChange={e => setEnt(p => ({ ...p, capital: e.target.value }))} />
            </Field>
            <Field label="Siège social">
              <input style={inputStyle} value={ent.siege} onChange={e => setEnt(p => ({ ...p, siege: e.target.value }))} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Téléphone(s)">
              <input style={inputStyle} value={ent.tel} onChange={e => setEnt(p => ({ ...p, tel: e.target.value }))} />
            </Field>
            <Field label="Email">
              <input type="email" style={inputStyle} value={ent.email} onChange={e => setEnt(p => ({ ...p, email: e.target.value }))} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="RC (RCCM)">
              <input style={inputStyle} value={ent.rc} onChange={e => setEnt(p => ({ ...p, rc: e.target.value }))} />
            </Field>
            <Field label="NCC">
              <input style={inputStyle} value={ent.ncc} onChange={e => setEnt(p => ({ ...p, ncc: e.target.value }))} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Régime d'imposition">
              <input style={inputStyle} value={ent.regime} onChange={e => setEnt(p => ({ ...p, regime: e.target.value }))} />
            </Field>
            <Field label="Centre des impôts">
              <input style={inputStyle} value={ent.centre_impots} onChange={e => setEnt(p => ({ ...p, centre_impots: e.target.value }))} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Taux TVA (%)">
              <input type="number" min="0" max="100" step="0.5" style={inputStyle} value={ent.taux_tva} onChange={e => setEnt(p => ({ ...p, taux_tva: e.target.value }))} />
            </Field>
            <Field label="FNE Point de vente">
              <input style={inputStyle} value={ent.fne_point_of_sale} onChange={e => setEnt(p => ({ ...p, fne_point_of_sale: e.target.value }))} />
            </Field>
            <Field label="FNE Établissement">
              <input style={inputStyle} value={ent.fne_establishment} onChange={e => setEnt(p => ({ ...p, fne_establishment: e.target.value }))} />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <BtnPrimary onClick={saveEnt} disabled={saving}>
              <Check size={16} /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </BtnPrimary>
          </div>
        </div>
      )}

      {/* ══════════════════ ONGLET FNE ══════════════════ */}
      {tab === 'fne' && (
        <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 24, maxWidth: 560 }}>
          <div style={{ background: 'linear-gradient(135deg,#1B3A5C,#2A5FA5)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, color: '#fff' }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>🏛️ FNE — Facture Normalisée Électronique</div>
            <div style={{ fontSize: 12, opacity: .85 }}>DGI Côte d&apos;Ivoire · services.fne.dgi.gouv.ci</div>
            <div style={{ fontSize: 12, opacity: .75, marginTop: 4 }}>
              NCC : <strong>{ent.ncc}</strong> · Inscrivez-vous sur le portail DGI pour obtenir votre clé API
            </div>
          </div>
          <Field label="Mode">
            <select style={inputStyle} value={fne.mode} onChange={e => setFne(p => ({ ...p, mode: e.target.value }))}>
              <option value="test">Test (sandbox — développement)</option>
              <option value="production">Production (réel DGI)</option>
            </select>
          </Field>
          <Field label="Clé API FNE">
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: 40 }}
                value={fne.api_key}
                onChange={e => setFne(p => ({ ...p, api_key: e.target.value }))}
                placeholder="Obtenir sur services.fne.dgi.gouv.ci"
              />
              <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7A736C', display: 'flex' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Field label="URL Production FNE">
            <input style={inputStyle} value={fne.url_prod} onChange={e => setFne(p => ({ ...p, url_prod: e.target.value }))} placeholder="https://…" />
          </Field>
          <div style={{ background: '#FEF3E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            ⚠️ URL Test (sandbox) : <code>http://54.247.95.108/ws</code> — déjà configurée côté serveur.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <BtnPrimary onClick={saveFne} disabled={saving}>
              <Check size={16} /> {saving ? '…' : 'Sauvegarder'}
            </BtnPrimary>
          </div>
        </div>
      )}

      {/* ══════════════════ ONGLET UTILISATEURS ══════════════════ */}
      {tab === 'users' && (
        <div>
          {!isAdmin && (
            <div style={{ background: '#FEF3E2', border: '1px solid #F7941D', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
              ⚠️ Accès lecture seule — seuls les Administrateurs peuvent gérer les utilisateurs.
            </div>
          )}

          {/* KPIs rôles */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {ROLES.map(r => {
              const count = profiles.filter(p => p.role === r).length
              const { bg, color } = ROLE_COLORS[r]
              return (
                <div key={r} style={{ background: bg, borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 90 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color }}>{count}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 2 }}>{r}</div>
                </div>
              )
            })}
            <div style={{ background: '#F0EEEC', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#7A736C' }}>{profiles.filter(p => !p.actif).length}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7A736C', marginTop: 2 }}>Inactifs</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {isAdmin && (
              <button onClick={() => { setFormUser(emptyUser); setError(''); setModal('create') }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#C2117A', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={16} /> Nouvel utilisateur
              </button>
            )}
            <button onClick={refreshProfiles} disabled={refreshing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F6F4F1', color: '#1B1A1C', border: '1px solid #E4DDD6', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Actualiser
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>

          {/* Tableau utilisateurs */}
          <TableWrap minWidth={860}>
            <thead>
              <tr>
                {['Utilisateur', 'Email', 'Rôle', 'Poste', 'Statut', 'Dernière connexion', 'Actions'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const rc = ROLE_COLORS[p.role as Role] || { bg: '#F0EEEC', color: '#7A736C' }
                const isMe = p.id === currentUserId
                return (
                  <tr key={p.id} style={{ opacity: p.actif ? 1 : .55, background: isMe ? '#FFFBF9' : undefined }}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: rc.bg, color: rc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                          {p.nom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>
                            {p.nom}
                            {isMe && <span style={{ fontSize: 9, background: '#E5EDF8', color: '#2A5FA5', padding: '1px 6px', borderRadius: 999, marginLeft: 6, fontWeight: 800 }}>MOI</span>}
                          </div>
                          {p.telephone && <div style={{ fontSize: 11, color: '#7A736C' }}>📞 {p.telephone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...td, fontSize: 12, color: '#7A736C' }}>{p.email || '—'}</td>
                    <td style={td}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: rc.bg, color: rc.color }}>
                        {p.role === 'Admin' ? '👑 ' : ''}{p.role}
                      </span>
                    </td>
                    <td style={{ ...td, fontSize: 12, color: '#7A736C' }}>{p.poste || '—'}</td>
                    <td style={td}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: p.actif ? '#E8F7EE' : '#F0EEEC', color: p.actif ? '#2D7A4E' : '#7A736C' }}>
                        {p.actif ? <UserCheck size={12} /> : <UserX size={12} />}
                        {p.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ ...td, fontSize: 12, color: '#7A736C' }}>
                      {p.derniere_connexion
                        ? new Date(p.derniere_connexion).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Jamais'}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          {/* Modifier */}
                          <BtnIcon title="Modifier le profil" onClick={() => {
                            setSelUser(p)
                            setFormUser({ nom: p.nom, email: p.email, password: '', role: p.role as Role, poste: p.poste || '', telephone: p.telephone || '' })
                            setError(''); setModal('edit')
                          }}>
                            <Pencil size={14} />
                          </BtnIcon>
                          {/* Mot de passe */}
                          <BtnIcon title="Changer le mot de passe" onClick={() => {
                            setSelUser(p); setNewPwd(''); setShowPwd(false); setError(''); setModal('password')
                          }}>
                            <KeyRound size={14} />
                          </BtnIcon>
                          {/* Permissions */}
                          <BtnIcon title="Gérer les accès modules" onClick={() => {
                            setSelUser(p)
                            setPermEdit({ ...PERMS_DEFAUT[p.role as Role], ...(p.permissions || {}) })
                            setError(''); setModal('permissions')
                          }}>
                            {p.role === 'Admin' ? <Shield size={14} /> : <ShieldOff size={14} />}
                          </BtnIcon>
                          {/* Activer/Désactiver */}
                          {!isMe && (
                            <BtnIcon title={p.actif ? 'Désactiver' : 'Activer'} onClick={() => toggleActif(p)}>
                              {p.actif
                                ? <ToggleRight size={18} style={{ color: '#2D7A4E' }} />
                                : <ToggleLeft size={18} style={{ color: '#7A736C' }} />}
                            </BtnIcon>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {profiles.length === 0 && <EmptyRow text="Aucun utilisateur." cols={7} />}
            </tbody>
          </TableWrap>

          {/* Légende rôles */}
          <div style={{ marginTop: 24, background: '#F6F4F1', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#7A736C', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
              Permissions par défaut selon le rôle
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
              {ROLES.map(r => {
                const perms = PERMS_DEFAUT[r]
                const { bg, color } = ROLE_COLORS[r]
                const count = Object.values(perms).filter(Boolean).length
                return (
                  <div key={r} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: '1px solid #E4DDD6' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color, background: bg, display: 'inline-block', padding: '2px 10px', borderRadius: 999, marginBottom: 8 }}>
                      {r === 'Admin' ? '👑 ' : ''}{r}
                    </div>
                    <div style={{ fontSize: 11, color: '#7A736C', marginBottom: 4 }}>{count}/{MODULES.length} modules</div>
                    <div style={{ fontSize: 11, color: '#7A736C', lineHeight: 1.6 }}>
                      {MODULES.filter(m => perms[m.key]).map(m => m.label).join(' · ')}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ MODAL CRÉER ══════════════════ */}
      {modal === 'create' && (
        <Modal title="Nouvel utilisateur" onClose={closeModal} wide>
          {error && <div style={{ background: '#FDE8E8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nom complet *">
              <input style={inputStyle} value={formUser.nom} onChange={e => setFormUser(p => ({ ...p, nom: e.target.value }))} placeholder="Ex: Kouadio Jean" autoFocus />
            </Field>
            <Field label="Adresse email *">
              <input type="email" style={inputStyle} value={formUser.email} onChange={e => setFormUser(p => ({ ...p, email: e.target.value }))} placeholder="jean@carnavalimprim.ci" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Mot de passe * (min. 8 caractères)">
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 40 }}
                  value={formUser.password} onChange={e => setFormUser(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
                <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7A736C', display: 'flex' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <Field label="Rôle *">
              <select style={inputStyle} value={formUser.role} onChange={e => setFormUser(p => ({ ...p, role: e.target.value as Role }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Poste / Fonction">
              <input style={inputStyle} value={formUser.poste} onChange={e => setFormUser(p => ({ ...p, poste: e.target.value }))} placeholder="Ex: Commerciale" />
            </Field>
            <Field label="Téléphone">
              <input style={inputStyle} value={formUser.telephone} onChange={e => setFormUser(p => ({ ...p, telephone: e.target.value }))} placeholder="07 XX XX XX XX" />
            </Field>
          </div>
          {/* Aperçu permissions */}
          <div style={{ background: '#F6F4F1', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 6 }}>
              Accès par défaut pour le rôle « {formUser.role} »
            </div>
            <div style={{ fontSize: 12, color: '#7A736C', lineHeight: 1.7 }}>
              {MODULES.filter(m => PERMS_DEFAUT[formUser.role]?.[m.key]).map(m => `${m.icon} ${m.label}`).join('  ·  ') || 'Aucun accès'}
            </div>
            <div style={{ fontSize: 11, color: '#C2117A', marginTop: 6 }}>
              Vous pourrez personnaliser les accès après la création.
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <BtnGhost onClick={closeModal}>Annuler</BtnGhost>
            <BtnPrimary onClick={createUser} disabled={saving}>
              <Plus size={16} /> {saving ? 'Création en cours…' : 'Créer l\'utilisateur'}
            </BtnPrimary>
          </div>
        </Modal>
      )}

      {/* ══════════════════ MODAL MODIFIER ══════════════════ */}
      {modal === 'edit' && selUser && (
        <Modal title={`Modifier — ${selUser.nom}`} onClose={closeModal}>
          {error && <div style={{ background: '#FDE8E8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <Field label="Nom complet">
            <input style={inputStyle} value={formUser.nom} onChange={e => setFormUser(p => ({ ...p, nom: e.target.value }))} autoFocus />
          </Field>
          <Field label="Email (lecture seule)">
            <input style={{ ...inputStyle, background: '#F6F4F1', color: '#7A736C' }} value={formUser.email} readOnly />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Rôle">
              <select style={inputStyle} value={formUser.role}
                disabled={selUser.id === currentUserId}
                onChange={e => setFormUser(p => ({ ...p, role: e.target.value as Role }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Poste / Fonction">
              <input style={inputStyle} value={formUser.poste} onChange={e => setFormUser(p => ({ ...p, poste: e.target.value }))} />
            </Field>
          </div>
          <Field label="Téléphone">
            <input style={inputStyle} value={formUser.telephone} onChange={e => setFormUser(p => ({ ...p, telephone: e.target.value }))} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <BtnGhost onClick={closeModal}>Annuler</BtnGhost>
            <BtnPrimary onClick={updateUser} disabled={saving}>
              <Check size={16} /> {saving ? '…' : 'Sauvegarder'}
            </BtnPrimary>
          </div>
        </Modal>
      )}

      {/* ══════════════════ MODAL MOT DE PASSE ══════════════════ */}
      {modal === 'password' && selUser && (
        <Modal title={`Mot de passe — ${selUser.nom}`} onClose={closeModal}>
          {error && <div style={{ background: '#FDE8E8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <div style={{ background: '#FEF3E2', border: '1px solid #F7941D', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
            ⚠️ Le nouveau mot de passe sera actif immédiatement.<br />
            Communiquez-le à <strong>{selUser.nom}</strong> de façon sécurisée (SMS, remise en main propre).
          </div>
          <Field label="Nouveau mot de passe (min. 8 caractères)">
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 40 }}
                value={newPwd} onChange={e => setNewPwd(e.target.value)}
                placeholder="••••••••" autoFocus />
              <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7A736C', display: 'flex' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          {newPwd.length > 0 && newPwd.length < 8 && (
            <div style={{ fontSize: 12, color: '#D14343', marginBottom: 8 }}>
              {8 - newPwd.length} caractère{8 - newPwd.length > 1 ? 's' : ''} manquant{8 - newPwd.length > 1 ? 's' : ''}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <BtnGhost onClick={closeModal}>Annuler</BtnGhost>
            <BtnPrimary onClick={changePassword} disabled={saving || newPwd.length < 8}>
              <KeyRound size={16} /> {saving ? '…' : 'Changer le mot de passe'}
            </BtnPrimary>
          </div>
        </Modal>
      )}

      {/* ══════════════════ MODAL PERMISSIONS ══════════════════ */}
      {modal === 'permissions' && selUser && (
        <Modal title={`Accès modules — ${selUser.nom}`} onClose={closeModal} wide>
          {error && <div style={{ background: '#FDE8E8', color: '#D14343', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <div style={{ background: '#E5EDF8', border: '1px solid #B8D0EF', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
            <strong>{selUser.nom}</strong> · Rôle actuel : <strong>{selUser.role}</strong><br />
            <span style={{ fontSize: 11, color: '#2A5FA5', marginTop: 4, display: 'block' }}>
              Personnalisez les accès de cet utilisateur indépendamment de son rôle.
            </span>
          </div>

          {/* Boutons rapides */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setPermEdit(Object.fromEntries(MODULES.map(m => [m.key, true])))}
              style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid #B7E4C7', background: '#E8F7EE', color: '#2D7A4E', cursor: 'pointer' }}>
              ✅ Tout activer
            </button>
            <button onClick={() => setPermEdit(Object.fromEntries(MODULES.map(m => [m.key, false])))}
              style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid #F5AAAA', background: '#FDE8E8', color: '#D14343', cursor: 'pointer' }}>
              ❌ Tout désactiver
            </button>
            <button onClick={() => setPermEdit({ ...PERMS_DEFAUT[selUser.role as Role] })}
              style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid #E4DDD6', background: '#F6F4F1', color: '#7A736C', cursor: 'pointer' }}>
              🔄 Défaut du rôle
            </button>
          </div>

          {/* Liste des modules */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            {MODULES.map(m => (
              <div key={m.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F0EEEC' }}>
                <span style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{m.icon}</span> {m.label}
                </span>
                <ToggleSwitch k={m.key} checked={!!permEdit[m.key]} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <div style={{ fontSize: 12, color: '#7A736C' }}>
              {Object.values(permEdit).filter(Boolean).length}/{MODULES.length} modules activés
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <BtnGhost onClick={closeModal}>Annuler</BtnGhost>
              <BtnPrimary onClick={savePermissions} disabled={saving}>
                <Shield size={16} /> {saving ? '…' : 'Enregistrer les accès'}
              </BtnPrimary>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
