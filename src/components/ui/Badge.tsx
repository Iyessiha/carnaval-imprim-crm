'use client'

const COLORS: Record<string, { bg: string; color: string }> = {
  // Devis
  'Brouillon':     { bg: '#F0EEEC', color: '#7A736C' },
  'Envoyé':        { bg: '#E5EDF8', color: '#2A5FA5' },
  'Accepté':       { bg: '#E8F7EE', color: '#3A9A5C' },
  'Refusé':        { bg: '#FDE8E8', color: '#D14343' },
  // Production
  'En attente':    { bg: '#FEF3E2', color: '#F39200' },
  'En production': { bg: '#E5EDF8', color: '#2A5FA5' },
  'Terminé':       { bg: '#F0E8F8', color: '#7B2FA5' },
  'Livré':         { bg: '#E8F7EE', color: '#3A9A5C' },
  // Paiement
  'Impayée':       { bg: '#FDE8E8', color: '#D14343' },
  'Partiel':       { bg: '#FEF3E2', color: '#F39200' },
  'Payée':         { bg: '#E8F7EE', color: '#3A9A5C' },
  // FNE
  'Certifiée':     { bg: '#E8F7EE', color: '#3A9A5C' },
  'Non certifiée': { bg: '#F0EEEC', color: '#7A736C' },
  'En cours':      { bg: '#E5EDF8', color: '#2A5FA5' },
  'Reçu':          { bg: '#E8F7EE', color: '#3A9A5C' },
  'Annulé':        { bg: '#FDE8E8', color: '#D14343' },
  // Templates FNE
  'B2B': { bg: '#E5EDF8', color: '#2A5FA5' },
  'B2G': { bg: '#F0E8F8', color: '#7B2FA5' },
  'B2C': { bg: '#E8F7EE', color: '#3A9A5C' },
  'B2F': { bg: '#FEF3E2', color: '#F39200' },
}

export default function Badge({ value }: { value: string }) {
  const c = COLORS[value] || { bg: '#F0EEEC', color: '#7A736C' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, padding: '3px 10px',
      borderRadius: 999, whiteSpace: 'nowrap',
      background: c.bg, color: c.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
      {value}
    </span>
  )
}
