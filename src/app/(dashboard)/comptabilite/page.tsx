export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import ComptaClient from './ComptaClient'
export const metadata = { title: 'Comptabilité — Carnaval Imprim CRM' }
export default async function ComptaPage() {
  const supabase = await createClient()
  const [
    { data: depenses },
    { data: factures },
    { data: paiements },
    { data: fournisseurs },
    { data: entData },
  ] = await Promise.all([
    supabase.from('depenses').select('*, fournisseurs(nom)').order('date', { ascending: false }),
    supabase.from('factures').select('id, numero, date, tva_applicable, remise, fne_certifiee, client_id, factures_lignes(qte,pu), paiements(montant,date,mode,reference), clients(nom)').order('date', { ascending: false }),
    supabase.from('paiements').select('id, facture_id, date, montant, mode, reference, factures(numero, clients(nom))').order('date', { ascending: false }),
    supabase.from('fournisseurs').select('id, nom').order('nom'),
    supabase.from('entreprise').select('nom, ncc, rc, taux_tva, siege, tel, email, regime, centre_impots').single(),
  ])
  const ent = entData as Record<string,string|number> | null
  return (
    <ComptaClient
      depenses={depenses || []}
      factures={factures || []}
      paiements={paiements || []}
      fournisseurs={fournisseurs || []}
      entreprise={ent}
    />
  )
}
