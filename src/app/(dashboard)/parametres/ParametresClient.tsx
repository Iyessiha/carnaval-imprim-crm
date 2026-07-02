'use client'
import { useState } from 'react'
import { getSupabase } from '@/lib/supabase/any'
import { BtnPrimary, Field, inputStyle } from '@/components/ui/index'
import { Check, Building2, Zap, Users } from 'lucide-react'

type Entreprise = Record<string, unknown> | null
type FneConfig = Record<string, unknown> | null
type Profile = { id: string; nom: string; email: string; role: string; actif: boolean }

export default function ParametresClient({ entreprise: initial, fneConfig: initialFne, profiles: initialProfiles }: {
  entreprise: Entreprise; fneConfig: FneConfig; profiles: Profile[]
}) {
  const [tab, setTab] = useState<'entreprise' | 'fne' | 'users'>('entreprise')
  const [ent, setEnt] = useState<Record<string, string>>({
    nom: String(initial?.nom || 'CARNAVAL IMPRIM'),
    forme: String(initial?.forme || ''),
    siege: String(initial?.siege || ''),
    tel: String(initial?.tel || ''),
    email: String(initial?.email || ''),
    rc: String(initial?.rc || ''),
    ncc: String(initial?.ncc || ''),
    regime: String(initial?.regime || ''),
    centre_impots: String(initial?.centre_impots || ''),
    taux_tva: String(initial?.taux_tva || '18'),
    fne_point_of_sale: String(initial?.fne_point_of_sale || ''),
    fne_establishment: String(initial?.fne_establishment || ''),
  })
  const [fne, setFne] = useState<Record<string, string>>({
    api_key: String(initialFne?.api_key || ''),
    url_prod: String(initialFne?.url_prod || ''),
    mode: String(initialFne?.mode || 'test'),
  })
  const [profiles, setProfiles] = useState(initialProfiles)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')

  const saveEnt = async () => {
    setSaving(true)
    const sb = getSupabase()
    await sb.from('entreprise').update({
      nom: ent.nom, forme: ent.forme, siege: ent.siege, tel: ent.tel,
      email: ent.email, rc: ent.rc, ncc: ent.ncc, regime: ent.regime,
      centre_impots: ent.centre_impots, taux_tva: parseFloat(ent.taux_tva) || 18,
      fne_point_of_sale: ent.fne_point_of_sale, fne_establishment: ent.fne_establishment,
    }).eq('ncc', ent.ncc)
    setSaving(false); setSaved('Entreprise sauvegardée ✅')
    setTimeout(() => setSaved(''), 3000)
  }

  const saveFne = async () => {
    setSaving(true)
    const sb = getSupabase()
    await sb.from('fne_config').update({
      api_key: fne.api_key || null,
      url_prod: fne.url_prod || null,
      mode: fne.mode,
      actif: !!(fne.api_key),
    }).eq('mode', initialFne?.mode || 'test')
    setSaving(false); setSaved('Configuration FNE sauvegardée ✅')
    setTimeout(() => setSaved(''), 3000)
  }

  const toggleUser = async (p: Profile) => {
    const sb = getSupabase()
    await sb.from('profiles').update({ actif: !p.actif }).eq('id', p.id)
    setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, actif: !x.actif } : x))
  }

  const TABS = [
    { key: 'entreprise', label: 'Entreprise', icon: Building2 },
    { key: 'fne', label: 'FNE / DGI', icon: Zap },
    { key: 'users', label: 'Utilisateurs', icon: Users },
  ] as const

  const ROLES = ['Admin', 'Commercial', 'Production', 'Comptabilité']
  const ROLE_COLORS: Record<string, string> = {
    'Admin': '#FDE8E8', 'Commercial': '#E5EDF8',
    'Production': '#E8F7EE', 'Comptabilité': '#FEF3E2'
  }
  const ROLE_TEXT: Record<string, string> = {
    'Admin': '#D14343', 'Commercial': '#2A5FA5',
    'Production': '#3A9A5C', 'Comptabilité': '#F39200'
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Paramètres</h1>
        <p style={{ color: '#7A736C', fontSize: 14, margin: '4px 0 0' }}>Configuration de Carnaval Imprim CRM</p>
      </div>

      {saved && <div style={{ background: '#E8F7EE', color: '#3A9A5C', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: 14 }}>{saved}</div>}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#F6F4F1', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              background: tab === t.key ? '#fff' : 'transparent',
              color: tab === t.key ? '#C2117A' : '#7A736C',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Onglet Entreprise */}
      {tab === 'entreprise' && (
        <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 24, maxWidth: 640 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px' }}>Informations légales</h2>
          <Field label="Raison sociale"><input style={inputStyle} value={ent.nom} onChange={e => setEnt(p => ({ ...p, nom: e.target.value }))} /></Field>
          <Field label="Forme juridique"><input style={inputStyle} value={ent.forme} onChange={e => setEnt(p => ({ ...p, forme: e.target.value }))} /></Field>
          <Field label="Siège social"><input style={inputStyle} value={ent.siege} onChange={e => setEnt(p => ({ ...p, siege: e.target.value }))} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Téléphone"><input style={inputStyle} value={ent.tel} onChange={e => setEnt(p => ({ ...p, tel: e.target.value }))} /></Field>
            <Field label="Email"><input type="email" style={inputStyle} value={ent.email} onChange={e => setEnt(p => ({ ...p, email: e.target.value }))} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="RC"><input style={inputStyle} value={ent.rc} onChange={e => setEnt(p => ({ ...p, rc: e.target.value }))} /></Field>
            <Field label="NCC"><input style={inputStyle} value={ent.ncc} onChange={e => setEnt(p => ({ ...p, ncc: e.target.value }))} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Régime d'imposition"><input style={inputStyle} value={ent.regime} onChange={e => setEnt(p => ({ ...p, regime: e.target.value }))} /></Field>
            <Field label="Centre des impôts"><input style={inputStyle} value={ent.centre_impots} onChange={e => setEnt(p => ({ ...p, centre_impots: e.target.value }))} /></Field>
          </div>
          <Field label="Taux TVA (%)">
            <input type="number" min="0" max="100" step="0.01" style={inputStyle} value={ent.taux_tva} onChange={e => setEnt(p => ({ ...p, taux_tva: e.target.value }))} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="FNE Point de vente"><input style={inputStyle} value={ent.fne_point_of_sale} onChange={e => setEnt(p => ({ ...p, fne_point_of_sale: e.target.value }))} /></Field>
            <Field label="FNE Établissement"><input style={inputStyle} value={ent.fne_establishment} onChange={e => setEnt(p => ({ ...p, fne_establishment: e.target.value }))} /></Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <BtnPrimary onClick={saveEnt} disabled={saving}><Check size={16} />{saving ? 'Sauvegarde…' : 'Sauvegarder'}</BtnPrimary>
          </div>
        </div>
      )}

      {/* Onglet FNE */}
      {tab === 'fne' && (
        <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 24, maxWidth: 560 }}>
          <div style={{ background: 'linear-gradient(135deg,#1B3A5C,#2A5FA5)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, color: '#fff' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🏛️ FNE — Facture Normalisée Électronique</div>
            <div style={{ fontSize: 12, opacity: .85 }}>DGI Côte d&apos;Ivoire · services.fne.dgi.gouv.ci</div>
            <div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>NCC : 240220333S · Inscrivez-vous sur le portail DGI pour obtenir votre clé API</div>
          </div>
          <Field label="Mode">
            <select style={inputStyle} value={fne.mode} onChange={e => setFne(p => ({ ...p, mode: e.target.value }))}>
              <option value="test">Test (sandbox)</option>
              <option value="production">Production (réel)</option>
            </select>
          </Field>
          <Field label="Clé API FNE">
            <input style={inputStyle} value={fne.api_key} onChange={e => setFne(p => ({ ...p, api_key: e.target.value }))}
              placeholder="Obtenir sur services.fne.dgi.gouv.ci" type="password" />
          </Field>
          <Field label="URL Production FNE">
            <input style={inputStyle} value={fne.url_prod} onChange={e => setFne(p => ({ ...p, url_prod: e.target.value }))}
              placeholder="https://..." />
          </Field>
          <div style={{ background: '#FEF3E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            ⚠️ URL Test (sandbox) : <code>http://54.247.95.108/ws</code> — déjà configurée dans la variable d&apos;environnement <code>FNE_URL_TEST</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <BtnPrimary onClick={saveFne} disabled={saving}><Check size={16} />{saving ? '…' : 'Sauvegarder'}</BtnPrimary>
          </div>
        </div>
      )}

      {/* Onglet Utilisateurs */}
      {tab === 'users' && (
        <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E4DDD6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Utilisateurs ({profiles.length})</h2>
            <div style={{ fontSize: 12, color: '#7A736C' }}>Créez de nouveaux utilisateurs depuis Supabase → Authentication</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#F6F4F1' }}>
              {['Nom', 'Email', 'Rôle', 'Statut', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase', letterSpacing: '.3px' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid #E4DDD6', opacity: p.actif ? 1 : .55 }}>
                  <td style={{ padding: '13px 16px', fontWeight: 600, fontSize: 14 }}>{p.nom}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#7A736C' }}>{p.email}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: ROLE_COLORS[p.role] || '#F0EEEC', color: ROLE_TEXT[p.role] || '#7A736C' }}>
                      {p.role}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: p.actif ? '#E8F7EE' : '#F0EEEC', color: p.actif ? '#3A9A5C' : '#7A736C' }}>
                      {p.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                    <button onClick={() => toggleUser(p)} style={{ background: 'transparent', border: '1px solid #E4DDD6', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {p.actif ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#7A736C', fontSize: 14 }}>Aucun utilisateur.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
