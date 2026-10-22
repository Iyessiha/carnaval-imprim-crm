-- ============================================================
-- CARNAVAL IMPRIM — Migration 00003 : correctifs de l'audit
--
-- 1. Tables et colonnes que le code utilise mais qui n'étaient créées par aucune migration
-- 2. Rôles alignés sur l'application (Secrétaire/Comptable au lieu de Commercial/Comptabilité)
-- 3. Sécurité par ligne (RLS) réelle : plus de « tout utilisateur authentifié peut tout faire »
--    - un compte désactivé ne peut plus lire ni écrire les données métier
--    - seul un administrateur peut changer un rôle, une permission ou la configuration FNE
-- 4. Garde-fous en base : factures certifiées FNE figées, caisse d'un jour fermé figée
-- 5. Conversion devis → facture atomique et idempotente (fonction creer_facture_depuis_devis)
-- ============================================================

-- ── 1. TABLES MANQUANTES ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS charges_fixes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  libelle             TEXT NOT NULL,
  montant             NUMERIC(12,0) NOT NULL DEFAULT 0 CHECK (montant >= 0),
  frequence           TEXT NOT NULL DEFAULT 'mensuelle'
                      CHECK (frequence IN ('mensuelle','trimestrielle','semestrielle','annuelle')),
  categorie           TEXT,
  prochaine_echeance  DATE,
  actif               BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS depenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  categorie       TEXT NOT NULL,
  libelle         TEXT NOT NULL,
  montant         NUMERIC(12,0) NOT NULL CHECK (montant >= 0),
  tva_deductible  NUMERIC(12,0) NOT NULL DEFAULT 0 CHECK (tva_deductible >= 0),
  mode_paiement   TEXT NOT NULL DEFAULT 'cash',
  fournisseur_id  UUID REFERENCES fournisseurs(id) ON DELETE SET NULL,
  reference       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tarifs_impression (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categorie     TEXT NOT NULL,
  designation   TEXT NOT NULL,
  format        TEXT,
  grammage      TEXT,
  finition      TEXT,
  prix_unitaire NUMERIC(12,0) NOT NULL DEFAULT 0 CHECK (prix_unitaire >= 0),
  unite         TEXT NOT NULL DEFAULT 'unité',
  actif         BOOLEAN NOT NULL DEFAULT true,
  ordre         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS caisse_ouvertures (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date        DATE NOT NULL UNIQUE,            -- une seule ouverture par jour (upsert sur date)
  solde_debut NUMERIC(12,0) NOT NULL DEFAULT 0,
  solde_fin   NUMERIC(12,0),
  ferme       BOOLEAN NOT NULL DEFAULT false,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS caisse_operations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  heure        TIME NOT NULL DEFAULT CURRENT_TIME,
  type         TEXT NOT NULL CHECK (type IN ('entree','sortie')),
  categorie    TEXT NOT NULL,
  libelle      TEXT NOT NULL,
  montant      NUMERIC(12,0) NOT NULL CHECK (montant > 0),
  facture_id   UUID REFERENCES factures(id) ON DELETE SET NULL,
  depense_id   UUID REFERENCES depenses(id) ON DELETE SET NULL,
  reference    TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['charges_fixes','depenses','tarifs_impression','caisse_ouvertures'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

-- ── 2. COLONNES MANQUANTES ───────────────────────────────────

ALTER TABLE profiles    ADD COLUMN IF NOT EXISTS poste              TEXT;
ALTER TABLE profiles    ADD COLUMN IF NOT EXISTS telephone          TEXT;
ALTER TABLE profiles    ADD COLUMN IF NOT EXISTS permissions        JSONB;   -- { module: boolean } ; NULL = droits par défaut du rôle
ALTER TABLE profiles    ADD COLUMN IF NOT EXISTS derniere_connexion TIMESTAMPTZ;

ALTER TABLE entreprise  ADD COLUMN IF NOT EXISTS capital            NUMERIC(14,0) NOT NULL DEFAULT 1000000;

ALTER TABLE productions ADD COLUMN IF NOT EXISTS numero_bl              TEXT;
ALTER TABLE productions ADD COLUMN IF NOT EXISTS date_livraison_reelle  DATE;
ALTER TABLE productions ADD COLUMN IF NOT EXISTS stock_verifie          BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE productions ADD COLUMN IF NOT EXISTS bat_valide_client      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE productions ADD COLUMN IF NOT EXISTS sous_traitant_id       UUID REFERENCES fournisseurs(id) ON DELETE SET NULL;
ALTER TABLE productions ADD COLUMN IF NOT EXISTS motif_sous_traitance   TEXT;

-- Un numéro de bon de livraison ne peut être attribué deux fois
CREATE UNIQUE INDEX IF NOT EXISTS productions_numero_bl_unique
  ON productions (numero_bl) WHERE numero_bl IS NOT NULL;

-- ── 3. RÔLES ─────────────────────────────────────────────────
-- L'application n'utilise plus que trois rôles. Les anciens rôles sont convertis
-- (Commercial et Comptabilité ont été fusionnés en Secrétaire/Comptable).
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
UPDATE profiles SET role = 'Secrétaire/Comptable' WHERE role IN ('Commercial', 'Comptabilité');
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'Secrétaire/Comptable';
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('Admin', 'Secrétaire/Comptable', 'Production'));

-- Numérotation : ajout des séries des bons de travail (BT) et des bons de livraison (BL)
ALTER TABLE compteurs_numero DROP CONSTRAINT IF EXISTS compteurs_numero_type_check;
ALTER TABLE compteurs_numero ADD CONSTRAINT compteurs_numero_type_check
  CHECK (type IN ('DV', 'FA', 'BC', 'BT', 'BL'));

-- ── 4. FONCTIONS DE CONTRÔLE D'ACCÈS ─────────────────────────
-- SECURITY DEFINER : évite la récursion RLS (la politique de profiles lit profiles).

CREATE OR REPLACE FUNCTION public.est_actif()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT p.actif FROM profiles p WHERE p.id = auth.uid()), false)
$$;

CREATE OR REPLACE FUNCTION public.est_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT p.actif AND p.role = 'Admin' FROM profiles p WHERE p.id = auth.uid()), false)
$$;

-- ── 5. RLS : données métier → comptes actifs uniquement ──────

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'types_impression','clients','produits','compteurs_numero','devis','devis_lignes',
    'factures','factures_lignes','paiements','fne_transmissions','productions',
    'fournisseurs','bons_commande_fournisseurs','bons_commande_lignes',
    'machines','bons_travail','etapes_fabrication','controles_qualite',
    'charges_fixes','depenses','tarifs_impression','caisse_ouvertures','caisse_operations'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_auth', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_actif', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO authenticated
      USING (est_actif()) WITH CHECK (est_actif())', t || '_actif', t);
  END LOOP;
END $$;

-- ── 6. RLS : tables sensibles ────────────────────────────────

-- Profils : tout compte actif voit l'équipe ; seul un admin crée/supprime ;
-- chacun peut modifier son propre profil, mais le trigger ci-dessous bloque les champs sensibles.
DROP POLICY IF EXISTS "profiles_auth" ON profiles;
DROP POLICY IF EXISTS "profiles_lecture" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_maj" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON profiles;
CREATE POLICY "profiles_lecture" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_admin_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (est_admin());
CREATE POLICY "profiles_maj" ON profiles FOR UPDATE TO authenticated
  USING (est_admin() OR id = auth.uid()) WITH CHECK (est_admin() OR id = auth.uid());
CREATE POLICY "profiles_admin_delete" ON profiles FOR DELETE TO authenticated USING (est_admin());

CREATE OR REPLACE FUNCTION proteger_champs_profil()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- auth.uid() est NULL pour le service role (API d'administration) et le SQL Editor : pas de contrôle.
  IF auth.uid() IS NOT NULL AND NOT est_admin() AND (
       NEW.role        IS DISTINCT FROM OLD.role
    OR NEW.actif       IS DISTINCT FROM OLD.actif
    OR NEW.permissions IS DISTINCT FROM OLD.permissions
  ) THEN
    RAISE EXCEPTION 'Seul un administrateur peut modifier le rôle, l''accès ou les permissions d''un compte';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_proteger ON profiles;
CREATE TRIGGER trg_profiles_proteger BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION proteger_champs_profil();

-- Entreprise et configuration FNE (clé API) : administrateurs seulement.
DROP POLICY IF EXISTS "entreprise_auth" ON entreprise;
DROP POLICY IF EXISTS "entreprise_lecture" ON entreprise;
DROP POLICY IF EXISTS "entreprise_admin" ON entreprise;
CREATE POLICY "entreprise_lecture" ON entreprise FOR SELECT TO authenticated USING (est_actif());
CREATE POLICY "entreprise_admin" ON entreprise FOR ALL TO authenticated
  USING (est_admin()) WITH CHECK (est_admin());

DROP POLICY IF EXISTS "fne_config_auth" ON fne_config;
DROP POLICY IF EXISTS "fne_config_admin" ON fne_config;
CREATE POLICY "fne_config_admin" ON fne_config FOR ALL TO authenticated
  USING (est_admin()) WITH CHECK (est_admin());

-- Journal d'activité : ajout et lecture seulement, jamais de modification ni de suppression.
DROP POLICY IF EXISTS "activite_log_auth" ON activite_log;
DROP POLICY IF EXISTS "activite_log_ajout" ON activite_log;
DROP POLICY IF EXISTS "activite_log_lecture" ON activite_log;
CREATE POLICY "activite_log_lecture" ON activite_log FOR SELECT TO authenticated USING (est_actif());
CREATE POLICY "activite_log_ajout" ON activite_log FOR INSERT TO authenticated WITH CHECK (est_actif());

-- ── 7. GARDE-FOUS : factures certifiées FNE ──────────────────
-- Une facture certifiée doit rester identique (conservation de 10 ans exigée par la DGI).
-- Seule la mise à jour des champs FNE (certification) reste permise.

CREATE OR REPLACE FUNCTION proteger_factures_certifiees()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.fne_certifiee THEN
      RAISE EXCEPTION 'Facture certifiée FNE : suppression interdite (conservation obligatoire)';
    END IF;
    IF EXISTS (SELECT 1 FROM paiements WHERE facture_id = OLD.id) THEN
      RAISE EXCEPTION 'Facture avec paiements enregistrés : suppression interdite';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.fne_certifiee AND (
       NEW.numero, NEW.client_id, NEW.date, NEW.echeance, NEW.remise, NEW.tva_applicable,
       NEW.notes, NEW.template_fne, NEW.payment_method_fne, NEW.is_avoir, NEW.devis_id
     ) IS DISTINCT FROM (
       OLD.numero, OLD.client_id, OLD.date, OLD.echeance, OLD.remise, OLD.tva_applicable,
       OLD.notes, OLD.template_fne, OLD.payment_method_fne, OLD.is_avoir, OLD.devis_id
     ) THEN
    RAISE EXCEPTION 'Facture certifiée FNE : modification interdite';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_factures_certifiees ON factures;
CREATE TRIGGER trg_factures_certifiees BEFORE UPDATE OR DELETE ON factures
  FOR EACH ROW EXECUTE FUNCTION proteger_factures_certifiees();

CREATE OR REPLACE FUNCTION proteger_lignes_facture()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_certifiee BOOLEAN;
BEGIN
  SELECT f.fne_certifiee INTO v_certifiee
  FROM factures f WHERE f.id = COALESCE(NEW.facture_id, OLD.facture_id);
  IF v_certifiee THEN
    RAISE EXCEPTION 'Facture certifiée FNE : les lignes ne peuvent plus être modifiées';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_factures_lignes_certifiees ON factures_lignes;
CREATE TRIGGER trg_factures_lignes_certifiees BEFORE INSERT OR UPDATE OR DELETE ON factures_lignes
  FOR EACH ROW EXECUTE FUNCTION proteger_lignes_facture();

-- ── 8. GARDE-FOUS : caisse ───────────────────────────────────
-- Un jour dont la caisse est fermée ne peut plus recevoir, modifier ou perdre d'opération.

CREATE OR REPLACE FUNCTION proteger_caisse_jour_ferme()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') AND EXISTS (
       SELECT 1 FROM caisse_ouvertures o WHERE o.date = OLD.date AND o.ferme) THEN
    RAISE EXCEPTION 'Caisse du % fermée : opération non modifiable', OLD.date;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND EXISTS (
       SELECT 1 FROM caisse_ouvertures o WHERE o.date = NEW.date AND o.ferme) THEN
    RAISE EXCEPTION 'Caisse du % fermée : impossible d''ajouter une opération ce jour-là', NEW.date;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_caisse_operations_ferme ON caisse_operations;
CREATE TRIGGER trg_caisse_operations_ferme BEFORE INSERT OR UPDATE OR DELETE ON caisse_operations
  FOR EACH ROW EXECUTE FUNCTION proteger_caisse_jour_ferme();

CREATE OR REPLACE FUNCTION proteger_ouverture_fermee()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.ferme THEN
    RAISE EXCEPTION 'Caisse du % déjà fermée : ouverture non modifiable', OLD.date;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_caisse_ouvertures_fermee ON caisse_ouvertures;
CREATE TRIGGER trg_caisse_ouvertures_fermee BEFORE UPDATE OR DELETE ON caisse_ouvertures
  FOR EACH ROW EXECUTE FUNCTION proteger_ouverture_fermee();

-- ── 9. CONVERSION DEVIS → FACTURE (atomique, sans doublon) ───
-- Tout se passe dans une seule transaction : pas de facture orpheline, pas de lignes manquantes.
-- Si une facture existe déjà pour ce devis, elle est renvoyée au lieu d'en créer une seconde.
-- Le verrou FOR UPDATE empêche deux conversions simultanées du même devis.

CREATE OR REPLACE FUNCTION creer_facture_depuis_devis(p_devis_id UUID)
RETURNS factures
LANGUAGE plpgsql
AS $$
DECLARE
  d           devis%ROWTYPE;
  f           factures%ROWTYPE;
  v_template  TEXT;
BEGIN
  SELECT * INTO d FROM devis WHERE id = p_devis_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Devis introuvable';
  END IF;

  SELECT * INTO f FROM factures
   WHERE devis_id = d.id AND is_avoir = false
   ORDER BY created_at LIMIT 1;
  IF FOUND THEN
    RETURN f;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM devis_lignes WHERE devis_id = d.id) THEN
    RAISE EXCEPTION 'Le devis ne contient aucune ligne';
  END IF;

  SELECT c.template_fne_defaut INTO v_template FROM clients c WHERE c.id = d.client_id;

  INSERT INTO factures (numero, client_id, devis_id, date, remise, tva_applicable, notes,
                        template_fne, payment_method_fne)
  VALUES (next_numero('FA', EXTRACT(YEAR FROM now())::INTEGER), d.client_id, d.id, CURRENT_DATE,
          d.remise, d.tva_applicable, d.notes, COALESCE(v_template, 'B2B'), 'cash')
  RETURNING * INTO f;

  INSERT INTO factures_lignes (facture_id, designation, qte, pu, remise_ligne, produit_id, taxes, ordre)
  SELECT f.id, l.designation, l.qte, l.pu, l.remise_ligne, l.produit_id, ARRAY['TVA'], l.ordre
    FROM devis_lignes l
   WHERE l.devis_id = d.id
   ORDER BY l.ordre;

  UPDATE devis SET statut = 'Accepté' WHERE id = d.id;

  RETURN f;
END $$;

-- ── 10. DROITS D'EXÉCUTION ───────────────────────────────────
REVOKE EXECUTE ON FUNCTION next_numero(TEXT, INTEGER) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION next_numero(TEXT, INTEGER) TO authenticated;
REVOKE EXECUTE ON FUNCTION creer_facture_depuis_devis(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION creer_facture_depuis_devis(UUID) TO authenticated;
