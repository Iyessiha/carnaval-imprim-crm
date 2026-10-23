import { createClient } from '@supabase/supabase-js'

// Client Supabase « service role » : ignore la sécurité par ligne. À n'utiliser QUE côté
// serveur (routes API, pages serveur), jamais dans un composant client. La clé doit être
// définie dans SUPABASE_SERVICE_ROLE_KEY (Vercel → Settings → Environment Variables).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !cle) {
    throw new Error('Configuration serveur incomplète : SUPABASE_SERVICE_ROLE_KEY manquante')
  }
  return createClient(url, cle, { auth: { persistSession: false, autoRefreshToken: false } })
}
