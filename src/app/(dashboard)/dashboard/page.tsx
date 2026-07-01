import { createClient } from '@/lib/supabase/server'
import { formatFCFA, calculerTotaux } from '@/lib/utils'

export const metadata = { title: 'Tableau de bord — Carnaval Imprim CRM' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: factures },
    { data: devis },
    { data: productions },
    { data: entrepriseData },
  ] = await Promise.all([
    supabase.from('factures').select('*, factures_lignes(*), paiements(*), clients(nom)'),
    supabase.from('devis').select('id, statut'),
    supabase.from('productions').select('id, statut, caracteristique, format, quantite, clients(nom)'),
    supabase.from('entreprise').select('taux_tva').single(),
  ])

  // Cast explicite pour éviter l'erreur null
  const tva = (entrepriseData as { taux_tva: number } | null)?.taux_tva ?? 18

  const facStats = (factures || []).map((f) => {
    const lignes = (f as { factures_lignes?: {qte:number;pu:number}[] }).factures_lignes || []
    const remise = (f as { remise?: number }).remise || 0
    const tvaApp = (f as { tva_applicable?: boolean }).tva_applicable ?? true
    const paiements = (f as { paiements?: {montant:number}[] }).paiements || []
    const t = calculerTotaux(lignes, remise, tva, tvaApp)
    const paye = paiements.reduce((s, p) => s + (p.montant || 0), 0)
    return { ttc: t.ttc, paye, reste: t.ttc - paye }
  })

  const caEncaisse   = facStats.reduce((s, f) => s + f.paye, 0)
  const impayes      = facStats.reduce((s, f) => s + Math.max(0, f.reste), 0)
  const devisEnCours = (devis || []).filter((d) => (d as {statut:string}).statut === 'Envoyé').length
  const prodEnCours  = (productions || []).filter((p) => ['En attente', 'En production'].includes((p as {statut:string}).statut)).length

  const kpis = [
    { label: "CA Encaissé",        value: formatFCFA(caEncaisse), color: '#3A9A5C', bg: '#e8f7ee', icon: '💰' },
    { label: "Montant impayé",      value: formatFCFA(impayes),   color: '#D14343', bg: '#fde8e8', icon: '⚠️' },
    { label: "Devis en attente",    value: String(devisEnCours),  color: '#2A5FA5', bg: '#e5edf8', icon: '📄' },
    { label: "Productions actives", value: String(prodEnCours),   color: '#F39200', bg: '#fef3e2', icon: '🖨️' },
  ]

  const prodsActives = (productions || []).slice(0, 5).filter(
    (p) => (p as {statut:string}).statut !== 'Livré'
  )

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Tableau de bord</h1>
        <p style={{ color: '#7A736C', fontSize: 14, margin: '4px 0 0' }}>Vue d&apos;ensemble de Carnaval Imprim</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#7A736C' }}>{k.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{k.icon}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Productions à suivre</h2>
        {prodsActives.length === 0 ? (
          <p style={{ color: '#7A736C', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Aucune production en cours.</p>
        ) : (
          prodsActives.map((prod) => {
            const p = prod as { id: string; statut: string; caracteristique?: string; format?: string; quantite?: number }
            return (
              <div key={p.id} style={{ padding: 12, border: '1px solid #E4DDD6', borderRadius: 12, marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, lineHeight: 1.35 }}>
                  {(p.caracteristique || '').slice(0, 70)}{(p.caracteristique || '').length > 70 ? '…' : ''}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#7A736C' }}>
                    {p.quantite?.toLocaleString('fr-FR')} ex · {p.format}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                    background: p.statut === 'En production' ? '#e5edf8' : '#fef3e2',
                    color: p.statut === 'En production' ? '#2A5FA5' : '#F39200'
                  }}>
                    {p.statut}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
