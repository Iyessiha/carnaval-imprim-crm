-- ============================================================
-- Migration 00004 — correctifs appliqués sur la base de production
-- (projet Supabase carnaval-imprim-crm, le 2026-10-23).
--
-- Ce fichier reflète ce qui a été exécuté en production. Ne pas le rejouer sur
-- une base qui l'a déjà reçu. La migration 00003 du dépôt NE DOIT PAS être
-- appliquée à la production : elle a été écrite pour un schéma antérieur et
-- chevauche des éléments déjà présents.
-- ============================================================

-- 1. Fonctions d'autorisation
CREATE OR REPLACE FUNCTION public.est_actif()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT p.actif FROM public.profiles p WHERE p.id = auth.uid()), false)
$$;
CREATE OR REPLACE FUNCTION public.est_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT p.actif AND p.role = 'Admin' FROM public.profiles p WHERE p.id = auth.uid()), false)
$$;
REVOKE ALL ON FUNCTION public.est_actif(), public.est_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.est_actif(), public.est_admin() TO authenticated;

-- 2. Fonctions de gestion des comptes remplacées par l'API serveur : plus appelables
REVOKE ALL ON FUNCTION public.admin_set_password(uuid, text), public.admin_toggle_user(uuid, boolean),
                       public.create_user_with_profile(text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.create_user_with_profile(text, text, text, text, text, text) SET search_path = public, extensions;
ALTER FUNCTION public.admin_set_password(uuid, text) SET search_path = public;
ALTER FUNCTION public.admin_toggle_user(uuid, boolean) SET search_path = public;
ALTER FUNCTION public.notify_bon_travail_pret() SET search_path = public;
ALTER FUNCTION public.notify_production_terminee() SET search_path = public;

-- 3. Extensions : unaccent déplacée hors de public. http (non déplacable) : droits retirés.
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- 4. Politiques : accès réservé aux comptes actifs ; rôles obsolètes retirés
ALTER POLICY charges_select ON public.charges_fixes TO authenticated USING (public.est_actif());
ALTER POLICY charges_insert ON public.charges_fixes TO authenticated WITH CHECK (public.est_actif());
ALTER POLICY charges_update ON public.charges_fixes TO authenticated USING (public.est_actif()) WITH CHECK (public.est_actif());
ALTER POLICY charges_delete ON public.charges_fixes TO authenticated USING (public.est_admin());
ALTER POLICY tarifs_select ON public.tarifs_impression TO authenticated USING (public.est_actif());
ALTER POLICY tarifs_insert ON public.tarifs_impression TO authenticated WITH CHECK (public.est_actif());
ALTER POLICY tarifs_update ON public.tarifs_impression TO authenticated USING (public.est_actif()) WITH CHECK (public.est_actif());
ALTER POLICY tarifs_delete ON public.tarifs_impression TO authenticated USING (public.est_admin());
ALTER POLICY notifications_select_authenticated ON public.notifications USING (public.est_actif());
ALTER POLICY notifications_insert_authenticated ON public.notifications WITH CHECK (public.est_actif());
ALTER POLICY notifications_update_authenticated ON public.notifications USING (public.est_actif()) WITH CHECK (public.est_actif());
ALTER POLICY produits_update ON public.produits USING (public.est_actif()) WITH CHECK (public.est_actif());
ALTER POLICY caisse_ops_delete ON public.caisse_operations USING (public.est_actif());
ALTER POLICY depenses_delete ON public.depenses USING (public.est_actif());
ALTER POLICY ecritures_delete ON public.ecritures_comptables USING (public.est_admin());
ALTER POLICY fne_config_select ON public.fne_config USING (public.est_admin());
-- Lecture : seuls les comptes actifs (tables métier) ; les profils restent lisibles par l'équipe
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies
            WHERE schemaname = 'public' AND cmd = 'SELECT' AND qual = 'true' AND tablename <> 'profiles'
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I USING (public.est_actif())', p.policyname, p.tablename);
  END LOOP;
END $$;
ALTER POLICY profiles_insert ON public.profiles WITH CHECK (public.est_admin());

-- 5. Profil : seul un administrateur modifie rôle, accès et permissions
CREATE OR REPLACE FUNCTION public.proteger_champs_profil()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.est_admin() AND (
       NEW.role IS DISTINCT FROM OLD.role OR NEW.actif IS DISTINCT FROM OLD.actif
    OR NEW.permissions IS DISTINCT FROM OLD.permissions) THEN
    RAISE EXCEPTION 'Seul un administrateur peut modifier le rôle, l''accès ou les permissions d''un compte';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_profiles_proteger BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.proteger_champs_profil();
REVOKE ALL ON FUNCTION public.proteger_champs_profil() FROM PUBLIC, anon, authenticated;

-- 6. Factures certifiées FNE figées ; lignes figées ; suppression interdite si certifiée ou payée
CREATE OR REPLACE FUNCTION public.proteger_factures_certifiees()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.fne_certifiee THEN RAISE EXCEPTION 'Facture certifiée FNE : suppression interdite (conservation obligatoire)'; END IF;
    IF EXISTS (SELECT 1 FROM public.paiements WHERE facture_id = OLD.id) THEN RAISE EXCEPTION 'Facture avec paiements enregistrés : suppression interdite'; END IF;
    RETURN OLD;
  END IF;
  IF OLD.fne_certifiee AND (NEW.numero, NEW.client_id, NEW.date, NEW.echeance, NEW.remise, NEW.tva_applicable,
       NEW.notes, NEW.template_fne, NEW.payment_method_fne, NEW.is_avoir, NEW.devis_id)
     IS DISTINCT FROM (OLD.numero, OLD.client_id, OLD.date, OLD.echeance, OLD.remise, OLD.tva_applicable,
       OLD.notes, OLD.template_fne, OLD.payment_method_fne, OLD.is_avoir, OLD.devis_id) THEN
    RAISE EXCEPTION 'Facture certifiée FNE : modification interdite';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_factures_certifiees BEFORE UPDATE OR DELETE ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.proteger_factures_certifiees();

CREATE OR REPLACE FUNCTION public.proteger_lignes_facture()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_certifiee boolean;
BEGIN
  SELECT f.fne_certifiee INTO v_certifiee FROM public.factures f WHERE f.id = COALESCE(NEW.facture_id, OLD.facture_id);
  IF v_certifiee THEN RAISE EXCEPTION 'Facture certifiée FNE : les lignes ne peuvent plus être modifiées'; END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_factures_lignes_certifiees BEFORE INSERT OR UPDATE OR DELETE ON public.factures_lignes
  FOR EACH ROW EXECUTE FUNCTION public.proteger_lignes_facture();

-- 7. Caisse : jour fermé figé
CREATE OR REPLACE FUNCTION public.proteger_caisse_jour_ferme()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') AND EXISTS (SELECT 1 FROM public.caisse_ouvertures o WHERE o.date = OLD.date AND o.ferme) THEN
    RAISE EXCEPTION 'Caisse du % fermée : opération non modifiable', OLD.date;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND EXISTS (SELECT 1 FROM public.caisse_ouvertures o WHERE o.date = NEW.date AND o.ferme) THEN
    RAISE EXCEPTION 'Caisse du % fermée : impossible d''ajouter une opération ce jour-là', NEW.date;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_caisse_operations_ferme BEFORE INSERT OR UPDATE OR DELETE ON public.caisse_operations
  FOR EACH ROW EXECUTE FUNCTION public.proteger_caisse_jour_ferme();

CREATE OR REPLACE FUNCTION public.proteger_ouverture_fermee()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.ferme THEN RAISE EXCEPTION 'Caisse du % déjà fermée : ouverture non modifiable', OLD.date; END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_caisse_ouvertures_fermee BEFORE UPDATE OR DELETE ON public.caisse_ouvertures
  FOR EACH ROW EXECUTE FUNCTION public.proteger_ouverture_fermee();

-- 8. Numérotation : série BL autorisée ; numéro de BL unique ; next_numero non exposé aux visiteurs
ALTER TABLE public.compteurs_numero ADD CONSTRAINT compteurs_numero_type_bl CHECK (type IN ('DV', 'FA', 'BC', 'BT', 'BL'));
ALTER TABLE public.compteurs_numero DROP CONSTRAINT compteurs_numero_type_check;
CREATE UNIQUE INDEX productions_numero_bl_unique ON public.productions (numero_bl) WHERE numero_bl IS NOT NULL;
REVOKE ALL ON FUNCTION public.next_numero(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_numero(text, integer) TO authenticated;

-- 9. Conversion devis → facture atomique et sans doublon
CREATE OR REPLACE FUNCTION public.creer_facture_depuis_devis(p_devis_id uuid)
RETURNS public.factures LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  d public.devis%ROWTYPE;
  f public.factures%ROWTYPE;
  v_template text;
BEGIN
  SELECT * INTO d FROM public.devis WHERE id = p_devis_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Devis introuvable'; END IF;
  SELECT * INTO f FROM public.factures WHERE devis_id = d.id AND is_avoir = false ORDER BY created_at LIMIT 1;
  IF FOUND THEN RETURN f; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.devis_lignes WHERE devis_id = d.id) THEN RAISE EXCEPTION 'Le devis ne contient aucune ligne'; END IF;
  SELECT c.template_fne_defaut INTO v_template FROM public.clients c WHERE c.id = d.client_id;
  INSERT INTO public.factures (numero, client_id, devis_id, date, remise, tva_applicable, notes, template_fne, payment_method_fne)
  VALUES (public.next_numero('FA', EXTRACT(YEAR FROM now())::integer), d.client_id, d.id, CURRENT_DATE,
          d.remise, d.tva_applicable, d.notes, COALESCE(v_template, 'B2B'), 'cash')
  RETURNING * INTO f;
  INSERT INTO public.factures_lignes (facture_id, designation, qte, pu, remise_ligne, produit_id, taxes, ordre)
  SELECT f.id, l.designation, l.qte, l.pu, l.remise_ligne, l.produit_id, ARRAY['TVA'], l.ordre
    FROM public.devis_lignes l WHERE l.devis_id = d.id ORDER BY l.ordre;
  UPDATE public.devis SET statut = 'Accepté' WHERE id = d.id;
  RETURN f;
END $$;
REVOKE ALL ON FUNCTION public.creer_facture_depuis_devis(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.creer_facture_depuis_devis(uuid) TO authenticated;

-- 10. Retrait des droits d'exécution sur la fonction de garde http (non utilisée par l'application)
DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
             JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
             JOIN pg_extension e ON e.oid = d.refobjid
            WHERE e.extname = 'http'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
  END LOOP;
END $$;
