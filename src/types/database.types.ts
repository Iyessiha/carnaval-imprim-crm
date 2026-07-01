// Types Supabase — stub permissif pour le build
// Régénérer avec : npx supabase gen types typescript --project-id lpgflgekyxluhyyjxmsj

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: Record<string, never>
    Functions: {
      next_numero: {
        Args: { p_type: string; p_annee: number }
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}
