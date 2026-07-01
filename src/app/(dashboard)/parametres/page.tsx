import { createClient } from '@/lib/supabase/server'
import ParametresClient from './ParametresClient'
export const metadata = { title: 'Paramètres — Carnaval Imprim CRM' }
export default async function ParametresPage() {
  const supabase = await createClient()
  const [{ data: entreprise }, { data: fneConfig }, { data: profiles }] = await Promise.all([
    supabase.from('entreprise').select('*').single(),
    supabase.from('fne_config').select('*').single(),
    supabase.from('profiles').select('*').order('nom'),
  ])
  return <ParametresClient entreprise={entreprise} fneConfig={fneConfig} profiles={profiles || []} />
}
