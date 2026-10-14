import { createBrowserClient } from '@supabase/ssr'
import { proteger } from './garde'

// Client Supabase typé en any pour éviter les erreurs TypeScript
// sur insert/update avec les types générés incomplètement.
// À remplacer par les vrais types après : npx supabase gen types typescript
//
// Le client est entouré d'un garde-fou (voir ./garde.ts) : une écriture refusée en silence
// par la base (0 ligne modifiée) ou une erreur ignorée par le code appelant est désormais
// signalée à l'utilisateur au lieu de passer inaperçue.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabase(): any {
  return proteger(createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))
}
