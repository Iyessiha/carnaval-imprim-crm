import { createBrowserClient } from '@supabase/ssr'

// Client Supabase typé en any pour éviter les erreurs TypeScript
// sur insert/update avec les types générés incomplètement.
// À remplacer par les vrais types après : npx supabase gen types typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabase(): any {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
