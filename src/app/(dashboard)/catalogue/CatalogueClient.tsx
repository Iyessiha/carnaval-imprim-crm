'use client'
type Props = { produits: unknown[]; types: unknown[] }
export default function CatalogueClient({ produits, types }: Props) {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px' }}>Catalogue</h1>
      <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, padding: 40, textAlign: 'center', color: '#7A736C' }}>
        {produits.length} articles · Module en cours de développement…
      </div>
    </div>
  )
}
