'use client'
type Props = { productions: unknown[]; clients: unknown[]; types: unknown[]; profiles: unknown[] }
export default function ProductionClient({ productions }: Props) {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px' }}>Production</h1>
      <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 40, textAlign: 'center', color: '#7A736C' }}>
        {(productions as unknown[]).length} ordres · Module en cours de développement…
      </div>
    </div>
  )
}
