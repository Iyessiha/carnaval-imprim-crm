import { createClient } from '@/lib/supabase/server'
import DevisClient from './DevisClient'

export const metadata = { title: 'Devis — Carnaval Imprim CRM' }

export default async function DevisPage() {
  const supabase = await createClient()

  const [
    { data: devis },
    { data: clients },
    { data: produits },
    { data: entreprise },
  ] = await Promise.all([
    supabase.from('devis').select('*, clients(nom), devis_lignes(*)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nom, ncc, template_fne_defaut').order('nom'),
    supabase.from('produits').select('id, nom, prix_base, unite, categorie').eq('actif', true).order('nom'),
    supabase.from('entreprise').select('taux_tva').single(),
  ])

  return (
    <DevisClient
      devis={devis || []}
      clients={clients || []}
      produits={produits || []}
      tauxTva={entreprise?.taux_tva || 18}
    />
  )
}
