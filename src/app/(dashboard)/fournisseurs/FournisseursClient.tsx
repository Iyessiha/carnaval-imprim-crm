'use client'
type Props = { fournisseurs: unknown[] }
export default function FournisseursClient({ fournisseurs }: Props) {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px' }}>Fournisseurs</h1>
      <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 40, textAlign: 'center', color: '#7A736C' }}>
        {(fournisseurs as unknown[]).length} fournisseurs · Module en cours de développement…
      </div>
    </div>
  )
}
