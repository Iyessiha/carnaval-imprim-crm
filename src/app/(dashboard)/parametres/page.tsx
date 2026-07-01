import { createClient } from '@/lib/supabase/server'
import ParametresClient from './ParametresClient'

export const metadata = { title: 'Paramètres — Carnaval Imprim CRM' }

export default async function ParametresPage() {
  const supabase = await createClient()
  const [{ data: entrepriseData }, { data: fneData }, { data: profiles }] = await Promise.all([
    supabase.from('entreprise').select('*').single(),
    supabase.from('fne_config').select('*').single(),
    supabase.from('profiles').select('*').order('nom'),
  ])
  const entreprise = entrepriseData as Record<string, unknown> | null
  const fneConfig = fneData as Record<string, unknown> | null
  return <ParametresClient entreprise={entreprise} fneConfig={fneConfig} profiles={profiles || []} />
}
