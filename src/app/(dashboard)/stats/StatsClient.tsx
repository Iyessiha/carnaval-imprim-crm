'use client'
import { useState, useMemo } from 'react'
import { formatFCFA, calculerTotaux } from '@/lib/utils'

type FL = { qte: number; pu: number; designation?: string }
type Pmt = { montant: number; date: string }
type Facture = { id: string; date: string; tva_applicable: boolean; remise: number; fne_certifiee: boolean; client_id: string; factures_lignes: FL[]; paiements: Pmt[]; clients: { nom: string } | null }
type Devis = { id: string; date: string; statut: string; tva_applicable: boolean; remise: number; devis_lignes: FL[]; clients: { nom: string } | null }
type Production = { id: string; date: string; statut: string; quantite: number; caracteristique: string; clients: { nom: string } | null }
type Client = { id: string; nom: string; type: string; created_at: string }

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function StatsClient({ factures, devis, productions, clients, tauxTva }: {
  factures: Facture[]; devis: Devis[]; productions: Production[]; clients: Client[]; tauxTva: number
}) {
  const annee = new Date().getFullYear()
  const [anneeFiltre, setAnneeFiltre] = useState(annee)

  // CA par mois
  const caParMois = useMemo(() => {
    const mois = Array(12).fill(0).map((_, i) => ({ mois: MOIS[i], caTotal: 0, caEnc: 0 }))
    factures.filter(f => new Date(f.date).getFullYear() === anneeFiltre).forEach(f => {
      const m = new Date(f.date).getMonth()
      const t = calculerTotaux(f.factures_lignes, f.remise, tauxTva, f.tva_applicable)
      const enc = f.paiements.reduce((s, p) => s + p.montant, 0)
      mois[m].caTotal += t.ttc
      mois[m].caEnc += enc
    })
    return mois
  }, [factures, anneeFiltre, tauxTva])

  // Top clients
  const topClients = useMemo(() => {
    const map: Record<string, { nom: string; ca: number; nb: number }> = {}
    factures.filter(f => new Date(f.date).getFullYear() === anneeFiltre).forEach(f => {
      const id = f.client_id
      const t = calculerTotaux(f.factures_lignes, f.remise, tauxTva, f.tva_applicable)
      if (!map[id]) map[id] = { nom: f.clients?.nom || '—', ca: 0, nb: 0 }
      map[id].ca += t.ttc; map[id].nb++
    })
    return Object.values(map).sort((a, b) => b.ca - a.ca).slice(0, 8)
  }, [factures, anneeFiltre, tauxTva])

  // Top produits
  const topProduits = useMemo(() => {
    const map: Record<string, { designation: string; qte: number; ca: number }> = {}
    factures.filter(f => new Date(f.date).getFullYear() === anneeFiltre).forEach(f => {
      f.factures_lignes.forEach(l => {
        const key = l.designation || '—'
        if (!map[key]) map[key] = { designation: key, qte: 0, ca: 0 }
        map[key].qte += l.qte; map[key].ca += l.qte * l.pu
      })
    })
    return Object.values(map).sort((a, b) => b.ca - a.ca).slice(0, 10)
  }, [factures, anneeFiltre])

  // KPIs globaux
  const kpis = useMemo(() => {
    const fAnnee = factures.filter(f => new Date(f.date).getFullYear() === anneeFiltre)
    const caTotal = fAnnee.reduce((s, f) => s + calculerTotaux(f.factures_lignes, f.remise, tauxTva, f.tva_applicable).ttc, 0)
    const caEnc = fAnnee.reduce((s, f) => s + f.paiements.reduce((a, p) => a + p.montant, 0), 0)
    const nbFacCertifiees = fAnnee.filter(f => f.fne_certifiee).length
    const devisAnnee = devis.filter(d => new Date(d.date).getFullYear() === anneeFiltre)
    const txConversion = devisAnnee.length ? Math.round(devisAnnee.filter(d => d.statut === 'Accepté').length / devisAnnee.length * 100) : 0
    const prodAnnee = productions.filter(p => new Date(p.date).getFullYear() === anneeFiltre)
    const nbLivrees = prodAnnee.filter(p => p.statut === 'Livré').length
    return { caTotal, caEnc, caImp: caTotal - caEnc, nbFacCertifiees, txConversion, nbDevis: devisAnnee.length, nbProd: prodAnnee.length, nbLivrees }
  }, [factures, devis, productions, anneeFiltre, tauxTva])

  // Graphique barres CA mensuel
  const maxCa = Math.max(...caParMois.map(m => m.caTotal), 1)

  const BAR_H = 120
  const card = (label: string, value: string, sub?: string, color = '#C2117A', bg = '#FDE8E8') => (
    <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: '16px 18px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#7A736C', marginTop: 4 }}>{sub}</div>}
    </div>
  )

  const tbl = { th: { textAlign: 'left' as const, padding: '9px 14px', fontSize: 11, fontWeight: 700, color: '#7A736C', textTransform: 'uppercase' as const, background: '#F6F4F1', letterSpacing: '.3px' }, td: { padding: '10px 14px', fontSize: 13, borderTop: '1px solid #E4DDD6' } }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Statistiques</h1>
          <p style={{ color: '#7A736C', fontSize: 14, margin: '4px 0 0' }}>Analyse de l&apos;activité Carnaval Imprim</p>
        </div>
        <select value={anneeFiltre} onChange={e => setAnneeFiltre(Number(e.target.value))}
          style={{ padding: '10px 16px', border: '1px solid #E4DDD6', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#fff', cursor: 'pointer' }}>
          {[annee - 1, annee, annee + 1].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {card('CA Total', formatFCFA(kpis.caTotal), `${anneeFiltre}`, '#2A5FA5')}
        {card('Encaissé', formatFCFA(kpis.caEnc), `${Math.round(kpis.caEnc / Math.max(kpis.caTotal, 1) * 100)}% du CA`, '#3A9A5C')}
        {card('Impayé', formatFCFA(kpis.caImp), 'à recouvrer', '#D14343')}
        {card('Taux conversion devis', `${kpis.txConversion}%`, `${kpis.nbDevis} devis émis`, '#F39200')}
        {card('Productions', String(kpis.nbProd), `${kpis.nbLivrees} livrées`, '#7B2FA5')}
        {card('FNE certifiées', String(kpis.nbFacCertifiees), 'factures DGI', '#2A5FA5')}
      </div>

      {/* Graphique CA mensuel */}
      <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px' }}>Chiffre d&apos;affaires mensuel {anneeFiltre}</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: BAR_H + 30 }}>
          {caParMois.map((m, i) => {
            const hTotal = Math.round((m.caTotal / maxCa) * BAR_H)
            const hEnc = Math.round((m.caEnc / maxCa) * BAR_H)
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ position: 'relative', width: '100%', height: BAR_H, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
                  <div title={`CA total: ${formatFCFA(m.caTotal)}`} style={{ width: '42%', height: hTotal, background: '#E5EDF8', borderRadius: '3px 3px 0 0', minHeight: m.caTotal > 0 ? 2 : 0 }} />
                  <div title={`Encaissé: ${formatFCFA(m.caEnc)}`} style={{ width: '42%', height: hEnc, background: '#C2117A', borderRadius: '3px 3px 0 0', minHeight: m.caEnc > 0 ? 2 : 0 }} />
                </div>
                <span style={{ fontSize: 10, color: '#7A736C', fontWeight: 600 }}>{m.mois}</span>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><div style={{ width: 12, height: 12, background: '#E5EDF8', borderRadius: 3 }} /> CA facturé</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><div style={{ width: 12, height: 12, background: '#C2117A', borderRadius: 3 }} /> Encaissé</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Top clients */}
        <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #E4DDD6' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>🏆 Top clients {anneeFiltre}</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={tbl.th}>#</th><th style={tbl.th}>Client</th><th style={tbl.th}>Factures</th><th style={{ ...tbl.th, textAlign: 'right' }}>CA TTC</th></tr></thead>
            <tbody>
              {topClients.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#7A736C' }}>Aucune donnée</td></tr>
              ) : topClients.map((c, i) => (
                <tr key={i}>
                  <td style={{ ...tbl.td, fontWeight: 700, color: i === 0 ? '#F39200' : '#7A736C', width: 32 }}>#{i + 1}</td>
                  <td style={{ ...tbl.td, fontWeight: 600 }}>{c.nom}</td>
                  <td style={{ ...tbl.td, color: '#7A736C' }}>{c.nb}</td>
                  <td style={{ ...tbl.td, fontWeight: 700, textAlign: 'right', color: '#C2117A' }}>{formatFCFA(c.ca)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top produits */}
        <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #E4DDD6' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>📦 Top produits {anneeFiltre}</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={tbl.th}>#</th><th style={tbl.th}>Produit</th><th style={tbl.th}>Qté</th><th style={{ ...tbl.th, textAlign: 'right' }}>CA HT</th></tr></thead>
            <tbody>
              {topProduits.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#7A736C' }}>Aucune donnée</td></tr>
              ) : topProduits.map((p, i) => (
                <tr key={i}>
                  <td style={{ ...tbl.td, fontWeight: 700, color: i === 0 ? '#F39200' : '#7A736C', width: 32 }}>#{i + 1}</td>
                  <td style={{ ...tbl.td, maxWidth: 160 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{p.designation}</div>
                  </td>
                  <td style={{ ...tbl.td, color: '#7A736C' }}>{p.qte}</td>
                  <td style={{ ...tbl.td, fontWeight: 700, textAlign: 'right', color: '#2A5FA5' }}>{formatFCFA(p.ca)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clients par type */}
      <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 20, marginTop: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>👥 Portefeuille clients ({clients.length} total)</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['Entreprise','Institution','ONG','Particulier'].map(type => {
            const count = clients.filter(c => c.type === type).length
            const pct = clients.length ? Math.round(count / clients.length * 100) : 0
            const colors: Record<string, [string,string]> = {
              'Entreprise': ['#F0E8F8','#7B2FA5'], 'Institution': ['#E5EDF8','#2A5FA5'],
              'ONG': ['#E8F7EE','#3A9A5C'], 'Particulier': ['#F0EEEC','#7A736C']
            }
            const [bg, c] = colors[type]
            return (
              <div key={type} style={{ background: bg, borderRadius: 12, padding: '14px 20px', flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{count}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: c, marginTop: 2 }}>{type}{count > 1 ? 's' : ''}</div>
                <div style={{ fontSize: 11, color: '#7A736C', marginTop: 2 }}>{pct}% du portefeuille</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Productions par statut */}
      <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 20, marginTop: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>🖨️ Productions {anneeFiltre}</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['En attente','En production','Terminé','Livré'].map(statut => {
            const count = productions.filter(p => p.statut === statut && new Date(p.date).getFullYear() === anneeFiltre).length
            const totalQte = productions.filter(p => p.statut === statut && new Date(p.date).getFullYear() === anneeFiltre).reduce((s, p) => s + (p.quantite || 0), 0)
            const colors: Record<string, [string,string]> = {
              'En attente': ['#FEF3E2','#F39200'], 'En production': ['#E5EDF8','#2A5FA5'],
              'Terminé': ['#F0E8F8','#7B2FA5'], 'Livré': ['#E8F7EE','#3A9A5C']
            }
            const [bg, c] = colors[statut]
            return (
              <div key={statut} style={{ background: bg, borderRadius: 12, padding: '14px 20px', flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{count}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: c, marginTop: 2 }}>{statut}</div>
                <div style={{ fontSize: 11, color: '#7A736C', marginTop: 2 }}>{totalQte.toLocaleString('fr-FR')} ex. total</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
