'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, CheckCircle2 } from 'lucide-react'

type Entreprise = { id:string; nom:string; forme:string; siege:string; tel:string; email:string; rc:string; ncc:string; regime:string; centre_impots:string; taux_tva:number; logo_url:string|null; fne_point_of_sale:string|null; fne_establishment:string|null }
type FneConfig = { id:string; api_key:string|null; url_test:string|null; url_prod:string|null; mode:string; balance_stickers:number; actif:boolean }
type Profile = { id:string; nom:string; email:string; role:string; actif:boolean }

const S = {
  input:{ width:'100%', padding:'10px 12px', border:'1px solid #E4DDD6', borderRadius:10, fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit' } as React.CSSProperties,
  label:{ display:'block', fontSize:11, fontWeight:700, color:'#7A736C', marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'.3px' },
  btnPrimary:{ display:'inline-flex', alignItems:'center', gap:7, background:'#C2117A', color:'#fff', border:'none', padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' } as React.CSSProperties,
  card:{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:16, padding:24, marginBottom:20 } as React.CSSProperties,
}

export default function ParametresClient({ entreprise:initE, fneConfig:initF, profiles }:{ entreprise:Entreprise|null; fneConfig:FneConfig|null; profiles:Profile[] }) {
  const supabase = createClient()
  const [e, setE] = useState(initE)
  const [f, setF] = useState(initF)
  const [savedE, setSavedE] = useState(false)
  const [savedF, setSavedF] = useState(false)

  const F = ({ label, children }:{ label:string; children:React.ReactNode }) => (
    <div style={{ marginBottom:14 }}><label style={S.label}>{label}</label>{children}</div>
  )

  const saveEntreprise = async () => {
    if (!e) return
    await supabase.from('entreprise').update(e).eq('id', e.id)
    setSavedE(true); setTimeout(()=>setSavedE(false), 2500)
  }

  const saveFne = async () => {
    if (!f) return
    await supabase.from('fne_config').update(f).eq('id', f.id)
    setSavedF(true); setTimeout(()=>setSavedF(false), 2500)
  }

  const ROLES = ['Admin','Commercial','Production','Comptabilité'] as const

  return (
    <div style={{ padding:24, maxWidth:760 }}>
      <div style={{ marginBottom:24 }}><h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Paramètres</h1></div>

      {/* Entreprise */}
      <div style={S.card}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 18px' }}>Informations de l&apos;entreprise</h2>
        {e && <>
          <F label="Nom"><input style={S.input} value={e.nom} onChange={ev=>setE(p=>p?{...p,nom:ev.target.value}:p)} /></F>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <F label="Forme juridique"><input style={S.input} value={e.forme} onChange={ev=>setE(p=>p?{...p,forme:ev.target.value}:p)} /></F>
            <F label="Siège social"><input style={S.input} value={e.siege} onChange={ev=>setE(p=>p?{...p,siege:ev.target.value}:p)} /></F>
            <F label="Téléphone"><input style={S.input} value={e.tel} onChange={ev=>setE(p=>p?{...p,tel:ev.target.value}:p)} /></F>
            <F label="E-mail"><input style={S.input} value={e.email} onChange={ev=>setE(p=>p?{...p,email:ev.target.value}:p)} /></F>
            <F label="RC N°"><input style={S.input} value={e.rc} onChange={ev=>setE(p=>p?{...p,rc:ev.target.value}:p)} /></F>
            <F label="NCC"><input style={S.input} value={e.ncc} onChange={ev=>setE(p=>p?{...p,ncc:ev.target.value}:p)} /></F>
            <F label="Régime d'imposition"><input style={S.input} value={e.regime} onChange={ev=>setE(p=>p?{...p,regime:ev.target.value}:p)} /></F>
            <F label="Centre des impôts"><input style={S.input} value={e.centre_impots} onChange={ev=>setE(p=>p?{...p,centre_impots:ev.target.value}:p)} /></F>
            <F label="Taux TVA (%)"><input type="number" style={S.input} value={e.taux_tva} onChange={ev=>setE(p=>p?{...p,taux_tva:Number(ev.target.value)}:p)} /></F>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:8 }}>
            <button onClick={saveEntreprise} style={S.btnPrimary}><Check size={16}/> Enregistrer</button>
            {savedE && <span style={{ color:'#3A9A5C', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}><CheckCircle2 size={16}/> Enregistré</span>}
          </div>
        </>}
      </div>

      {/* FNE Config */}
      <div style={S.card}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 6px' }}>Configuration FNE — DGI Côte d&apos;Ivoire</h2>
        <p style={{ fontSize:12, color:'#7A736C', margin:'0 0 18px' }}>Plateforme : services.fne.dgi.gouv.ci · NCC : 240220333S</p>
        {f && <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <F label="Clé API DGI (Bearer Token)"><input style={S.input} value={f.api_key||''} type="password" onChange={ev=>setF(p=>p?{...p,api_key:ev.target.value}:p)} placeholder="••••••••••••" /></F>
            <F label="Mode">
              <select style={S.input} value={f.mode} onChange={ev=>setF(p=>p?{...p,mode:ev.target.value}:p)}>
                <option value="test">Test</option>
                <option value="production">Production</option>
              </select>
            </F>
            <F label="URL Test"><input style={S.input} value={f.url_test||''} onChange={ev=>setF(p=>p?{...p,url_test:ev.target.value}:p)} /></F>
            <F label="URL Production"><input style={S.input} value={f.url_prod||''} onChange={ev=>setF(p=>p?{...p,url_prod:ev.target.value}:p)} placeholder="Fourni par la DGI après validation" /></F>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#F6F4F1', borderRadius:10, marginBottom:14 }}>
            <span style={{ fontSize:13, color:'#7A736C' }}>Solde stickers électroniques</span>
            <span style={{ fontSize:16, fontWeight:800, color: f.balance_stickers < 10 ? '#D14343' : '#3A9A5C' }}>{f.balance_stickers} stickers</span>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, marginBottom:16 }}>
            <input type="checkbox" checked={f.actif} onChange={ev=>setF(p=>p?{...p,actif:ev.target.checked}:p)} /> Intégration FNE activée
          </label>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={saveFne} style={S.btnPrimary}><Check size={16}/> Enregistrer</button>
            {savedF && <span style={{ color:'#3A9A5C', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}><CheckCircle2 size={16}/> Enregistré</span>}
          </div>
        </>}
      </div>

      {/* Utilisateurs */}
      <div style={S.card}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 18px' }}>Utilisateurs & rôles</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {profiles.map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:14, border:'1px solid #E4DDD6', borderRadius:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'#F5E0EE', color:'#C2117A', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15 }}>
                  {p.nom.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{p.nom}</div>
                  <div style={{ fontSize:12, color:'#7A736C' }}>{p.email}</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, fontWeight:600, color:'#7B2FA5', background:'#f0e8f7', padding:'4px 12px', borderRadius:999 }}>{p.role}</span>
                {!p.actif && <span style={{ fontSize:11, color:'#F39200', background:'#fef3e2', padding:'3px 8px', borderRadius:999 }}>Inactif</span>}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize:12, color:'#7A736C', marginTop:14, marginBottom:0 }}>
          La gestion complète des utilisateurs (invitation, suppression) se fait dans le tableau de bord Supabase → Authentication.
        </p>
      </div>

      {/* Ping anti-pause */}
      <div style={{ ...S.card, background:'#F6F4F1', border:'1px solid #E4DDD6' }}>
        <h2 style={{ fontSize:14, fontWeight:700, margin:'0 0 8px' }}>⏱️ Anti-pause Supabase</h2>
        <p style={{ fontSize:13, color:'#7A736C', margin:'0 0 10px' }}>
          Configurez un cron gratuit sur <strong>cron-job.org</strong> pour appeler cette URL toutes les 5 jours et éviter la mise en pause automatique du projet Supabase Free.
        </p>
        <div style={{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:8, padding:'10px 14px', fontFamily:'monospace', fontSize:12, color:'#C2117A', wordBreak:'break-all' }}>
          GET https://carnaval-imprim-crm.vercel.app/api/ping
        </div>
      </div>
    </div>
  )
}
