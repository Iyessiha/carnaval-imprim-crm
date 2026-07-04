export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import ProductionClient from './ProductionClient'
export const metadata = { title: 'Production — Carnaval Imprim CRM' }
export default async function ProductionPage() {
  const supabase = await createClient()
  const [
    { data: productions },
    { data: clients },
    { data: devis },
    { data: types },
    { data: entData },
    { data: fournisseurs },
  ] = await Promise.all([
    supabase.from('productions').select('*, clients(nom,telephone,adresse), types_impression(libelle), fournisseurs(nom)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nom, telephone, adresse').order('nom'),
    supabase.from('devis').select('id, numero, statut, clients(nom), devis_lignes(designation,qte)').eq('statut','Accepté').order('created_at', { ascending: false }),
    supabase.from('types_impression').select('id, libelle').order('libelle'),
    supabase.from('entreprise').select('nom, siege, tel, rc, ncc').single(),
    supabase.from('fournisseurs').select('id, nom').order('nom'),
  ])
  return (
    <ProductionClient
      productions={productions||[]}
      clients={clients||[]}
      devis={devis||[]}
      types={types||[]}
      entreprise={entData as Record<string,string>|null}
      fournisseurs={fournisseurs||[]}
    />
  )
}
