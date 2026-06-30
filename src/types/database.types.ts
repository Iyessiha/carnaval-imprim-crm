// ⚠️ Ce fichier est un stub — régénérez-le avec :
// npx supabase gen types typescript --project-id VOTRE_PROJECT_ID --schema public > src/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; nom: string; email: string; role: string; actif: boolean; created_at: string; updated_at: string }
        Insert: { id: string; nom: string; email: string; role?: string; actif?: boolean }
        Update: { nom?: string; email?: string; role?: string; actif?: boolean }
      }
      entreprise: {
        Row: { id: string; nom: string; forme: string; siege: string; tel: string; email: string; rc: string; ncc: string; regime: string; centre_impots: string; taux_tva: number; logo_url: string | null; signature_url: string | null; fne_point_of_sale: string | null; fne_establishment: string | null; created_at: string; updated_at: string }
        Insert: { nom?: string; forme?: string }
        Update: { nom?: string; forme?: string; siege?: string; tel?: string; email?: string; rc?: string; ncc?: string; regime?: string; centre_impots?: string; taux_tva?: number; logo_url?: string | null; signature_url?: string | null; fne_point_of_sale?: string | null; fne_establishment?: string | null }
      }
      clients: {
        Row: { id: string; nom: string; contact: string | null; telephone: string | null; email: string | null; adresse: string | null; ncc: string | null; type: string; template_fne_defaut: string; notes: string | null; created_at: string; updated_at: string }
        Insert: { nom: string; contact?: string; telephone?: string; email?: string; adresse?: string; ncc?: string; type?: string; template_fne_defaut?: string; notes?: string }
        Update: { nom?: string; contact?: string; telephone?: string; email?: string; adresse?: string; ncc?: string; type?: string; template_fne_defaut?: string; notes?: string }
      }
      produits: {
        Row: { id: string; nom: string; categorie: string; type_impression_id: string | null; prix_base: number; unite: string; description: string | null; actif: boolean; created_at: string; updated_at: string }
        Insert: { nom: string; categorie: string; prix_base?: number; unite?: string; description?: string; actif?: boolean }
        Update: { nom?: string; categorie?: string; prix_base?: number; unite?: string; description?: string; actif?: boolean }
      }
      devis: {
        Row: { id: string; numero: string; client_id: string; date: string; validite: string | null; statut: string; remise: number; tva_applicable: boolean; notes: string | null; created_by: string | null; created_at: string; updated_at: string }
        Insert: { numero: string; client_id: string; date?: string; statut?: string; remise?: number; tva_applicable?: boolean; notes?: string }
        Update: { statut?: string; remise?: number; tva_applicable?: boolean; notes?: string; validite?: string }
      }
      devis_lignes: {
        Row: { id: string; devis_id: string; produit_id: string | null; designation: string; qte: number; pu: number; remise_ligne: number; ordre: number }
        Insert: { devis_id: string; designation: string; qte: number; pu: number; remise_ligne?: number; ordre?: number }
        Update: { designation?: string; qte?: number; pu?: number; remise_ligne?: number; ordre?: number }
      }
      factures: {
        Row: { id: string; numero: string; client_id: string; devis_id: string | null; date: string; echeance: string | null; remise: number; tva_applicable: boolean; notes: string | null; is_avoir: boolean; facture_origine_id: string | null; template_fne: string; payment_method_fne: string; fne_certifiee: boolean; fne_reference: string | null; qr_code_url: string | null; created_by: string | null; created_at: string; updated_at: string }
        Insert: { numero: string; client_id: string; date?: string; template_fne?: string; payment_method_fne?: string; remise?: number; tva_applicable?: boolean; notes?: string }
        Update: { echeance?: string; remise?: number; notes?: string; template_fne?: string; payment_method_fne?: string; fne_certifiee?: boolean; fne_reference?: string; qr_code_url?: string }
      }
      factures_lignes: {
        Row: { id: string; facture_id: string; produit_id: string | null; designation: string; qte: number; pu: number; remise_ligne: number; taxes: string[]; custom_taxes: Json | null; reference_article: string | null; measurement_unit: string | null; ordre: number }
        Insert: { facture_id: string; designation: string; qte: number; pu: number; taxes?: string[]; measurement_unit?: string; ordre?: number }
        Update: { designation?: string; qte?: number; pu?: number; taxes?: string[]; measurement_unit?: string }
      }
      paiements: {
        Row: { id: string; facture_id: string; date: string; montant: number; mode: string; reference: string | null; notes: string | null; created_at: string }
        Insert: { facture_id: string; date?: string; montant: number; mode: string; reference?: string; notes?: string }
        Update: { montant?: number; mode?: string; reference?: string }
      }
      fne_config: {
        Row: { id: string; api_key: string | null; url_test: string | null; url_prod: string | null; mode: string; balance_stickers: number; actif: boolean; created_at: string; updated_at: string }
        Insert: { mode?: string }
        Update: { api_key?: string; url_prod?: string; mode?: string; balance_stickers?: number; actif?: boolean }
      }
      fne_transmissions: {
        Row: { id: string; facture_id: string; statut: string; invoice_type: string; template: string; payment_method: string; fne_reference: string | null; fne_token: string | null; qr_code_url: string | null; balance_stickers: number | null; response_raw: Json | null; error_message: string | null; transmitted_at: string | null; created_at: string }
        Insert: { facture_id: string; invoice_type: string; template: string; payment_method: string; statut?: string }
        Update: { statut?: string; fne_reference?: string; fne_token?: string; qr_code_url?: string; response_raw?: Json; error_message?: string; transmitted_at?: string }
      }
      productions: {
        Row: { id: string; date: string; nature: string; caracteristique: string; type_impression_id: string | null; papier: string | null; recto_verso: boolean; nb_pages: number | null; finition: string | null; format: string | null; quantite: number; statut: string; date_livraison_prevue: string | null; client_id: string | null; devis_id: string | null; facture_id: string | null; assign_a: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { date?: string; caracteristique: string; quantite: number; statut?: string }
        Update: { caracteristique?: string; type_impression_id?: string; papier?: string; recto_verso?: boolean; nb_pages?: number; finition?: string; format?: string; quantite?: number; statut?: string; date_livraison_prevue?: string; client_id?: string; assign_a?: string }
      }
      fournisseurs: {
        Row: { id: string; nom: string; contact: string | null; telephone: string | null; email: string | null; adresse: string | null; produits_fournis: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { nom: string; contact?: string; telephone?: string; email?: string }
        Update: { nom?: string; contact?: string; telephone?: string; email?: string; adresse?: string; produits_fournis?: string; notes?: string }
      }
      bons_commande_fournisseurs: {
        Row: { id: string; numero: string; fournisseur_id: string; date: string; statut: string; notes: string | null; created_by: string | null; created_at: string; updated_at: string }
        Insert: { numero: string; fournisseur_id: string; date?: string; statut?: string }
        Update: { statut?: string; notes?: string }
      }
      types_impression: {
        Row: { id: string; libelle: string }
        Insert: { libelle: string }
        Update: { libelle?: string }
      }
      compteurs_numero: {
        Row: { id: string; type: string; annee: number; dernier_numero: number }
        Insert: { type: string; annee: number; dernier_numero?: number }
        Update: { dernier_numero?: number }
      }
      activite_log: {
        Row: { id: string; user_id: string | null; action: string; table_cible: string; record_id: string | null; details: Json | null; created_at: string }
        Insert: { action: string; table_cible: string; user_id?: string; record_id?: string; details?: Json }
        Update: never
      }
    }
    Views: {}
    Functions: {
      next_numero: {
        Args: { p_type: string; p_annee: number }
        Returns: string
      }
    }
    Enums: {}
  }
}
