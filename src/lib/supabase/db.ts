'use client'
import { createClient } from '@/lib/supabase/client'

// Helper qui bypasse les erreurs TypeScript sur insert/update
// Nécessaire tant que database.types.ts est un stub générique
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function db(table: string): any {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table)
}

export { createClient }
