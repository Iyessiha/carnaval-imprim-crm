export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { formatFCFA } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Tableau de bord — Carnaval Imprim' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: factures },
    { data: devis },
    { data: productions },
    { data: clients },
    { data: entData },
  ] = await Promise.all([
    supabase.from('factures').select('id, tva_applicable, remise, factures_lignes(qte,pu), paiements(montant)'),
    supabase.from('devis').select('id, statut'),
    supabase.from('productions').select('id, statut, caracteristique, format, quantite, date_livraison_prevue, clients(nom)'),
    supabase.from('clients').select('id'),
    supabase.from('entreprise').select('nom, taux_tva').single(),
  ])

  const ent = entData as { nom: string; taux_tva: number } | null
  const tva = ent?.taux_tva ?? 18

  // KPIs financiers
  let caTotal = 0, caEncaisse = 0, impayes = 0
  for (const f of (factures || [])) {
    const lignes = (f as { factures_lignes?: {qte:number;pu:number}[] }).factures_lignes || []
    const remise = (f as { remise?: number }).remise || 0
    const tvaApp = (f as { tva_applicable?: boolean }).tva_applicable ?? true
    const paiements = (f as { paiements?: {montant:number}[] }).paiements || []
    const ht = lignes.reduce((s, l) => s + l.qte * l.pu, 0) - remise
    const ttc = tvaApp ? ht * (1 + tva / 100) : ht
    const paye = paiements.reduce((s, p) => s + p.montant, 0)
    caTotal += ttc
    caEncaisse += paye
    impayes += Math.max(0, ttc - paye)
  }

  const nbDevisEnvoy = (devis || []).filter(d => (d as {statut:string}).statut === 'Envoyé').length
  const nbProdActives = (productions || []).filter(p => ['En attente','En production'].includes((p as {statut:string}).statut)).length
  const nbClients = (clients || []).length

  const kpis = [
    { label: 'CA Total',          value: formatFCFA(caTotal),    color: '#2A5FA5', bg: '#E5EDF8', icon: '📊', href: '/factures' },
    { label: 'CA Encaissé',       value: formatFCFA(caEncaisse), color: '#3A9A5C', bg: '#E8F7EE', icon: '💰', href: '/factures' },
    { label: 'Montant impayé',    value: formatFCFA(impayes),    color: '#D14343', bg: '#FDE8E8', icon: '⚠️', href: '/factures' },
    { label: 'Devis en attente',  value: String(nbDevisEnvoy),   color: '#F39200', bg: '#FEF3E2', icon: '📄', href: '/devis' },
    { label: 'Productions actives', value: String(nbProdActives), color: '#7B2FA5', bg: '#F0E8F8', icon: '🖨️', href: '/production' },
    { label: 'Clients',           value: String(nbClients),      color: '#1B1A1C', bg: '#F0EEEC', icon: '👥', href: '/clients' },
  ]

  // Productions en retard
  const today = new Date().toISOString().slice(0, 10)
  const retards = (productions || []).filter(p => {
    const pr = p as {statut:string; date_livraison_prevue:string|null}
    return pr.date_livraison_prevue && pr.date_livraison_prevue < today && pr.statut !== 'Livré'
  })

  // Productions actives
  const actives = (productions || [])
    .filter(p => ['En attente','En production'].includes((p as {statut:string}).statut))
    .slice(0, 6)

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Tableau de bord</h1>
        <p style={{ color: '#7A736C', fontSize: 14, margin: '4px 0 0' }}>
          {ent?.nom || 'Carnaval Imprim'} — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <Link key={i} href={k.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'border-color .15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase', letterSpacing: '.3px' }}>{k.label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{k.icon}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Productions actives */}
        <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>🖨️ Productions en cours</h2>
            <Link href="/production" style={{ fontSize: 12, color: '#C2117A', textDecoration: 'none', fontWeight: 600 }}>Voir tout →</Link>
          </div>
          {actives.length === 0 ? (
            <p style={{ color: '#7A736C', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Aucune production active.</p>
          ) : actives.map(prod => {
            const p = prod as {id:string; statut:string; caracteristique:string; format?:string; quantite?:number; clients?:{nom:string}|null}
            return (
              <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid #F0EEEC' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, lineHeight: 1.3 }}>
                  {p.caracteristique.slice(0, 55)}{p.caracteristique.length > 55 ? '…' : ''}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#7A736C' }}>
                    {p.clients?.nom || '—'} · {p.quantite?.toLocaleString('fr-FR')} ex{p.format ? ` · ${p.format}` : ''}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: p.statut === 'En production' ? '#E5EDF8' : '#FEF3E2',
                    color: p.statut === 'En production' ? '#2A5FA5' : '#F39200'
                  }}>{p.statut}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Alertes retards */}
        <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>⚠️ Retards & urgences</h2>
            <span style={{ fontSize: 12, fontWeight: 700, background: retards.length > 0 ? '#FDE8E8' : '#E8F7EE', color: retards.length > 0 ? '#D14343' : '#3A9A5C', padding: '3px 10px', borderRadius: 999 }}>
              {retards.length} retard{retards.length > 1 ? 's' : ''}
            </span>
          </div>
          {retards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <p style={{ color: '#3A9A5C', fontSize: 14, fontWeight: 600, margin: 0 }}>Aucun retard — tout est à jour !</p>
            </div>
          ) : retards.slice(0, 5).map(prod => {
            const p = prod as {id:string; caracteristique:string; date_livraison_prevue:string; clients?:{nom:string}|null}
            const jours = Math.floor((new Date().getTime() - new Date(p.date_livraison_prevue).getTime()) / 86400000)
            return (
              <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid #F0EEEC' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#D14343', marginBottom: 4 }}>
                  {p.caracteristique.slice(0, 50)}{p.caracteristique.length > 50 ? '…' : ''}
                </div>
                <div style={{ fontSize: 11, color: '#7A736C' }}>
                  {p.clients?.nom || '—'} · <strong style={{ color: '#D14343' }}>{jours}j de retard</strong> (prévu le {new Date(p.date_livraison_prevue).toLocaleDateString('fr-FR')})
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Accès rapides */}
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>Accès rapides</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { href: '/clients', label: '+ Nouveau client', color: '#C2117A' },
            { href: '/devis', label: '+ Nouveau devis', color: '#2A5FA5' },
            { href: '/factures', label: '+ Nouvelle facture', color: '#3A9A5C' },
            { href: '/production', label: '+ Ordre de production', color: '#7B2FA5' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 10, textDecoration: 'none',
              fontSize: 13, fontWeight: 600, color: '#fff', background: a.color,
            }}>{a.label}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}
