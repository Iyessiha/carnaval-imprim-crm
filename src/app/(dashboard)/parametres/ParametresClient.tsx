'use client'
type Props = { entreprise: unknown; fneConfig: unknown; profiles: unknown[] }
export default function ParametresClient({ profiles }: Props) {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px' }}>Paramètres</h1>
      <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 40, textAlign: 'center', color: '#7A736C' }}>
        {(profiles as unknown[]).length} utilisateurs · Module en cours de développement…
      </div>
    </div>
  )
}
