'use client'
import { formatFCFA, calculerTotaux } from '@/lib/utils'
import type { Ligne } from './LignesEditor'

export default function TotauxBox({
  lignes, remise, tvaApplicable, tauxTva,
}: {
  lignes: Ligne[]
  remise: number
  tvaApplicable: boolean
  tauxTva: number
}) {
  const t = calculerTotaux(lignes, remise, tauxTva, tvaApplicable)

  const Row = ({ l, v, bold, accent }: { l: string; v: string; bold?: boolean; accent?: boolean }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '5px 0', fontSize: bold ? 16 : 13,
      fontWeight: bold ? 800 : 500,
      color: accent ? '#D14343' : '#1B1A1C',
    }}>
      <span style={{ color: bold ? '#1B1A1C' : '#7A736C' }}>{l}</span>
      <span style={{ color: bold ? '#C2117A' : accent ? '#D14343' : '#1B1A1C' }}>{v}</span>
    </div>
  )

  return (
    <div style={{ marginTop: 16, padding: 14, background: '#F6F4F1', borderRadius: 12 }}>
      <Row l="Sous-total" v={formatFCFA(t.sousTotal)} />
      {t.remise > 0 && <Row l="Remise" v={`- ${formatFCFA(t.remise)}`} />}
      {tvaApplicable && <Row l={`TVA (${tauxTva}%)`} v={formatFCFA(t.tva)} />}
      <div style={{ borderTop: '1px solid #E4DDD6', marginTop: 6, paddingTop: 6 }}>
        <Row l="TOTAL TTC" v={formatFCFA(t.ttc)} bold />
      </div>
    </div>
  )
}
